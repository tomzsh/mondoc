/**
 * eth_getLogs providers for approval history scans.
 *
 * - Try a range; on range/size limits, divide-and-conquer in parallel
 * - When a max chunk is known (public RPC = 100), pre-split for fewer failed calls
 */

import {
  type Address,
  type Hex,
  type PublicClient,
  createPublicClient,
  http,
  getAddress,
} from "viem";
import {
  getLogsScanRpc,
  recommendedScanChunk,
  recommendedScanConcurrency,
  recommendedMinChunk,
} from "@/lib/rpc";

export interface LogFilter {
  topics: Array<Hex | null>;
  fromBlock: number;
  toBlock: number;
  address?: Address;
}

export interface RawLog {
  address: Address;
  topics: Hex[];
  data: Hex;
  blockNumber: number;
  transactionHash: `0x${string}`;
  logIndex: number;
  transactionIndex: number;
}

export interface LogsProvider {
  chainId: number;
  getLatestBlock(): Promise<number>;
  getLogs(filter: LogFilter): Promise<RawLog[]>;
}

function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err ?? "");
  }
}

/** Range limits + response-size limits (provider caps / public RPC limits). */
export function isLogLimitError(error: unknown): boolean {
  const msg = errMessage(error).toLowerCase();
  return (
    msg.includes("query returned more than") ||
    msg.includes("log response size exceeded") ||
    msg.includes("query timeout exceeded") ||
    msg.includes("queued request timed out") ||
    msg.includes("block range") ||
    msg.includes("limited to") ||
    msg.includes("eth_getlogs") ||
    msg.includes("free tier") ||
    msg.includes("too many results") ||
    msg.includes("response size") ||
    msg.includes("timeout")
  );
}

export class ViemLogsProvider implements LogsProvider {
  private client: PublicClient;
  constructor(
    public chainId: number,
    url: string,
  ) {
    this.client = createPublicClient({
      transport: http(url, {
        // Public Monad RPC flakes under JSON-RPC batching
        batch: false,
        retryCount: 3,
        retryDelay: 400,
        timeout: 25_000,
      }),
    });
  }

  async getLatestBlock(): Promise<number> {
    return Number(await this.client.getBlockNumber());
  }

  async getLogs(filter: LogFilter): Promise<RawLog[]> {
    const logs = await this.client.request({
      method: "eth_getLogs",
      params: [
        {
          address: filter.address,
          topics: filter.topics as Hex[],
          fromBlock: `0x${filter.fromBlock.toString(16)}`,
          toBlock: `0x${filter.toBlock.toString(16)}`,
        },
      ],
    });

    return (logs as any[]).map((log) => ({
      address: getAddress(log.address),
      topics: (log.topics ?? []) as Hex[],
      data: log.data as Hex,
      blockNumber: Number(log.blockNumber),
      transactionHash: log.transactionHash as `0x${string}`,
      logIndex: Number(log.logIndex ?? 0),
      transactionIndex: Number(log.transactionIndex ?? 0),
    }));
  }
}

/**
 * Divide-and-conquer wrapper for eth_getLogs.
 * Pre-splits when maxChunk is known so we don't waste calls failing huge ranges.
 */
export class DivideAndConquerLogsProvider implements LogsProvider {
  constructor(
    private underlying: LogsProvider,
    private options: {
      /** Known-safe max blocks per request (e.g. 100 public / 10 Alchemy free). */
      maxChunk: number;
      minChunk: number;
      concurrency: number;
      onProgress?: (msg: string) => void;
      signal?: AbortSignal;
    },
  ) {}

  get chainId(): number {
    return this.underlying.chainId;
  }

  getLatestBlock(): Promise<number> {
    return this.underlying.getLatestBlock();
  }

  async getLogs(filter: LogFilter): Promise<RawLog[]> {
    const range = filter.toBlock - filter.fromBlock + 1;
    if (range <= 0) return [];

    const maxChunk = Math.max(1, this.options.maxChunk);

    // Known hard caps: pre-split into fixed windows + parallel pool (faster than fail→split)
    if (range > maxChunk) {
      return this.parallelWindows(filter, maxChunk);
    }

    try {
      this.throwIfAborted();
      return await this.underlying.getLogs(filter);
    } catch (error) {
      if (!isLogLimitError(error)) throw error;
      if (filter.fromBlock === filter.toBlock) throw error;
      return this.divideAndConquer(filter, 2);
    }
  }

  /** Binary split — both halves in parallel */
  private async divideAndConquer(
    filter: LogFilter,
    iterations: number,
  ): Promise<RawLog[]> {
    this.throwIfAborted();

    if (iterations === 1) {
      return this.getLogs(filter);
    }

    const middle =
      filter.fromBlock +
      Math.floor((filter.toBlock - filter.fromBlock) / 2);

    if (middle < filter.fromBlock || middle >= filter.toBlock) {
      // can't split further
      try {
        return await this.underlying.getLogs(filter);
      } catch {
        return [];
      }
    }

    this.options.onProgress?.(
      `Splitting log range ${filter.fromBlock}–${filter.toBlock}…`,
    );

    const [left, right] = await Promise.all([
      this.divideAndConquer(
        { ...filter, toBlock: middle },
        iterations - 1,
      ),
      this.divideAndConquer(
        { ...filter, fromBlock: middle + 1 },
        iterations - 1,
      ),
    ]);
    return [...left, ...right];
  }

  /** Parallel fixed-size windows with adaptive split on failure */
  private async parallelWindows(
    filter: LogFilter,
    chunkSize: number,
  ): Promise<RawLog[]> {
    type Window = { from: number; to: number };
    const queue: Window[] = [];
    let cursor = filter.fromBlock;
    while (cursor <= filter.toBlock) {
      const end = Math.min(cursor + chunkSize - 1, filter.toBlock);
      queue.push({ from: cursor, to: end });
      cursor = end + 1;
    }

    const total = filter.toBlock - filter.fromBlock + 1;
    let scanned = 0;
    const results: RawLog[] = [];
    const conc = Math.max(1, Math.min(this.options.concurrency, 16));
    const minChunk = Math.max(1, this.options.minChunk);
    let activeChunk = chunkSize;

    while (queue.length > 0) {
      this.throwIfAborted();
      const wave = queue.splice(0, conc);
      const pct = Math.min(99, Math.round((scanned / total) * 100));
      this.options.onProgress?.(
        `Scanning history ${pct}% · ${wave.length}× parallel · ${queue.length} left · chunk ${activeChunk}`,
      );

      const settled = await Promise.all(
        wave.map(async (w) => {
          try {
            const logs = await this.underlying.getLogs({
              ...filter,
              fromBlock: w.from,
              toBlock: w.to,
            });
            return { ok: true as const, w, logs };
          } catch (error) {
            if (
              this.options.signal?.aborted ||
              (error instanceof DOMException && error.name === "AbortError")
            ) {
              throw error;
            }
            return { ok: false as const, w, error };
          }
        }),
      );

      for (const r of settled) {
        if (r.ok) {
          results.push(...r.logs);
          scanned += r.w.to - r.w.from + 1;
          continue;
        }

        const size = r.w.to - r.w.from + 1;
        if (!isLogLimitError(r.error) || size <= minChunk) {
          // skip toxic window
          scanned += size;
          continue;
        }

        // Binary split failed window
        const mid = r.w.from + Math.floor((r.w.to - r.w.from) / 2);
        activeChunk = Math.max(minChunk, Math.floor(size / 2));
        queue.unshift({ from: mid + 1, to: r.w.to });
        queue.unshift({ from: r.w.from, to: mid });
      }
    }

    return results;
  }

  private throwIfAborted() {
    if (this.options.signal?.aborted) {
      throw new DOMException("Scan aborted", "AbortError");
    }
  }
}

/**
 * HyperSync via Next.js API proxy (ENVIO_API_TOKEN stays server-side).
 * Falls back to public eth_getLogs divide-and-conquer if proxy unavailable.
 */
export class HyperSyncLogsProvider implements LogsProvider {
  private fallback: DivideAndConquerLogsProvider | null = null;

  constructor(
    public chainId: number,
    private options: {
      onProgress?: (msg: string) => void;
      signal?: AbortSignal;
      maxChunk?: number;
      minChunk?: number;
      concurrency?: number;
    } = {},
  ) {}

  private getFallback() {
    if (!this.fallback) {
      this.fallback = createRpcLogsProvider(this.chainId, this.options);
    }
    return this.fallback;
  }

  async getLatestBlock(): Promise<number> {
    try {
      const { fetchHeightViaApi } = await import("./hypersync");
      return await fetchHeightViaApi(this.chainId, this.options.signal);
    } catch {
      return this.getFallback().getLatestBlock();
    }
  }

  async getLogs(filter: LogFilter): Promise<RawLog[]> {
    try {
      const { fetchLogsViaApi } = await import("./hypersync");
      return await fetchLogsViaApi(
        this.chainId,
        filter,
        this.options.signal,
        this.options.onProgress,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.options.onProgress?.(
        `HyperSync unavailable (${msg.slice(0, 80)}) — falling back to RPC…`,
      );
      return this.getFallback().getLogs(filter);
    }
  }
}

function createRpcLogsProvider(
  chainId: number,
  opts?: {
    onProgress?: (msg: string) => void;
    signal?: AbortSignal;
    maxChunk?: number;
    minChunk?: number;
    concurrency?: number;
  },
): DivideAndConquerLogsProvider {
  const url = getLogsScanRpc(chainId);
  const viem = new ViemLogsProvider(chainId, url);
  return new DivideAndConquerLogsProvider(viem, {
    maxChunk: opts?.maxChunk ?? recommendedScanChunk(chainId),
    minChunk: opts?.minChunk ?? recommendedMinChunk(chainId),
    concurrency: opts?.concurrency ?? recommendedScanConcurrency(),
    onProgress: opts?.onProgress,
    signal: opts?.signal,
  });
}

/**
 * Prefer Envio HyperSync when enabled (NEXT_PUBLIC_USE_HYPERSYNC=true),
 * otherwise public/Alchemy eth_getLogs with divide-and-conquer.
 */
export function createScanLogsProvider(
  chainId: number,
  opts?: {
    onProgress?: (msg: string) => void;
    signal?: AbortSignal;
    maxChunk?: number;
    minChunk?: number;
    concurrency?: number;
  },
): LogsProvider {
  const useHyper =
    process.env.NEXT_PUBLIC_USE_HYPERSYNC === "true" ||
    process.env.NEXT_PUBLIC_USE_HYPERSYNC === "1";

  if (useHyper) {
    return new HyperSyncLogsProvider(chainId, {
      onProgress: opts?.onProgress,
      signal: opts?.signal,
      maxChunk: opts?.maxChunk,
      minChunk: opts?.minChunk,
      concurrency: opts?.concurrency,
    });
  }

  return createRpcLogsProvider(chainId, opts);
}

/** Pad address to 32-byte topic for eth_getLogs. */
export function addressToTopic(address: Address): Hex {
  return `0x000000000000000000000000${address.slice(2).toLowerCase()}` as Hex;
}
