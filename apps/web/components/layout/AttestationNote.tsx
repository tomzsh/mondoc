"use client";

import { Info } from "@phosphor-icons/react";

/** Honest trust model note (self-attested scores). */
export function AttestationNote({ className }: { className?: string }) {
  return (
    <aside
      className={
        className ??
        "flex gap-3 border border-border bg-accent-soft px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-muted"
      }
    >
      <Info
        size={16}
        weight="regular"
        className="mt-0.5 shrink-0 text-foreground"
        aria-hidden
      />
      <div>
        <span className="font-semibold uppercase tracking-[0.14em] text-foreground">
          Attestation model
        </span>
        {" · "}
        Onchain scores are{" "}
        <strong className="font-semibold text-foreground">self-attested</strong>{" "}
        via <code className="text-foreground">logCleanup</code> /{" "}
        <code className="text-foreground">batchLogCleanup</code> after you
        revoke. Multi-revoke logs once in a batch. MonDoc never holds funds —
        revokes always go from your wallet to the token contract.
      </div>
    </aside>
  );
}
