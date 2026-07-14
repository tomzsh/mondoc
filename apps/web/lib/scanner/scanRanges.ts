/**
 * Scan depth presets for eth_getLogs.
 * Monad ~400ms block time → ~216_000 blocks/day (use for labels only).
 */
export type ScanRangeId = "recent" | "month" | "year" | "all";

export interface ScanRangePreset {
  id: ScanRangeId;
  label: string;
  shortLabel: string;
  description: string;
  /** null = scan from genesis (block 0) */
  lookbackBlocks: number | null;
}

/** ~2.5 blocks/sec if 400ms block time */
const BLOCKS_PER_DAY = 216_000;

export const SCAN_RANGES: ScanRangePreset[] = [
  {
    id: "recent",
    label: "Recent",
    shortLabel: "7d",
    description: "Last ~7 days of blocks (fast)",
    lookbackBlocks: BLOCKS_PER_DAY * 7,
  },
  {
    id: "month",
    label: "30 days",
    shortLabel: "30d",
    description: "About one month of history",
    lookbackBlocks: BLOCKS_PER_DAY * 30,
  },
  {
    id: "year",
    label: "1 year",
    shortLabel: "1y",
    description: "Deep scan ~1 year of approvals",
    lookbackBlocks: BLOCKS_PER_DAY * 365,
  },
  {
    id: "all",
    label: "All history",
    shortLabel: "All",
    description: "From genesis block — finds very old approvals",
    lookbackBlocks: null,
  },
];

export function getScanRange(id: ScanRangeId): ScanRangePreset {
  return SCAN_RANGES.find((r) => r.id === id) ?? SCAN_RANGES[3];
}

export function resolveFromBlock(
  latest: bigint,
  lookbackBlocks: number | null,
): bigint {
  if (lookbackBlocks === null || lookbackBlocks <= 0) return 0n;
  const lb = BigInt(lookbackBlocks);
  return latest > lb ? latest - lb : 0n;
}
