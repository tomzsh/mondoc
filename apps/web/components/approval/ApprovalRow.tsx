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
        "border-b border-white/5 transition hover:bg-white/[0.03]",
        approval.risk === "high" && "bg-red-500/[0.04]",
      )}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-white/20 bg-transparent accent-violet-500"
          aria-label="Select approval"
        />
      </td>
      <td className="px-3 py-3">
        <div className="font-medium text-white">{symbol}</div>
        <a
          href={explorerBase ? `${explorerBase}/address/${approval.token}` : undefined}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[11px] text-zinc-500 hover:text-violet-300"
        >
          {shortAddress(approval.token)}
        </a>
      </td>
      <td className="px-3 py-3">
        <div className="text-sm text-zinc-200">
          {spenderLabel || shortAddress(approval.spender)}
        </div>
        <div className="font-mono text-[11px] text-zinc-500">
          {shortAddress(approval.spender)}
        </div>
      </td>
      <td className="px-3 py-3">
        <span
          className={cn(
            "text-sm font-medium",
            approval.isUnlimited ? "text-red-300" : "text-zinc-200",
          )}
        >
          {amount}
        </span>
        <div className="text-[11px] uppercase tracking-wide text-zinc-500">
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
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-500/80 disabled:opacity-50"
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
