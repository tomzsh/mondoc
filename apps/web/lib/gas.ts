/**
 * Monad gas helpers.
 *
 * On Monad, users pay gas_limit * price_per_gas (not gas used).
 * Keep limits tight — see .agents/skills/gas/SKILL.md
 */

/** Native MON transfer gas (fixed). */
export const NATIVE_TRANSFER_GAS = 21_000n;

/**
 * Apply a small buffer to an estimate (default 10%).
 * Never use huge wallet fallbacks on Monad.
 */
export function withGasBuffer(estimate: bigint, bps = 1_000n): bigint {
  // bps: 1000 = 10%
  return estimate + (estimate * bps) / 10_000n;
}

/**
 * Estimate contract gas via public client, then buffer.
 * Falls back to undefined so the wallet estimates if RPC fails.
 */
export async function estimateContractGasBuffered(
  estimate: () => Promise<bigint>,
  bps = 1_000n,
): Promise<bigint | undefined> {
  try {
    const raw = await estimate();
    if (raw <= 0n) return undefined;
    return withGasBuffer(raw, bps);
  } catch {
    return undefined;
  }
}
