"use client";

import Link from "next/link";
import { GithubLogo, XLogo } from "@phosphor-icons/react";
import { AppWordmark } from "@/components/brand/AppLogo";

const TWITTER = "https://x.com/0xTomzsh";
const GITHUB = "https://github.com/tomzsh/mondoc";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.2fr_1fr] sm:px-6 sm:py-12">
        <div className="space-y-4">
          <AppWordmark size={32} showTagline />
          <p className="max-w-md text-sm leading-relaxed text-muted">
            Clinical diagnostics for onchain wallets on Monad. We never custody
            funds — revokes hit the token contract directly. Cleanup proof is
            written onchain.
          </p>
          <div className="flex flex-wrap gap-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <span>OUTPUT · SCORE</span>
            <span>SEED · APPROVALS</span>
            <span>COMMIT · REVOKE</span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <a
              href={TWITTER}
              target="_blank"
              rel="noreferrer"
              className="ui-btn-secondary !w-auto !min-h-9 px-3"
            >
              <XLogo size={14} weight="regular" />
              @0xTomzsh
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              className="ui-btn-secondary !w-auto !min-h-9 px-3"
            >
              <GithubLogo size={14} weight="regular" />
              GitHub
            </a>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:text-right">
            Built for{" "}
            <a
              href="https://www.monad.xyz"
              target="_blank"
              rel="noreferrer"
              className="text-foreground"
            >
              Monad
            </a>
            {" · "}
            <Link href="/" className="text-foreground">
              MonDoc
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} MonDoc</span>
          <span>Open source · No custody · Onchain log</span>
        </div>
      </div>
    </footer>
  );
}
