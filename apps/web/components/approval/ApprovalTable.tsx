"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { ApprovalRow, rowKey } from "./ApprovalRow";
import { ApprovalCard } from "./ApprovalCard";
import { ScanRangePicker } from "./ScanRangePicker";
import { useUiStore } from "@/lib/store";
import { useRevoke } from "@/hooks/useRevoke";
import { useHealthScore } from "@/hooks/useHealthScore";
import { getScanRange } from "@/lib/scanner/scanRanges";
import { monadMainnet } from "@/lib/wagmi";
import { cn } from "@/lib/utils";

export function ApprovalTable({ approvals }: { approvals: ClassifiedApproval[] }) {
  const { chainId } = useAccount();
  const riskFilter = useUiStore((s) => s.riskFilter);
  const setRiskFilter = useUiStore((s) => s.setRiskFilter);
  const selectedKeys = useUiStore((s) => s.selectedKeys);
  const toggleSelected = useUiStore((s) => s.toggleSelected);
  const clearSelected = useUiStore((s) => s.clearSelected);
  const scanProgress = useUiStore((s) => s.scanProgress);
  const scanRangeId = useUiStore((s) => s.scanRangeId);
  const { revokeOne, revokeMany, busy } = useRevoke();
  const { cleanupCount, refetchApprovals, approvalsLoading } = useHealthScore();

  const range = getScanRange(scanRangeId);

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

  const counts = useMemo(
    () => ({
      all: approvals.length,
      high: approvals.filter((a) => a.risk === "high").length,
      medium: approvals.filter((a) => a.risk === "medium").length,
      low: approvals.filter((a) => a.risk === "low").length,
    }),
    [approvals],
  );

  return (
    <div className="ui-table-wrap">
      <div className="space-y-3 border-b border-border bg-accent-soft/30 p-3 sm:p-4">
        {/* Never fully disable — user must be able to leave a stuck "All" scan */}
        <ScanRangePicker scanning={approvalsLoading} />

        <div className="scroll-x flex gap-1.5">
          {(
            [
              ["all", `All (${counts.all})`],
              ["high", `High (${counts.high})`],
              ["medium", `Med (${counts.medium})`],
              ["low", `Low (${counts.low})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setRiskFilter(key)}
              className={cn(
                "ui-chip shrink-0",
                riskFilter === key && "border-accent bg-accent-soft text-accent",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted">
            Range: <span className="font-medium text-foreground">{range.label}</span>
            {range.lookbackBlocks === null
              ? " · from genesis (includes old approvals)"
              : ` · ~${range.lookbackBlocks.toLocaleString()} blocks`}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => refetchApprovals()}
              disabled={approvalsLoading}
              className="ui-btn-secondary !min-h-9 text-xs sm:!w-auto"
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
                className="ui-btn-danger !min-h-9 text-xs sm:!w-auto"
              >
                Revoke {selected.length} selected
              </button>
            )}
          </div>
        </div>
      </div>

      {scanProgress && (
        <div className="break-words border-b border-border bg-accent-soft px-3 py-2.5 font-mono text-[11px] leading-relaxed text-accent sm:px-4 sm:text-xs">
          {scanProgress}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="px-4 py-12 text-center sm:py-16">
          <p className="text-lg font-semibold">
            {approvalsLoading ? "Scanning approvals…" : "No active approvals"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            {approvalsLoading
              ? range.lookbackBlocks === null
                ? "Full-history scan can take several minutes on public RPCs. Leave this tab open."
                : "eth_getLogs can take a while — hang tight."
              : "Nothing active in this range. Try “All history” to include older approvals."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3 sm:hidden">
            {filtered.map((a) => {
              const key = rowKey(a);
              return (
                <ApprovalCard
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
          </div>

          <div className="hidden scroll-x sm:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-medium uppercase tracking-wide text-muted">
                  <th className="px-3 py-3" />
                  <th className="px-3 py-3">Token</th>
                  <th className="px-3 py-3">Spender</th>
                  <th className="px-3 py-3">Allowance</th>
                  <th className="px-3 py-3">Risk</th>
                  <th className="px-3 py-3 text-right">Action</th>
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
        </>
      )}
    </div>
  );
}
