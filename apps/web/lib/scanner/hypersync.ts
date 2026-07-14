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
    blockNumber: Number(log.block_number),
    transactionHash: log.transaction_hash as `0x${string}`,
    logIndex: Number(log.log_index ?? 0),
    transactionIndex: Number(log.transaction_index ?? 0),
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

/** Browser/server fetch — never cache tip or log pages. */
const noStore: RequestInit = {
  cache: "no-store",
  headers: { "Cache-Control": "no-cache" },
};

/**
 * Client-driven HyperSync pagination through /api/hypersync/query.
 * Token never reaches the browser; progress updates per page.
 *
 * Important: HyperSync `/height` can lag `archive_height` from query pages.
 * We grow `toBlock` to archive tip so new seed txs are not skipped.
 */
export async function fetchLogsViaApi(
  chainId: number,
  filter: LogFilter,
  signal?: AbortSignal,
  onProgress?: (msg: string) => void,
): Promise<RawLog[]> {
  let fromBlock = filter.fromBlock;
  /** Inclusive tip — may extend when archive_height is ahead of requested toBlock */
  let tip = filter.toBlock;
  const results: RawLog[] = [];
  let page = 0;
  const originFrom = filter.fromBlock;

  while (true) {
    if (signal?.aborted) {
      throw new DOMException("Scan aborted", "AbortError");
    }

    // Never query an inverted range (stale tip vs next_block)
    if (fromBlock > tip) break;

    page++;
    const span = Math.max(1, tip - originFrom + 1);
    const scanned = Math.min(span, Math.max(0, fromBlock - originFrom));
    const pct = Math.min(99, Math.round((scanned / span) * 100));
    onProgress?.(
      `HyperSync ${pct}% · page ${page} · ${results.length} logs · block ${fromBlock.toLocaleString()}…`,
    );

    const res = await fetch("/api/hypersync/query", {
      method: "POST",
      ...noStore,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify({
        chainId,
        fromBlock,
        toBlock: tip,
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
      if (formatted.blockNumber < originFrom) continue;
      results.push(formatted);
    }

    const next =
      typeof json.next_block === "number" ? json.next_block : undefined;
    const archive =
      typeof json.archive_height === "number"
        ? json.archive_height
        : undefined;

    // Archive tip is often ahead of /height — extend scan window
    if (archive != null && archive > tip) {
      tip = archive;
    }

    if (next == null) break;

    // Finished requested range (and archive not ahead)
    if (next > tip) break;

    // No forward progress
    if (next <= fromBlock) break;

    fromBlock = next;
  }

  onProgress?.(
    `HyperSync done · ${results.length} log(s) in ${page} page(s)`,
  );
  return results;
}

/**
 * Latest indexable block. Prefer max(height, archive_height) and never use
 * cached responses — a stale tip makes pagination stop before new txs.
 */
export async function fetchHeightViaApi(
  chainId: number,
  signal?: AbortSignal,
): Promise<number> {
  const res = await fetch(`/api/hypersync/height?chainId=${chainId}`, {
    ...noStore,
    signal,
  });
  if (!res.ok) {
    throw new Error(`HyperSync height proxy failed (${res.status})`);
  }
  const json = (await res.json()) as {
    height?: number;
    archive_height?: number;
  };
  const height = Number(json.height);
  const archive =
    json.archive_height != null ? Number(json.archive_height) : NaN;
  const candidates = [height, archive].filter((n) => Number.isFinite(n) && n > 0);
  if (candidates.length === 0) {
    throw new Error("HyperSync height missing");
  }
  return Math.max(...candidates);
}

export async function getHypersyncHeight(
  chainId: number,
  apiToken: string,
  signal?: AbortSignal,
): Promise<{ height: number; archive_height?: number }> {
  const base = getHypersyncBaseUrl(chainId);
  if (!base) throw new Error(`HyperSync not supported for chain ${chainId}`);

  const res = await fetch(`${base}/height`, {
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    throw new Error(`HyperSync height HTTP ${res.status}`);
  }
  const json = (await res.json()) as {
    height?: number;
    archive_height?: number;
  };
  if (typeof json.height !== "number") {
    throw new Error("HyperSync height missing");
  }
  return {
    height: json.height,
    archive_height:
      typeof json.archive_height === "number"
        ? json.archive_height
        : undefined,
  };
}

/**
 * Probe archive tip via a tiny query — `/height` can lag behind archive_height.
 */
export async function probeHypersyncArchiveHeight(
  chainId: number,
  apiToken: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const base = getHypersyncBaseUrl(chainId);
  if (!base) return null;

  // Minimal query: empty log match from a recent window is enough to read archive_height
  const payload = {
    from_block: 0,
    // limit work — we only need response metadata
    logs: [{ topics: [["0x0000000000000000000000000000000000000000000000000000000000000000"]] }],
    field_selection: { log: ["block_number"] },
    max_num_logs: 1,
  };

  try {
    const res = await fetch(`${base}/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { archive_height?: number };
    return typeof json.archive_height === "number"
      ? json.archive_height
      : null;
  } catch {
    return null;
  }
}
