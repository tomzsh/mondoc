import type { RiskLevel } from "@/lib/scanner/classifyRisk";
import { cn } from "@/lib/utils";

const LABELS: Record<RiskLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const STYLES: Record<RiskLevel, string> = {
  high: "border-danger text-danger",
  medium: "border-warning text-warning",
  low: "border-success text-success",
};

export function RiskBadge({
  risk,
  className,
}: {
  risk: RiskLevel;
  className?: string;
}) {
  return (
    <span className={cn("ui-badge", STYLES[risk], className)}>
      {LABELS[risk]}
    </span>
  );
}
