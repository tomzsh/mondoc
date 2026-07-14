/**
 * RPC helpers for Monad.
 * Primary: NEXT_PUBLIC_MONAD_*_RPC (e.g. Alchemy)
 * Fallback: official public endpoints when primary fails.
 */

import { type Chain, createPublicClient, fallback, http, type PublicClient } from "viem";

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

/** Ordered RPC URLs for a chain (primary first, then public fallback). */
export function getRpcFallbacks(chainId: number): string[] {
  const primary = getRpcForChain(chainId);
  const pub =
    chainId === MONAD_TESTNET_ID ? DEFAULT_TESTNET_RPC : DEFAULT_MAINNET_RPC;
  const urls = [primary];
  if (pub !== primary) urls.push(pub);
  // Deduplicate
  return [...new Set(urls.filter(Boolean))];
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
 * RPC for bulk eth_getLogs when HyperSync is off.
 * Alchemy Free on Monad caps getLogs ~10 blocks — public allows 100.
 */
export function getLogsScanRpc(chainId?: number): string {
  const override = process.env.NEXT_PUBLIC_MONAD_LOGS_RPC?.trim();
  if (override) return override;

  const id = chainId ?? MONAD_TESTNET_ID;
  const primary = getRpcForChain(id);

  if (isAlchemy(primary)) {
    return id === MONAD_TESTNET_ID ? DEFAULT_TESTNET_RPC : DEFAULT_MAINNET_RPC;
  }
  return primary;
}

export function recommendedScanChunk(chainId?: number): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_CHUNK_SIZE);
  if (Number.isFinite(env) && env > 0) return env;

  const logsUrl = getLogsScanRpc(chainId);
  const primary = getRpcForChain(chainId ?? MONAD_TESTNET_ID);

  if (isAlchemy(logsUrl) && logsUrl === primary) return 10_000;
  if (isPremiumRpc(logsUrl) && !isAlchemy(logsUrl)) return 10_000;
  return 100;
}

export function recommendedMinChunk(chainId?: number): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_MIN_CHUNK);
  if (Number.isFinite(env) && env > 0) return env;

  const logsUrl = getLogsScanRpc(chainId);
  if (isAlchemy(logsUrl)) return 10;
  if (isPremiumRpc(logsUrl)) return 500;
  return 50;
}

export function recommendedScanConcurrency(): number {
  const env = Number(process.env.NEXT_PUBLIC_SCAN_CONCURRENCY);
  if (Number.isFinite(env) && env > 0) return Math.min(env, 16);
  return 6;
}

export function isUsingHybridLogs(chainId?: number): boolean {
  const id = chainId ?? MONAD_TESTNET_ID;
  return getLogsScanRpc(id) !== getRpcForChain(id);
}

/**
 * Reliable public client for reads/scans.
 * - No request batching (public Monad RPC is flaky with large batches)
 * - Fallback primary → public
 * - Retries enabled
 */
export function createResilientPublicClient(
  chainId: number,
  chain?: Chain,
): PublicClient {
  const urls = getRpcFallbacks(chainId);
  const transports = urls.map((url) =>
    http(url, {
      batch: false,
      retryCount: 3,
      retryDelay: 350,
      timeout: 20_000,
    }),
  );

  return createPublicClient({
    chain,
    transport:
      transports.length === 1
        ? transports[0]!
        : fallback(transports, { rank: false, retryCount: 1 }),
  });
}
