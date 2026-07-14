"use client";

import { useEffect, useState } from "react";
import { FirstAidKit, MagnifyingGlass } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const PHASES = [
  "Resolving wallet activity…",
  "Querying approval logs…",
  "Indexing history with HyperSync…",
  "Checking live allowances…",
  "Classifying risk levels…",
];

type Mode = "full" | "bar" | "inline";

/**
 * Intentional scan UX — animated so long HyperSync / eth_getLogs waits
 * feel like progress, not a frozen UI.
 */
export function ScanLoader({
  mode = "full",
  progress,
  rangeLabel,
  className,
}: {
  mode?: Mode;
  /** Live progress string from scanner (preferred over rotating phases) */
  progress?: string | null;
  rangeLabel?: string;
  className?: string;
}) {
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => setPhase((p) => (p + 1) % PHASES.length), 2200);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    setElapsed(0);
    const t = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(t);
  }, [progress, rangeLabel]);

  const status = (progress && progress.trim()) || PHASES[phase];

  if (mode === "bar") {
    return (
      <div
        className={cn(
          "scan-loader-bar border-b border-border bg-accent-soft/40 px-3 py-2.5 sm:px-4",
          className,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex items-center gap-3">
          <PulseMark size={18} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-accent">
                Scanning
                <span className="scan-loader-dots" aria-hidden>
                  <i /><i /><i />
                </span>
              </p>
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">
                {elapsed}s
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
              {status}
            </p>
            <div className="scan-loader-track mt-2">
              <div className="scan-loader-indeterminate" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "inline") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted",
          className,
        )}
        role="status"
      >
        <PulseMark size={12} />
        Scanning
        <span className="scan-loader-dots" aria-hidden>
          <i /><i /><i />
        </span>
      </span>
    );
  }

  return (
    <div
      className={cn(
        "scan-loader-full relative overflow-hidden px-4 py-12 text-center sm:py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="scan-loader-grid" aria-hidden />
      <div className="scan-loader-radar mx-auto" aria-hidden>
        <span className="scan-loader-ring" />
        <span className="scan-loader-ring delay-1" />
        <span className="scan-loader-ring delay-2" />
        <span className="scan-loader-sweep" />
        <span className="scan-loader-core">
          <FirstAidKit size={22} weight="regular" aria-hidden />
        </span>
      </div>

      <p className="section-kicker mt-8 text-accent">Diagnostics running</p>
      <h3 className="mt-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
        Scanning wallet approvals
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
        {rangeLabel ? (
          <>
            Range <span className="text-foreground">{rangeLabel}</span>
            {" · "}
          </>
        ) : null}
        This can take a moment on deep history — the app is working, not frozen.
      </p>

      <div className="mx-auto mt-6 max-w-md">
        <div className="scan-loader-track h-1.5">
          <div className="scan-loader-indeterminate" />
        </div>
        <div className="mt-3 flex items-start justify-between gap-3 text-left">
          <p className="min-w-0 flex-1 break-words font-mono text-[11px] leading-relaxed text-accent sm:text-xs">
            {status}
          </p>
          <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">
            {elapsed}s
          </span>
        </div>
      </div>

      <ul className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-px border border-border bg-border text-left">
        {[
          { k: "01", t: "Logs" },
          { k: "02", t: "Allowances" },
          { k: "03", t: "Risk" },
        ].map((s, i) => (
          <li
            key={s.k}
            className={cn(
              "bg-surface px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.14em]",
              i === phase % 3 ? "text-accent" : "text-muted",
            )}
          >
            <span className="text-accent/80">{s.k}</span>
            <div className="mt-1 text-foreground">{s.t}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PulseMark({ size }: { size: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center border border-accent bg-accent text-accent-fg"
      style={{ width: size + 8, height: size + 8 }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute -inset-1 border border-accent/40"
        style={{ animation: "scan-pulse 1.8s ease-out infinite" }}
      />
      <MagnifyingGlass size={Math.round(size * 0.7)} weight="regular" />
    </span>
  );
}
