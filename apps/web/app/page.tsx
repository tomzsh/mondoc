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
import { AppLogo } from "@/components/brand/AppLogo";
import { AttestationNote } from "@/components/layout/AttestationNote";
import { cn } from "@/lib/utils";

function DashboardBody() {
  const {
    score,
    label,
    approvals,
    approvalsLoading,
    approvalsRefreshing,
    cleanupCount,
  } = useHealthScore();
  const history = useCleanupHistory();

  const high = approvals.filter((a) => a.risk === "high").length;
  const medium = approvals.filter((a) => a.risk === "medium").length;
  // Only blank on true first load — keep score live during background rescan
  const showScore = !approvalsLoading;

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="grid gap-px border border-border bg-border lg:grid-cols-[1.1fr_1fr]">
        <section className="bg-surface p-6 sm:p-8">
          <div className="section-kicker">Live diagnostics</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Wallet health score
          </h2>
          <HealthGauge
            score={showScore ? score : 0}
            className="mx-auto mt-6 max-w-[200px]"
          />
          <p className="mt-4 text-center text-sm text-muted">
            {!showScore
              ? "Calculating from active approvals…"
              : `${label} · ${cleanupCount} cleanup(s)${
                  approvalsRefreshing ? " · refreshing…" : ""
                }`}
          </p>
          <div className="mt-4 flex justify-center gap-6 border-t border-border pt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            <span>
              OUTPUT{" "}
              <span className="text-foreground">
                {showScore ? score : "—"}
              </span>
            </span>
            <span>
              SEED{" "}
              <span className="text-foreground">
                {showScore ? approvals.length : "—"}
              </span>
            </span>
          </div>
        </section>

        <section className="grid grid-cols-1 divide-y divide-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 lg:grid-cols-1 lg:divide-x-0 lg:divide-y xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          <StatCard
            kicker="Approvals"
            title="Active"
            value={showScore ? String(approvals.length) : "…"}
            hint="Live allowance set"
          />
          <StatCard
            kicker="Risk"
            title="High"
            value={showScore ? String(high) : "…"}
            hint="Unlimited · unknown"
            danger={high > 0}
          />
          <StatCard
            kicker="Risk"
            title="Medium"
            value={showScore ? String(medium) : "…"}
            hint="Known / large"
          />
        </section>
      </div>

      <BadgeNftCard />

      <div className="grid gap-px border border-border bg-border lg:grid-cols-2">
        <div className="bg-surface p-6 sm:p-8">
          <div className="section-kicker">Onchain history</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Score trajectory
          </h2>
          <div className="mt-4">
            <ScoreHistoryChart history={history.data ?? []} />
          </div>
        </div>
        <div className="bg-surface p-6 sm:p-8">
          <div className="section-kicker">Protocol</div>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">
            Run a check-up
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Scan approval surfaces, revoke exposure, commit cleanup logs, and
            mint a soulbound proof when onchain score ≥ 80.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/scan" className="ui-btn !w-full">
              Open scanner
            </Link>
            <Link href="/history" className="ui-btn-secondary !w-full">
              View cleanup log
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  kicker,
  title,
  value,
  hint,
  danger,
}: {
  kicker: string;
  title: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="bg-surface p-5 sm:p-6">
      <div className="section-kicker">{kicker}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{title}</div>
      <div
        className={cn(
          "mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl",
          danger ? "text-danger" : "text-foreground",
        )}
      >
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        {hint}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-10 sm:space-y-14">
      <section className="hero-panel p-6 sm:p-10 lg:p-12">
        <div className="relative z-[1] max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <AppLogo size={40} />
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
              <span className="text-foreground">Language</span> · Approvals
              {" · "}
              <span className="text-foreground">Output</span> · Score
            </div>
          </div>

          <p className="section-kicker">Monad wallet diagnostics</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.08]">
            Clinical scans for token approvals.
            <span className="mt-2 block text-muted">
              Revoke risk. Log proof. Mint a badge.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            MonDoc is a research-grade toolkit for Monad: deep history
            approval scans, one-click revoke, onchain cleanup logs, and a
            soulbound health badge — without ever custodizing funds.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            {!isConnected ? (
              <div className="max-w-xs">
                <ConnectButton />
              </div>
            ) : (
              <Link href="/scan" className="ui-btn">
                Start scan
              </Link>
            )}
            <Link href="/history" className="ui-btn-secondary">
              Cleanup history
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-border pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            <div>
              <div className="text-muted">Commit</div>
              <div className="mt-1 text-foreground">No custody</div>
            </div>
            <div>
              <div className="text-muted">Network</div>
              <div className="mt-1 text-foreground">Testnet · Mainnet</div>
            </div>
            <div>
              <div className="text-muted">Badge</div>
              <div className="mt-1 text-foreground">Soulbound NFT</div>
            </div>
          </div>
        </div>
      </section>

      <AttestationNote />

      <ChainGuard>
        <DashboardBody />
      </ChainGuard>
    </div>
  );
}
