"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ChainGuard } from "@/components/wallet/ChainGuard";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { AppLogo } from "@/components/brand/AppLogo";
import { AttestationNote } from "@/components/layout/AttestationNote";
import { HomeDashboard } from "@/components/home/HomeDashboard";

/** Home shell + connected dashboard (static import — no stale code-split). */
export function HomeClient() {
  const { isConnected } = useAccount();

  return (
    <div className="space-y-10 sm:space-y-14" data-mondoc-home="no-badge">
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
              Revoke risk. Log proof onchain.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            MonDoc is a research-grade toolkit for Monad: deep history approval
            scans, one-click revoke, and onchain cleanup logs — without ever
            custodizing funds.
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
              <div className="text-muted">Proof</div>
              <div className="mt-1 text-foreground">Onchain log</div>
            </div>
          </div>
        </div>
      </section>

      <AttestationNote />

      {isConnected ? (
        <ChainGuard>
          <HomeDashboard />
        </ChainGuard>
      ) : null}
    </div>
  );
}
