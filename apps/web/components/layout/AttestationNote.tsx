/** Hackathon-honest trust model note */
export function AttestationNote({ className }: { className?: string }) {
  return (
    <aside
      className={
        className ??
        "border border-border bg-accent-soft px-4 py-3 font-mono text-[11px] leading-relaxed tracking-[0.04em] text-muted"
      }
    >
      <span className="font-semibold uppercase tracking-[0.14em] text-foreground">
        Attestation model
      </span>
      {" · "}
      Onchain scores and the Cleanup Badge are{" "}
      <strong className="font-semibold text-foreground">self-attested</strong>{" "}
      via <code className="text-foreground">logCleanup</code> after you revoke.
      MonDoc never custodies funds. Badge mint requires score ≥ 80 and is
      soulbound to your wallet.
    </aside>
  );
}
