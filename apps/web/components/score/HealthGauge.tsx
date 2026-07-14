"use client";

import { scoreColor, scoreLabel } from "@/lib/score/calculateScore";
import { cn } from "@/lib/utils";

interface Props {
  score: number;
  className?: string;
  size?: number;
}

export function HealthGauge({ score, className, size = 180 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = scoreColor(clamped);
  const r = 70;
  const c = 2 * Math.PI * r;
  // semicircle gauge
  const arc = c * 0.75;
  const offset = arc - (clamped / 100) * arc;

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <svg
        width={size}
        height={size * 0.72}
        viewBox="0 0 200 150"
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path
          d="M 30 120 A 70 70 0 1 1 170 120"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 30 120 A 70 70 0 1 1 170 120"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
        <text
          x="100"
          y="105"
          textAnchor="middle"
          className="fill-white"
          style={{ fontSize: 42, fontWeight: 700 }}
        >
          {clamped}
        </text>
        <text
          x="100"
          y="128"
          textAnchor="middle"
          className="fill-zinc-400"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          / 100
        </text>
      </svg>
      <div
        className="mt-1 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: `${color}22`, color }}
      >
        {scoreLabel(clamped)}
      </div>
    </div>
  );
}
