"use client";

import { formatAllowance, shortAddress, cn } from "@/lib/utils";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { RiskBadge } from "./RiskBadge";
import { getSpenderLabel } from "@/lib/scanner/knownSpenders";

interface Props {
  approval: ClassifiedApproval;
  selected: boolean;
  onToggle: () => void;
  onRevoke: () => void;
  revoking?: boolean;
  explorerBase?: string;
}

export function ApprovalCard({
  approval,
  selected,
  onToggle,
  onRevoke,
  revoking,
  explorerBase,
}: Props) {
  const symbol = approval.tokenSymbol || shortAddress(approval.token, 3);
  const spenderLabel = getSpenderLabel(approval.spender);
  const amount =
    approval.kind === "erc20"
      ? formatAllowance(approval.allowance, approval.decimals ?? 18)
      : "All NFTs";

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-surface p-3.5",
        approval.risk === "high" && "border-danger/25 bg-danger/[0.03]",
        selected && "ring-2 ring-[var(--ring)]",
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-[var(--accent)]"
          aria-label="Select approval"
        />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-semibold">{symbol}</div>
              <a
                href={explorerBase ? `${explorerBase}/address/${approval.token}` : undefined}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-[11px] text-muted hover:text-accent"
              >
                {shortAddress(approval.token)}
              </a>
            </div>
            <RiskBadge risk={approval.risk} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="min-w-0 rounded-lg bg-accent-soft/50 p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Spender
              </div>
              <div className="mt-0.5 truncate font-medium">
                {spenderLabel || shortAddress(approval.spender)}
              </div>
            </div>
            <div className="min-w-0 rounded-lg bg-accent-soft/50 p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Allowance
              </div>
              <div
                className={cn(
                  "mt-0.5 truncate font-semibold",
                  approval.isUnlimited ? "text-danger" : "text-foreground",
                )}
              >
                {amount}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRevoke}
            disabled={revoking}
            className="ui-btn-danger !min-h-9 w-full text-xs"
          >
            {revoking ? "…" : "Revoke"}
          </button>
        </div>
      </div>
    </article>
  );
}
