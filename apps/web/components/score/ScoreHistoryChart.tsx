"use client";

import type { CleanupRecord } from "@/hooks/useCleanupHistory";

interface Props {
  history: CleanupRecord[];
}

export function ScoreHistoryChart({ history }: Props) {
  if (!history.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-zinc-500">
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
  const pad = 8;

  const coords = scores.map((s, i) => {
    const x = pad + (i / Math.max(scores.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((s - min) / (max - min)) * (h - pad * 2);
    return { x, y, s };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        Score after cleanup
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full">
        <path
          d={path}
          fill="none"
          stroke="#836EF9"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3.5" fill="#a78bfa" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>Start</span>
        <span>Latest: {scores[scores.length - 1]}</span>
      </div>
    </div>
  );
}
