import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/scanner/classifyRisk";

const STYLES: Record<RiskLevel, string> = {
  high: "bg-danger/10 text-danger",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/10 text-success",
};

const LABELS: Record<RiskLevel, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return (
    <span className={cn("ui-badge", STYLES[risk], className)}>{LABELS[risk]}</span>
  );
}
