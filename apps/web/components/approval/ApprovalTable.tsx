"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { ApprovalRow, rowKey } from "./ApprovalRow";
import { useUiStore } from "@/lib/store";
import { useRevoke } from "@/hooks/useRevoke";
import { useHealthScore } from "@/hooks/useHealthScore";
import { monadMainnet } from "@/lib/wagmi";

export function ApprovalTable({ approvals }: { approvals: ClassifiedApproval[] }) {
  const { chainId } = useAccount();
  const riskFilter = useUiStore((s) => s.riskFilter);
  const setRiskFilter = useUiStore((s) => s.setRiskFilter);
  const selectedKeys = useUiStore((s) => s.selectedKeys);
  const toggleSelected = useUiStore((s) => s.toggleSelected);
  const clearSelected = useUiStore((s) => s.clearSelected);
  const scanProgress = useUiStore((s) => s.scanProgress);
  const { revokeOne, revokeMany, busy } = useRevoke();
  const { cleanupCount, refetchApprovals, approvalsLoading } = useHealthScore();

  const filtered = useMemo(() => {
    if (riskFilter === "all") return approvals;
    return approvals.filter((a) => a.risk === riskFilter);
  }, [approvals, riskFilter]);

  const selected = useMemo(
    () => filtered.filter((a) => selectedKeys.includes(rowKey(a))),
    [filtered, selectedKeys],
  );

  const explorerBase =
    chainId === monadMainnet.id
      ? "https://monadvision.com"
      : "https://testnet.monadexplorer.com";

  const counts = useMemo(() => {
    return {
      all: approvals.length,
      high: approvals.filter((a) => a.risk === "high").length,
      medium: approvals.filter((a) => a.risk === "medium").length,
      low: approvals.filter((a) => a.risk === "low").length,
    };
  }, [approvals]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `All (${counts.all})`],
              ["high", `High (${counts.high})`],
              ["medium", `Medium (${counts.medium})`],
              ["low", `Low (${counts.low})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRiskFilter(key)}
              className={
                riskFilter === key
                  ? "rounded-lg bg-violet-500/20 px-3 py-1 text-xs font-medium text-violet-200 ring-1 ring-violet-400/40"
                  : "rounded-lg bg-white/5 px-3 py-1 text-xs font-medium text-zinc-400 hover:text-white"
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetchApprovals()}
            disabled={approvalsLoading}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5 disabled:opacity-50"
          >
            {approvalsLoading ? "Scanning…" : "Rescan"}
          </button>
          {selected.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                void revokeMany(selected, approvals, cleanupCount);
                clearSelected();
              }}
              className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              Revoke {selected.length} selected
            </button>
          )}
        </div>
      </div>

      {scanProgress && (
        <div className="border-b border-white/5 bg-violet-500/10 px-4 py-2 text-xs text-violet-200">
          {scanProgress}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="px-4 py-16 text-center">
          <p className="text-lg font-medium text-white">
            {approvalsLoading ? "Scanning approvals…" : "No active approvals"}
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            {approvalsLoading
              ? "eth_getLogs can take a while on public RPCs — hang tight."
              : "Your wallet looks clean in the current scan range. 🎉"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-wider text-zinc-500">
                <th className="px-3 py-2 font-medium" />
                <th className="px-3 py-2 font-medium">Token</th>
                <th className="px-3 py-2 font-medium">Spender</th>
                <th className="px-3 py-2 font-medium">Allowance</th>
                <th className="px-3 py-2 font-medium">Risk</th>
                <th className="px-3 py-2 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const key = rowKey(a);
                return (
                  <ApprovalRow
                    key={key}
                    approval={a}
                    selected={selectedKeys.includes(key)}
                    onToggle={() => toggleSelected(key)}
                    onRevoke={() => void revokeOne(a, approvals, cleanupCount)}
                    revoking={busy}
                    explorerBase={explorerBase}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
