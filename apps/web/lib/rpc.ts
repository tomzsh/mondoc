/**
 * RPC helpers. Defaults = official public endpoints.
 * Override NEXT_PUBLIC_MONAD_*_RPC for faster eth_call (e.g. Alchemy).
 *
 * Note: Alchemy Free tier on Monad caps eth_getLogs at ~10 blocks.
 * Official public allows 100. For history scans we auto-pick the faster logs RPC.
 */

export const MONAD_TESTNET_ID = 10143;
export const MONAD_MAINNET_ID = 143;

export const DEFAULT_TESTNET_RPC = "https://testnet-rpc.monad.xyz";
export const DEFAULT_MAINNET_RPC = "https://rpc.monad.xyz";

export function getTestnetRpc(): string {
  return (
    process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC?.trim() || DEFAULT_TESTNET_RPC
  );
}

export function getMainnetRpc(): string {
  return (
    process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC?.trim() || DEFAULT_MAINNET_RPC
  );
}

export function getRpcForChain(chainId: number): string {
  if (chainId === MONAD_TESTNET_ID) return getTestnetRpc();
  return getMainnetRpc();
}

function isPremiumRpc(url: string): boolean {
  const u = url.toLowerCase();
  return (
    u.includes("alchemy.com") ||
    u.includes("quiknode") ||
    u.includes("quicknode") ||
    u.includes("ankr.com") ||
    u.includes("drpc.org") ||
    u.includes("hypersync") ||
    u.includes("envio") ||
    u.includes("chainstack") ||
    u.includes("infura")
  );
}

function isAlchemy(url: string): boolean {
  return url.toLowerCase().includes("alchemy.com");
}

/**
 * RPC used for bulk eth_getLogs during approval scans.
 *
 * Alchemy Free only allows ~10-block getLogs on Monad (slower than public 100).
 * Unless NEXT_PUBLIC_MONAD_LOGS_RPC is set (e.g. PAYG Alchemy), we prefer
 * the official public endpoint for log scans while keeping Alchemy for eth_call.
 */
export function getLogsScanRpc(chainId?: number): string {
  const override = process.env.NEXT_PUBLIC_MONAD_LOGS_RPC?.trim();
  if (override) return override;

  const id = chainId ?? MONAD_TESTNET_ID;
  const primary = getRpcForChain(id);

  // Free Alchemy getLogs is too narrow — use public for bulk history
  if (isAlchemy(primary)) {
    return id === MONAD_TESTNET_ID ? DEFAULT_TESTNET_RPC : DEFAULT_MAINNET_RPC;
  }
  return primary;
}

/** eth_getLogs chunk size for the logs RPC */
export function recommendedScanChunk(chainId?: number): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_CHUNK_SIZE);
  if (Number.isFinite(env) && env > 0) return env;

  const logsUrl = getLogsScanRpc(chainId);
  const primary = getRpcForChain(chainId ?? MONAD_TESTNET_ID);

  // Explicit PAYG Alchemy as logs RPC → large windows
  if (isAlchemy(logsUrl) && logsUrl === primary) {
    // Free tier is 10; PAYG is higher — start at 10k, adaptive shrink handles free
    return 10_000;
  }
  if (isPremiumRpc(logsUrl) && !isAlchemy(logsUrl)) return 10_000;

  // Official public Monad RPC
  return 100;
}

export function recommendedMinChunk(chainId?: number): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_MIN_CHUNK);
  if (Number.isFinite(env) && env > 0) return env;

  const logsUrl = getLogsScanRpc(chainId);
  if (isAlchemy(logsUrl)) return 10; // Alchemy free floor
  if (isPremiumRpc(logsUrl)) return 500;
  return 50;
}

export function recommendedScanConcurrency(): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_CONCURRENCY);
  if (Number.isFinite(env) && env > 0) return Math.min(env, 16);
  // Parallel waves help a lot on both public and premium
  return 8;
}

export function isUsingHybridLogs(chainId?: number): boolean {
  const id = chainId ?? MONAD_TESTNET_ID;
  return getLogsScanRpc(id) !== getRpcForChain(id);
}
