"use client";

import { formatAllowance, shortAddress, cn } from "@/lib/utils";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { RiskBadge } from "./RiskBadge";
import { approvalKey } from "@/lib/store";
import { getSpenderLabel } from "@/lib/scanner/knownSpenders";

interface Props {
  approval: ClassifiedApproval;
  selected: boolean;
  onToggle: () => void;
  onRevoke: () => void;
  revoking?: boolean;
  explorerBase?: string;
}

export function ApprovalRow({
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
    <tr
      className={cn(
        "border-b border-border transition hover:bg-accent-soft/30",
        approval.risk === "high" && "bg-danger/[0.03]",
      )}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-border accent-[var(--accent)]"
          aria-label="Select approval"
        />
      </td>
      <td className="px-3 py-3">
        <div className="font-medium">{symbol}</div>
        <a
          href={explorerBase ? `${explorerBase}/address/${approval.token}` : undefined}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] text-muted hover:text-accent"
        >
          {shortAddress(approval.token)}
        </a>
      </td>
      <td className="px-3 py-3">
        <div className="text-sm text-foreground">
          {spenderLabel || shortAddress(approval.spender)}
        </div>
        <div className="font-mono text-[11px] text-muted">
          {shortAddress(approval.spender)}
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "text-sm font-medium",
            approval.isUnlimited ? "text-danger" : "text-foreground",
          )}
        >
          {amount}
        </span>
        <div className="text-[11px] uppercase tracking-wide text-muted">
          {approval.kind}
        </div>
      </td>
      <td className="px-3 py-3">
        <RiskBadge risk={approval.risk} />
      </td>
      <td className="px-3 py-3 text-right">
        <button
          type="button"
          onClick={onRevoke}
          disabled={revoking}
          className="ui-btn-danger !min-h-8 !w-auto !px-3 !py-1.5 text-xs"
        >
          {revoking ? "…" : "Revoke"}
        </button>
      </td>
    </tr>
  );
}

export function rowKey(a: ClassifiedApproval) {
  return approvalKey(a.token, a.spender);
}
