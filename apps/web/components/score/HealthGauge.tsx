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
  const arc = c * 0.75;
  const offset = arc - (clamped / 100) * arc;

  return (
    <div className={cn("relative flex w-full flex-col items-center", className)}>
      <svg
        width="100%"
        height="auto"
        viewBox="0 0 200 150"
        className="max-w-full"
        style={{ maxWidth: size }}
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M 30 120 A 70 70 0 1 1 170 120"
          fill="none"
          stroke="var(--border)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 30 120 A 70 70 0 1 1 170 120"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${c}`}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
        <text
          x="100"
          y="105"
          textAnchor="middle"
          fill="var(--foreground)"
          style={{ fontSize: 40, fontWeight: 600 }}
        >
          {clamped}
        </text>
        <text
          x="100"
          y="126"
          textAnchor="middle"
          fill="var(--muted)"
          style={{ fontSize: 12, fontWeight: 500 }}
        >
          / 100
        </text>
      </svg>
      <div
        className="ui-badge mt-1"
        style={{
          backgroundColor: `${color}22`,
          color,
        }}
      >
        {scoreLabel(clamped)}
      </div>
    </div>
  );
}
