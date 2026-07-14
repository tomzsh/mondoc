"use client";

import { useState } from "react";
import { usePublicClient, useAccount } from "wagmi";
import { isHash } from "viem";
import { toast } from "sonner";
import {
  explainFailedTx,
  type ExplainedRevert,
} from "@/lib/revert/decodeRevertReason";
import { getExplorerTxUrl } from "@/lib/wagmi";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<ExplainedRevert["category"], string> = {
  allowance: "🔐",
  balance: "💸",
  slippage: "📉",
  deadline: "⏰",
  gas: "⛽",
  paused: "⏸️",
  custom: "📜",
  unknown: "❓",
};

export function RevertExplainer() {
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainedRevert | null>(null);
  const client = usePublicClient();
  const { chainId } = useAccount();

  async function onExplain() {
    const trimmed = hash.trim();
    if (!isHash(trimmed)) {
      toast.error("Enter a valid tx hash (0x… 66 characters)");
      return;
    }
    if (!client) {
      toast.error("RPC client not ready — connect wallet / check network");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const explained = await explainFailedTx(client, trimmed as `0x${string}`);
      setResult(explained);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to read transaction";
      toast.error(msg.slice(0, 160));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <label className="block text-sm font-medium text-zinc-300">
          Failed transaction hash
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="0x…"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
          />
          <button
            type="button"
            onClick={() => void onExplain()}
            disabled={loading}
            className="rounded-xl bg-[#836EF9] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6f5ad4] disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Explain"}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          We fetch the receipt, re-simulate the call to decode the revert reason, then
          translate it into plain English.
        </p>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-2xl border p-6",
            result.category === "unknown"
              ? "border-white/10 bg-white/[0.02]"
              : "border-violet-500/30 bg-violet-500/5",
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-3xl">{CATEGORY_ICON[result.category]}</span>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">{result.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                {result.explanation}
              </p>
              <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                  Suggestion
                </div>
                <p className="mt-1 text-sm text-emerald-50/90">{result.suggestion}</p>
              </div>
              {result.rawReason && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300">
                    Raw reason
                  </summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] text-zinc-400">
                    {result.rawReason}
                  </pre>
                </details>
              )}
              {chainId && isHash(hash.trim()) && (
                <a
                  href={getExplorerTxUrl(chainId, hash.trim())}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-block text-sm text-violet-300 hover:underline"
                >
                  Open in explorer →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
