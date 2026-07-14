import { type Address } from "viem";
import { isKnownSpender } from "./knownSpenders";

export type RiskLevel = "high" | "medium" | "low";

export type ApprovalKind = "erc20" | "erc721" | "erc1155";

export interface ClassifiedApproval {
  token: Address;
  spender: Address;
  allowance: bigint;
  kind: ApprovalKind;
  risk: RiskLevel;
  isUnlimited: boolean;
  isKnownSpender: boolean;
  tokenSymbol?: string;
  tokenName?: string;
  decimals?: number;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
}

const MAX_UINT256 = 2n ** 256n - 1n;
/** Treat as unlimited if >= half of max (common approve pattern) */
const UNLIMITED_THRESHOLD = MAX_UINT256 / 2n;
/** "Large but limited" heuristic: > 1e24 raw units (~1M tokens with 18 dec) */
const LARGE_ALLOWANCE = 10n ** 24n;

export function isUnlimitedAllowance(allowance: bigint): boolean {
  return allowance >= UNLIMITED_THRESHOLD;
}

/**
 * 🔴 High: unlimited to unknown contracts
 * 🟡 Medium: unlimited to known contracts, or large but capped allowance
 * 🟢 Low: small/reasonable allowance, well-known spender
 */
export function classifyRisk(
  allowance: bigint,
  spender: Address,
  kind: ApprovalKind = "erc20",
): RiskLevel {
  const known = isKnownSpender(spender);
  const unlimited = kind === "erc20" ? isUnlimitedAllowance(allowance) : allowance > 0n;

  if (kind !== "erc20") {
    // ApprovalForAll is always powerful — high if unknown, medium if known
    return known ? "medium" : "high";
  }

  if (unlimited && !known) return "high";
  if (unlimited && known) return "medium";
  if (allowance >= LARGE_ALLOWANCE) return "medium";
  if (known) return "low";
  return "low";
}

export function classifyApproval(input: {
  token: Address;
  spender: Address;
  allowance: bigint;
  kind?: ApprovalKind;
  tokenSymbol?: string;
  tokenName?: string;
  decimals?: number;
  blockNumber?: bigint;
  transactionHash?: `0x${string}`;
}): ClassifiedApproval {
  const kind = input.kind ?? "erc20";
  return {
    token: input.token,
    spender: input.spender,
    allowance: input.allowance,
    kind,
    risk: classifyRisk(input.allowance, input.spender, kind),
    isUnlimited: kind === "erc20" ? isUnlimitedAllowance(input.allowance) : true,
    isKnownSpender: isKnownSpender(input.spender),
    tokenSymbol: input.tokenSymbol,
    tokenName: input.tokenName,
    decimals: input.decimals,
    blockNumber: input.blockNumber,
    transactionHash: input.transactionHash,
  };
}
