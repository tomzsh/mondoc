"use client";

import { useBadgeNft } from "@/hooks/useBadgeNft";
import { scoreColor, scoreLabel } from "@/lib/score/calculateScore";
import { cn } from "@/lib/utils";
import { getExplorerAddressUrl } from "@/lib/wagmi";
import { useAccount } from "wagmi";

/**
 * Soulbound Cleanup Badge NFT + onchain score panel for the dashboard.
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
      <section className={cn("ui-card p-5 sm:p-6", className)}>
        <Header />
        <p className="mt-3 text-sm text-muted">
          Badge contract not configured for this network.
        </p>
      </section>
    );
  }

  return (
    <section className={cn("ui-card overflow-hidden p-5 sm:p-6", className)}>
      <Header />

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* NFT visual */}
        <div
          className={cn(
            "relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-2 sm:mx-0",
            hasBadge
              ? "border-accent bg-gradient-to-br from-accent/20 via-accent-2/15 to-accent-3/20"
              : "border-dashed border-border bg-accent-soft/40",
          )}
        >
          {loading ? (
            <span className="text-xs text-muted">…</span>
          ) : hasBadge ? (
            <div className="text-center">
              <div className="text-3xl" aria-hidden>
                🏅
              </div>
              <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                WDCB
              </div>
              {tokenId != null && (
                <div className="font-mono text-[10px] text-muted">
                  #{tokenId}
                </div>
              )}
            </div>
          ) : (
            <div className="px-2 text-center text-xs text-muted">
              Not
              <br />
              minted
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">
                {hasBadge ? "NFT score at mint" : "Onchain score"}
              </div>
              <div
                className="mt-0.5 text-4xl font-semibold tabular-nums tracking-tight"
                style={{ color }}
              >
                {loading
                  ? "…"
                  : displayScore != null
                    ? displayScore
                    : "—"}
              </div>
              {displayScore != null && !loading && (
                <div className="mt-0.5 text-sm text-muted">
                  {scoreLabel(displayScore)}
                </div>
              )}
            </div>

            <span
              className={cn(
                "ui-badge",
                hasBadge
                  ? "bg-success/15 text-success"
                  : "bg-accent-soft text-accent",
              )}
            >
              {loading ? "…" : hasBadge ? "Minted · soulbound" : "Not minted"}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
            <Meta
              label="Onchain score"
              value={
                loading
                  ? "…"
                  : onchainScore != null
                    ? String(onchainScore)
                    : "0"
              }
            />
            <Meta
              label="Mint threshold"
              value={`≥ ${threshold}`}
            />
            <Meta
              label="Token ID"
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
            <p className="rounded-xl bg-accent-soft px-3 py-2 text-xs font-medium text-accent">
              Score ≥ {threshold} — badge can mint after the next{" "}
              <code className="font-mono">logCleanup</code>.
            </p>
          )}
          {!hasBadge &&
            (onchainScore == null || onchainScore < threshold) && (
              <p className="text-xs text-muted">
                Revoke risky approvals and log cleanups until onchain score
                reaches {threshold} to mint the soulbound NFT.
              </p>
            )}
          {hasBadge && (
            <p className="text-xs text-muted">
              Soulbound proof of a healthy wallet. Non-transferable.
              {badgeAddress && chainId ? (
                <>
                  {" "}
                  <a
                    href={getExplorerAddressUrl(chainId, badgeAddress)}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-accent underline-offset-2 hover:underline"
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
      <div className="text-xs font-medium uppercase tracking-wide text-muted">
        Cleanup Badge NFT
      </div>
      <h2 className="mt-0.5 text-lg font-semibold tracking-tight">
        Wallet Doctor Badge
      </h2>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-2.5 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-foreground">
        {value}
      </dd>
    </div>
  );
}
