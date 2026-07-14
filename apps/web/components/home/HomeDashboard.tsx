"use client";

import Link from "next/link";
import { HealthGauge } from "@/components/score/HealthGauge";
import { ScoreHistoryChart } from "@/components/score/ScoreHistoryChart";
import { useHealthScore } from "@/hooks/useHealthScore";
import { useCleanupHistory } from "@/hooks/useCleanupHistory";
import { cn } from "@/lib/utils";

/**
 * Dashboard (scan hooks + charts). Loaded only when wallet is connected.
 */
export function HomeDashboard() {
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
  const showScore = !approvalsLoading;

  return (
    <div className="space-y-8 sm:space-y-10" data-mondoc-dashboard="no-badge">
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
            {!showScore ? (
              <span className="inline-flex items-center justify-center gap-1">
                Scanning approvals
                <span className="scan-loader-dots" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              </span>
            ) : (
              <>
                {label} · {cleanupCount} cleanup(s)
                {approvalsRefreshing ? (
                  <span className="ml-1 inline-flex items-center text-accent">
                    · refresh
                    <span className="scan-loader-dots" aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                ) : null}
              </>
            )}
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
            Scan approval surfaces, revoke risk, and commit cleanup logs
            onchain — without ever custodizing funds.
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
