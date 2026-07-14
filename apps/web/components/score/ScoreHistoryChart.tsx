"use client";

import type { CleanupRecord } from "@/hooks/useCleanupHistory";

interface Props {
  history: CleanupRecord[];
}

export function ScoreHistoryChart({ history }: Props) {
  if (!history.length) {
    return (
      <div className="flex min-h-[8rem] items-center justify-center border border-dashed border-border px-4 py-8 text-center text-sm text-muted sm:h-40">
        No onchain score history yet
      </div>
    );
  }

  const points = [...history].reverse();
  const scores = points.map((p) => Number(p.scoreAfter));
  const max = 100;
  const min = 0;
  const w = 320;
  const h = 120;
  const pad = 12;

  const coords = scores.map((s, i) => {
    const x = pad + (i / Math.max(scores.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((s - min) / (max - min)) * (h - pad * 2);
    return { x, y, s };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="border border-border bg-background p-4 sm:p-5">
      <div className="section-kicker mb-3">Score after cleanup</div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-28 w-full sm:h-32"
        preserveAspectRatio="none"
      >
        <path
          d={path}
          fill="none"
          stroke="var(--foreground)"
          strokeWidth="1.75"
          strokeLinejoin="miter"
          strokeLinecap="square"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="2.5"
            fill="var(--foreground)"
            stroke="var(--surface)"
            strokeWidth="1.5"
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        <span>Start</span>
        <span>Latest · {scores[scores.length - 1]}</span>
      </div>
    </div>
  );
}
