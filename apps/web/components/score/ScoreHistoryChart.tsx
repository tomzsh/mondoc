"use client";

import type { CleanupRecord } from "@/hooks/useCleanupHistory";

interface Props {
  history: CleanupRecord[];
}

export function ScoreHistoryChart({ history }: Props) {
  if (!history.length) {
    return (
      <div className="ui-card flex min-h-[8rem] items-center justify-center border-dashed px-4 py-8 text-center text-sm text-muted sm:h-40">
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
    <div className="ui-card p-4 sm:p-5">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        Score after cleanup
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-28 w-full sm:h-32" preserveAspectRatio="none">
        <path
          d={path}
          fill="none"
          stroke="#6E54FF"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="3.5"
            fill="#6E54FF"
            stroke="var(--surface)"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>Start</span>
        <span>Latest: {scores[scores.length - 1]}</span>
      </div>
    </div>
  );
}
