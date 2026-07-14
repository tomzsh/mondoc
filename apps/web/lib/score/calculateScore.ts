import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";

/**
 * Wallet Health Score v1 (from PRD §9):
 *
 * score = 100
 * score -= (unlimited + unknown) × 15
 * score -= (unlimited + known)   × 7
 * score -= (other active)        × 2
 * score = max(score, 0)
 * score += min(cleanupCount × 5, 20)
 * score = min(score, 100)
 */
export function calculateScore(
  approvals: ClassifiedApproval[],
  cleanupCount = 0,
): number {
  let score = 100;

  let unlimitedUnknown = 0;
  let unlimitedKnown = 0;
  let other = 0;

  for (const a of approvals) {
    if (a.kind !== "erc20" || a.isUnlimited) {
      if (a.isKnownSpender) unlimitedKnown += 1;
      else unlimitedUnknown += 1;
    } else {
      other += 1;
    }
  }

  score -= unlimitedUnknown * 15;
  score -= unlimitedKnown * 7;
  score -= other * 2;
  score = Math.max(score, 0);
  score += Math.min(cleanupCount * 5, 20);
  score = Math.min(score, 100);

  return score;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs attention";
  return "At risk";
}

/** Clean score colors */
export function scoreColor(score: number): string {
  if (score >= 80) return "#30A46C";
  if (score >= 60) return "#6E54FF";
  if (score >= 40) return "#F5A524";
  return "#E5484D";
}
