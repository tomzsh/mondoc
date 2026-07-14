"use client";

import { ChainGuard } from "@/components/wallet/ChainGuard";
import { ApprovalTable } from "@/components/approval/ApprovalTable";
import { HealthGauge } from "@/components/score/HealthGauge";
import { useHealthScore } from "@/hooks/useHealthScore";

export default function ScanPage() {
  const { score, approvals, approvalsLoading, approvalsError } = useHealthScore();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Approval Scanner</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Fetch Approval / ApprovalForAll events, check active allowances, classify
          risk, then revoke directly from your wallet.
        </p>
      </div>

      <ChainGuard>
        <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <HealthGauge score={approvalsLoading ? 0 : score} size={160} />
          </div>
          <div className="space-y-3">
            {approvalsError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Scan failed: {(approvalsError as Error).message?.slice(0, 200)}
                <div className="mt-1 text-xs text-red-200/70">
                  Public RPCs often rate-limit eth_getLogs. Set{" "}
                  <code className="rounded bg-black/30 px-1">
                    NEXT_PUBLIC_MONAD_TESTNET_RPC
                  </code>{" "}
                  to a paid provider, or reduce lookback blocks.
                </div>
              </div>
            )}
            <ApprovalTable approvals={approvals} />
          </div>
        </div>
      </ChainGuard>
    </div>
  );
}
