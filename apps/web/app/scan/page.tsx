"use client";

import { ChainGuard } from "@/components/wallet/ChainGuard";
import { ApprovalTable } from "@/components/approval/ApprovalTable";
import { HealthGauge } from "@/components/score/HealthGauge";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useUiStore } from "@/lib/store";
import { getScanRange } from "@/lib/scanner/scanRanges";

export default function ScanPage() {
  const { score, approvals, approvalsLoading, approvalsError } = useHealthScore();
  const scanRangeId = useUiStore((s) => s.scanRangeId);
  const range = getScanRange(scanRangeId);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <h1 className="page-title">Approval Scanner</h1>
        <p className="page-desc">
          Scans Approval / ApprovalForAll logs back through chain history, then checks
          which allowances are still active. Use <strong>All history</strong> to
          include very old approvals.
        </p>
      </div>

      <ChainGuard>
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[200px_1fr]">
          <div className="ui-card space-y-3 p-4">
            <HealthGauge
              score={approvalsLoading ? 0 : score}
              size={140}
              className="mx-auto max-w-[180px]"
            />
            <p className="text-center text-[11px] text-muted">
              Scan: <span className="font-medium text-foreground">{range.label}</span>
            </p>
          </div>
          <div className="min-w-0 space-y-3">
            {approvalsError && (
              <div className="ui-card break-words border-danger/30 bg-danger/5 p-4 text-sm text-danger">
                <p className="font-semibold">
                  Scan failed: {(approvalsError as Error).message?.slice(0, 200)}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Public RPCs often rate-limit deep eth_getLogs. Try a shorter range
                  (7d / 30d), or set a paid RPC in{" "}
                  <code className="rounded bg-surface px-1">NEXT_PUBLIC_MONAD_*_RPC</code>.
                </p>
              </div>
            )}
            <ApprovalTable approvals={approvals} />
          </div>
        </div>
      </ChainGuard>
    </div>
  );
}
