/**
 * Envio HyperSync client for bulk log queries.
 * https://docs.envio.dev/docs/HyperSync/overview
 *
 * Full-history log queries in seconds instead of eth_getLogs chunking.
 * Token stays server-side (ENVIO_API_TOKEN) via /api/hypersync/*.
 */

import { type Hex, getAddress } from "viem";
import type { LogFilter, RawLog } from "./logsProvider";
import { MONAD_MAINNET_ID, MONAD_TESTNET_ID } from "@/lib/rpc";

export function getHypersyncBaseUrl(chainId: number): string | null {
  if (chainId === MONAD_TESTNET_ID) {
    return "https://monad-testnet.hypersync.xyz";
  }
  if (chainId === MONAD_MAINNET_ID) {
    return "https://monad.hypersync.xyz";
  }
  return null;
}

export function isHypersyncSupported(chainId: number): boolean {
  return getHypersyncBaseUrl(chainId) !== null;
}

export function getEnvioApiToken(): string | undefined {
  const t =
    process.env.ENVIO_API_TOKEN?.trim() ||
    process.env.NEXT_PUBLIC_ENVIO_API_TOKEN?.trim();
  return t || undefined;
}

interface HypersyncLog {
  address?: string;
  data?: string;
  topic0?: string | null;
  topic1?: string | null;
  topic2?: string | null;
  topic3?: string | null;
  block_number?: number;
  transaction_hash?: string;
  log_index?: number;
  transaction_index?: number;
}

interface HypersyncQueryResponse {
  data?: Array<{ logs?: HypersyncLog[] } | HypersyncLog[]>;
  next_block?: number;
  archive_height?: number;
  total_execution_time?: number;
  error?: string;
}

function formatLog(log: HypersyncLog): RawLog | null {
  if (!log.address || log.block_number == null || !log.transaction_hash) {
    return null;
  }
  const topics: Hex[] = [];
  for (const t of [log.topic0, log.topic1, log.topic2, log.topic3]) {
    if (t) topics.push(t as Hex);
  }
  return {
    address: getAddress(log.address),
    topics,
    data: (log.data ?? "0x") as Hex,
    blockNumber: log.block_number,
    transactionHash: log.transaction_hash as `0x${string}`,
    logIndex: log.log_index ?? 0,
    transactionIndex: log.transaction_index ?? 0,
  };
}

function extractLogs(data: HypersyncQueryResponse["data"]): HypersyncLog[] {
  if (!data) return [];
  const out: HypersyncLog[] = [];
  for (const batch of data) {
    if (Array.isArray(batch)) {
      out.push(...batch);
    } else if (batch && typeof batch === "object" && "logs" in batch) {
      out.push(...(batch.logs ?? []));
    }
  }
  return out;
}

/**
 * Client-driven HyperSync pagination through /api/hypersync/query.
 * Token never reaches the browser; progress updates per page.
 */
export async function fetchLogsViaApi(
  chainId: number,
  filter: LogFilter,
  signal?: AbortSignal,
  onProgress?: (msg: string) => void,
): Promise<RawLog[]> {
  let fromBlock = filter.fromBlock;
  const results: RawLog[] = [];
  let page = 0;
  const span = Math.max(1, filter.toBlock - filter.fromBlock + 1);

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Scan aborted", "AbortError");
    }

    page++;
    const scanned = Math.min(
      span,
      Math.max(0, fromBlock - filter.fromBlock),
    );
    const pct = Math.min(99, Math.round((scanned / span) * 100));
    onProgress?.(
      `HyperSync ${pct}% · page ${page} · ${results.length} logs · block ${fromBlock.toLocaleString()}…`,
    );

    const res = await fetch("/api/hypersync/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chainId,
        fromBlock,
        toBlock: filter.toBlock,
        topics: filter.topics,
        address: filter.address,
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { error?: string }).error ||
          `HyperSync proxy failed (${res.status})`,
      );
    }

    const json = (await res.json()) as HypersyncQueryResponse;
    if (json.error) {
      throw new Error(`HyperSync: ${json.error}`);
    }

    for (const raw of extractLogs(json.data)) {
      const formatted = formatLog(raw);
      if (!formatted) continue;
      if (formatted.blockNumber < filter.fromBlock) continue;
      if (formatted.blockNumber > filter.toBlock) continue;
      results.push(formatted);
    }

    const next = json.next_block;
    const archive = json.archive_height;

    if (next == null) break;
    if (next > filter.toBlock) break;
    if (archive != null && next > archive) break;
    if (next <= fromBlock) break;

    fromBlock = next;
  }

  onProgress?.(
    `HyperSync done · ${results.length} log(s) in ${page} page(s)`,
  );
  return results;
}

export async function fetchHeightViaApi(
  chainId: number,
  signal?: AbortSignal,
): Promise<number> {
  const res = await fetch(`/api/hypersync/height?chainId=${chainId}`, {
    signal,
  });
  if (!res.ok) {
    throw new Error(`HyperSync height proxy failed (${res.status})`);
  }
  const json = (await res.json()) as { height: number };
  return json.height;
}

export async function getHypersyncHeight(
  chainId: number,
  apiToken: string,
  signal?: AbortSignal,
): Promise<number> {
  const base = getHypersyncBaseUrl(chainId);
  if (!base) throw new Error(`HyperSync not supported for chain ${chainId}`);

  const res = await fetch(`${base}/height`, {
    headers: { Authorization: `Bearer ${apiToken}` },
    signal,
  });
  if (!res.ok) {
    throw new Error(`HyperSync height HTTP ${res.status}`);
  }
  const json = (await res.json()) as { height?: number };
  if (typeof json.height !== "number") {
    throw new Error("HyperSync height missing");
  }
  return json.height;
}
