/**
 * Central React Query cache policy for MonDoc.
 *
 * Approvals scans (HyperSync) are expensive → long staleTime, optimistic local
 * updates after revoke, and a "tombstone" set so stale rescans cannot resurrect
 * pairs the user just revoked.
 */

import type { QueryClient } from "@tanstack/react-query";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { approvalKey } from "@/lib/store";

/** Full chain scan — treat as fresh for 3 minutes unless user hits Rescan */
export const APPROVALS_STALE_MS = 3 * 60_000;
export const APPROVALS_GC_MS = 30 * 60_000;

/** Onchain log history — cheap eth_call */
export const HISTORY_STALE_MS = 30_000;
export const HISTORY_GC_MS = 10 * 60_000;

export const approvalsQueryKeyRoot = ["approvals"] as const;

export function filterRevokedApprovals(
  list: ClassifiedApproval[] | undefined,
  revokedKeys: ReadonlySet<string> | readonly string[],
): ClassifiedApproval[] {
  if (!list?.length) return list ?? [];
  const set =
    revokedKeys instanceof Set ? revokedKeys : new Set(revokedKeys);
  if (set.size === 0) return list;
  return list.filter((a) => !set.has(approvalKey(a.token, a.spender)));
}

/**
 * Apply optimistic removes across all range caches and cancel in-flight scans
 * so a finishing HyperSync page cannot overwrite the optimistic list.
 */
export function applyOptimisticRevokes(
  queryClient: QueryClient,
  items: ClassifiedApproval[],
): void {
  if (items.length === 0) return;
  const drop = new Set(items.map((a) => approvalKey(a.token, a.spender)));

  // Stop any in-flight full scan first
  void queryClient.cancelQueries({ queryKey: approvalsQueryKeyRoot });

  queryClient.setQueriesData<ClassifiedApproval[]>(
    { queryKey: approvalsQueryKeyRoot },
    (old) => {
      if (!old) return old;
      return old.filter((a) => !drop.has(approvalKey(a.token, a.spender)));
    },
  );
}

/** Safe walk of wagmi keys (may contain BigInt) — never JSON.stringify. */
export function queryKeyHas(
  key: readonly unknown[],
  needles: string[],
): boolean {
  const stack: unknown[] = [...key];
  while (stack.length) {
    const cur = stack.pop();
    if (typeof cur === "string") {
      for (const n of needles) {
        if (cur === n || cur.includes(n)) return true;
      }
    } else if (Array.isArray(cur)) {
      for (const v of cur) stack.push(v);
    } else if (cur && typeof cur === "object") {
      for (const [k, v] of Object.entries(cur as Record<string, unknown>)) {
        stack.push(k, v);
      }
    }
  }
  return false;
}

export const LIGHT_READ_NEEDLES = [
  "historyLength",
  "cleanupCount",
  "currentScore",
  "getHistoryPage",
] as const;

/** Invalidate cheap onchain reads only (no HyperSync). */
export function invalidateLightReads(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["cleanup-history"] });
  void queryClient.invalidateQueries({
    predicate: (q) => queryKeyHas(q.queryKey, [...LIGHT_READ_NEEDLES]),
  });
}
