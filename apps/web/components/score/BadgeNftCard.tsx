"use client";

import { useBadgeNft } from "@/hooks/useBadgeNft";
import { scoreColor, scoreLabel } from "@/lib/score/calculateScore";
import { cn } from "@/lib/utils";
import { getExplorerAddressUrl } from "@/lib/wagmi";
import { useAccount } from "wagmi";
import { AppLogo } from "@/components/brand/AppLogo";

/**
 * Soulbound Cleanup Badge NFT + onchain score panel.
 */
export function BadgeNftCard({ className }: { className?: string }) {
  const { chainId } = useAccount();
  const {
    hasBadge,
    onchainScore,
    scoreAtMint,
    tokenId,
    threshold,
    badgeAddress,
    configured,
    loading,
  } = useBadgeNft();

  const displayScore = hasBadge
    ? (scoreAtMint ?? onchainScore)
    : onchainScore;
  const color =
    displayScore != null ? scoreColor(displayScore) : "var(--muted)";

  if (!configured) {
    return (
      <section className={cn("border border-border bg-surface p-6 sm:p-8", className)}>
        <Header />
        <p className="mt-3 text-sm text-muted">
          Badge contract not configured for this network.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("border border-border bg-surface p-6 sm:p-8", className)}>
      <Header />

      <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div
          className={cn(
            "relative mx-auto flex h-32 w-32 shrink-0 items-center justify-center border sm:mx-0",
            hasBadge
              ? "border-foreground bg-accent-soft"
              : "border-dashed border-border-strong bg-background",
          )}
        >
          {loading ? (
            <span className="font-mono text-xs text-muted">…</span>
          ) : hasBadge ? (
            <div className="text-center">
              <AppLogo size={48} />
              <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                WDCB
              </div>
              {tokenId != null && (
                <div className="font-mono text-[10px] text-foreground">
                  #{tokenId}
                </div>
              )}
            </div>
          ) : (
            <div className="px-3 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              Not
              <br />
              minted
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="section-kicker">
                {hasBadge ? "NFT score at mint" : "Onchain score"}
              </div>
              <div
                className="mt-1 font-mono text-5xl font-semibold tabular-nums tracking-tight"
                style={{ color }}
              >
                {loading
                  ? "…"
                  : displayScore != null
                    ? displayScore
                    : "—"}
              </div>
              {displayScore != null && !loading && (
                <div className="mt-1 text-sm text-muted">
                  {scoreLabel(displayScore)}
                </div>
              )}
            </div>

            <span
              className={cn(
                "ui-badge",
                hasBadge ? "border-success text-success" : "text-muted",
              )}
            >
              {loading ? "…" : hasBadge ? "Minted · soulbound" : "Not minted"}
            </span>
          </div>

          <dl className="grid grid-cols-3 gap-px border border-border bg-border">
            <Meta
              label="Onchain"
              value={
                loading
                  ? "…"
                  : onchainScore != null
                    ? String(onchainScore)
                    : "0"
              }
            />
            <Meta label="Threshold" value={`≥ ${threshold}`} />
            <Meta
              label="Token"
              value={
                hasBadge
                  ? tokenId != null
                    ? `#${tokenId}`
                    : "…"
                  : "—"
              }
            />
          </dl>

          {!hasBadge && onchainScore != null && onchainScore >= threshold && (
            <p className="border border-border bg-accent-soft px-3 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-foreground">
              Score ≥ {threshold} — badge ready after next logCleanup
            </p>
          )}
          {!hasBadge &&
            (onchainScore == null || onchainScore < threshold) && (
              <p className="text-sm text-muted">
                Revoke risky approvals and log cleanups until onchain score
                reaches {threshold} to mint the soulbound NFT.
              </p>
            )}
          {hasBadge && (
            <p className="text-sm text-muted">
              Soulbound self-attested cleanup badge (score stored at mint).
              {badgeAddress && chainId ? (
                <>
                  {" "}
                  <a
                    href={getExplorerAddressUrl(chainId, badgeAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="ui-link"
                  >
                    View contract
                  </a>
                </>
              ) : null}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <div>
      <div className="section-kicker">Cleanup Badge NFT</div>
      <h2 className="mt-1 text-lg font-semibold tracking-tight">
        Wallet Doctor Badge
      </h2>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-3 py-2.5">
      <dt className="section-kicker">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
