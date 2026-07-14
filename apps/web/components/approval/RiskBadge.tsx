import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/scanner/classifyRisk";

const STYLES: Record<RiskLevel, string> = {
  high: "bg-red-500/15 text-red-300 ring-red-500/30",
  medium: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
};

const LABELS: Record<RiskLevel, string> = {
  high: "🔴 High",
  medium: "🟡 Medium",
  low: "🟢 Low",
};

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STYLES[risk],
        className,
      )}
    >
      {LABELS[risk]}
    </span>
  );
}
