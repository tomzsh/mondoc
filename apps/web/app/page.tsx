"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { HealthGauge } from "@/components/score/HealthGauge";
import { ScoreHistoryChart } from "@/components/score/ScoreHistoryChart";
import { BadgeNftCard } from "@/components/score/BadgeNftCard";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useCleanupHistory } from "@/hooks/useCleanupHistory";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { cn } from "@/lib/utils";

function DashboardBody() {
  const { score, label, approvals, approvalsLoading, cleanupCount } =
    useHealthScore();
  const history = useCleanupHistory();

  const high = approvals.filter((a) => a.risk === "high").length;
  const medium = approvals.filter((a) => a.risk === "medium").length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1.15fr]">
        <section className="ui-card p-5 sm:p-6">
          <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
            Live Wallet Health Score
          </div>
          <HealthGauge score={approvalsLoading ? 0 : score} className="mx-auto max-w-[200px]" />
          <p className="mt-3 text-center text-sm text-muted">
            {approvalsLoading
              ? "Calculating from active approvals…"
              : `${label} · ${cleanupCount} onchain cleanup(s)`}
          </p>
          <p className="mt-1 text-center text-xs text-muted">
            Live score from scan · separate from NFT score below
          </p>
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <StatCard
            title="Active approvals"
            value={approvalsLoading ? "…" : String(approvals.length)}
            hint="eth_getLogs + eth_call"
          />
          <StatCard
            title="High risk"
            value={approvalsLoading ? "…" : String(high)}
            hint="Unlimited · unknown"
            danger={high > 0}
          />
          <StatCard
            title="Medium risk"
            value={approvalsLoading ? "…" : String(medium)}
            hint="Unlimited known / large"
          />
        </section>
      </div>

      {/* Soulbound Cleanup Badge NFT + onchain/mint score */}
      <BadgeNftCard />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <ScoreHistoryChart history={history.data ?? []} />
        <div className="ui-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight">Start your check-up</h2>
          <p className="mt-1.5 text-sm text-muted">
            Scan risky approvals, revoke in one click, log onchain, and earn a badge.
          </p>
          <div className="mt-5 flex flex-col gap-2.5">
            <Link href="/scan" className="ui-btn !w-full">
              Open Approval Scanner
            </Link>
            <Link href="/history" className="ui-btn-secondary !w-full">
              View cleanup history
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
    <div className="ui-card p-4 sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{title}</div>
      <div
        className={cn(
          "mt-1 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
          danger ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-muted">{hint}</div>
    </div>
  );
}

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-8 sm:space-y-10">
      <section className="ui-card overflow-hidden bg-gradient-to-br from-accent to-accent-hover p-6 text-white sm:p-10">
        <div className="max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-2" />
            Monad Testnet &amp; Mainnet
          </div>
          <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-4xl">
            Check your wallet health.
            <span className="mt-1 block text-white/85">
              Revoke risky approvals. Prove it onchain.
            </span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
            Scan token approvals, revoke in one click, and log cleanups to a smart
            contract — with a security score and soulbound badge on Monad.
          </p>
          {!isConnected && (
            <div className="mt-6 max-w-xs">
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
