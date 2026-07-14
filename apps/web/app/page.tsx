"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { HealthGauge } from "@/components/score/HealthGauge";
import { ScoreHistoryChart } from "@/components/score/ScoreHistoryChart";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useCleanupHistory } from "@/hooks/useCleanupHistory";
import { ConnectButton } from "@/components/wallet/ConnectButton";

function DashboardBody() {
  const { score, label, approvals, approvalsLoading, cleanupCount, hasBadge, eligibleForBadge } =
    useHealthScore();
  const history = useCleanupHistory();

  const high = approvals.filter((a) => a.risk === "high").length;
  const medium = approvals.filter((a) => a.risk === "medium").length;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-6">
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-300/80">
            Wallet Health Score
          </div>
          <HealthGauge score={approvalsLoading ? 0 : score} />
          <p className="mt-4 text-center text-sm text-zinc-400">
            {approvalsLoading
              ? "Calculating from active approvals…"
              : `Status: ${label} · ${cleanupCount} onchain cleanup(s)`}
          </p>
          {hasBadge ? (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200">
              🏅 Cleanup Badge minted (soulbound)
            </div>
          ) : eligibleForBadge ? (
            <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-center text-sm text-violet-200">
              Score ≥ 80 — badge ready to mint on the next logCleanup
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <StatCard
            title="Active approvals"
            value={approvalsLoading ? "…" : String(approvals.length)}
            hint="From eth_getLogs + eth_call scan"
          />
          <StatCard
            title="High risk"
            value={approvalsLoading ? "…" : String(high)}
            hint="Unlimited to unknown contracts"
            danger={high > 0}
          />
          <StatCard
            title="Medium risk"
            value={approvalsLoading ? "…" : String(medium)}
            hint="Unlimited known / large allowance"
          />
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreHistoryChart history={history.data ?? []} />
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-lg font-semibold text-white">Start your check-up</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Scan risky approvals, revoke in one click, log onchain, and earn a badge.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/scan"
              className="rounded-xl bg-[#836EF9] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#6f5ad4]"
            >
              Open Approval Scanner →
            </Link>
            <Link
              href="/tx-explainer"
              className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              Explain a failed transaction
            </Link>
            <Link
              href="/history"
              className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-zinc-200 hover:bg-white/5"
            >
              View onchain cleanup history
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
  danger,
}: {
  title: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {title}
      </div>
      <div
        className={`mt-2 text-3xl font-bold tabular-nums ${
          danger ? "text-red-400" : "text-white"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{hint}</div>
    </div>
  );
}

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#836EF9]/15 via-transparent to-emerald-500/5 px-6 py-12 sm:px-10">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Monad Testnet &amp; Mainnet
          </div>
          <h1 className="text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Check your wallet health.
            <span className="block bg-gradient-to-r from-violet-200 to-emerald-300 bg-clip-text text-transparent">
              Revoke risky approvals. Prove it onchain.
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-400">
            Wallet Doctor scans risky token approvals, helps you revoke in one click,
            explains failed transactions, and logs cleanups to a smart contract —
            plus a security score &amp; soulbound badge.
          </p>
          {!isConnected && (
            <div className="mt-6">
              <ConnectButton />
            </div>
          )}
        </div>
      </section>

      <ChainGuard>
        <DashboardBody />
      </ChainGuard>
    </div>
  );
}
