/**
 * Approval history scanner.
 *
 * Flow:
 * 1. Skip EOAs with nonce 0 (no txs → no approvals)
 * 2. Fetch Approval + ApprovalForAll logs in parallel
 * 3. Deduplicate (token, spender) keeping latest event
 * 4. Smart allowance resolution:
 *    - latest amount 0 → inactive (no eth_call)
 *    - maxUint256 → use event value (no eth_call)
 *    - else eth_call allowance()
 * 5. Classify risk
 */

import {
  type Address,
  type PublicClient,
  type Hex,
  getAddress,
  maxUint256,
  decodeEventLog,
  parseAbiItem,
  toEventSelector,
} from "viem";
import {
  getErc20Allowance,
  getIsApprovedForAll,
  getTokenMeta,
} from "./getCurrentAllowance";
import { classifyApproval, type ClassifiedApproval } from "./classifyRisk";
import { resolveFromBlock } from "./scanRanges";
import {
  addressToTopic,
  createScanLogsProvider,
  type RawLog,
} from "./logsProvider";
import {
  recommendedMinChunk,
  recommendedScanChunk,
  recommendedScanConcurrency,
  isUsingHybridLogs,
} from "@/lib/rpc";

const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);
const approvalForAllEvent = parseAbiItem(
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
);

const APPROVAL_TOPIC = toEventSelector(approvalEvent);
const APPROVAL_FOR_ALL_TOPIC = toEventSelector(approvalForAllEvent);

export interface ScanOptions {
  lookbackBlocks?: number | null;
  chunkSize?: number;
  minChunkSize?: number;
  concurrency?: number;
  onProgress?: (msg: string) => void;
  signal?: AbortSignal;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("Scan aborted", "AbortError");
  }
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  signal?: AbortSignal,
  onBatch?: (done: number, total: number) => void,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let next = 0;
  let done = 0;

  async function worker() {
    while (true) {
      throwIfAborted(signal);
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]!);
      done++;
      onBatch?.(done, items.length);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => worker(),
    ),
  );
  return results;
}

type Erc20Pair = {
  token: Address;
  spender: Address;
  /** Latest approval amount from log data (if decoded). */
  lastAmount?: bigint;
  blockNumber?: bigint;
  hash?: `0x${string}`;
};

type NftPair = {
  token: Address;
  operator: Address;
  /** Latest approved flag from log (if decoded). */
  lastApproved?: boolean;
  blockNumber?: bigint;
  hash?: `0x${string}`;
};

function parseApprovalAmount(log: RawLog): bigint | undefined {
  try {
    const parsed = decodeEventLog({
      abi: [approvalEvent],
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: false,
    });
    const value = (parsed.args as { value?: bigint }).value;
    return typeof value === "bigint" ? value : undefined;
  } catch {
    // ERC-721 Approval also uses same topic0 with tokenId — treat as non-amount
    return undefined;
  }
}

function parseApprovalForAllFlag(log: RawLog): boolean | undefined {
  try {
    const parsed = decodeEventLog({
      abi: [approvalForAllEvent],
      data: log.data,
      topics: log.topics as [Hex, ...Hex[]],
      strict: false,
    });
    const approved = (parsed.args as { approved?: boolean }).approved;
    return typeof approved === "boolean" ? approved : undefined;
  } catch {
    return undefined;
  }
}

function collectErc20Pairs(logs: RawLog[]): Map<string, Erc20Pair> {
  const map = new Map<string, Erc20Pair>();
  for (const log of logs) {
    // ERC-20 Approval has 3 topics (sig, owner, spender); ERC-721 Approval has 4 (incl tokenId)
    // topics.length === 4 → ERC-721 single-token approval (skipped for now)
    if (!log.address || log.topics.length !== 3) continue;
    if (!log.topics[2]) continue;

    const token = getAddress(log.address);
    const spender = getAddress(`0x${log.topics[2].slice(26)}`);
    const key = `${token.toLowerCase()}-${spender.toLowerCase()}`;
    const prev = map.get(key);
    const blockNumber = BigInt(log.blockNumber);

    if (!prev || blockNumber >= (prev.blockNumber ?? 0n)) {
      map.set(key, {
        token,
        spender,
        lastAmount: parseApprovalAmount(log),
        blockNumber,
        hash: log.transactionHash,
      });
    }
  }
  return map;
}

function collectNftPairs(logs: RawLog[]): Map<string, NftPair> {
  const map = new Map<string, NftPair>();
  for (const log of logs) {
    if (!log.address || !log.topics[2]) continue;
    const token = getAddress(log.address);
    const operator = getAddress(`0x${log.topics[2].slice(26)}`);
    const key = `${token.toLowerCase()}-${operator.toLowerCase()}`;
    const prev = map.get(key);
    const blockNumber = BigInt(log.blockNumber);

    if (!prev || blockNumber >= (prev.blockNumber ?? 0n)) {
      map.set(key, {
        token,
        operator,
        lastApproved: parseApprovalForAllFlag(log),
        blockNumber,
        hash: log.transactionHash,
      });
    }
  }
  return map;
}

/**
 * Scan Approval + ApprovalForAll logs for `owner`, then resolve live allowances.
 * Read-only — never sends transactions.
 */
export async function scanApprovals(
  client: PublicClient,
  owner: Address,
  options: ScanOptions = {},
): Promise<ClassifiedApproval[]> {
  const lookback =
    options.lookbackBlocks === undefined ? null : options.lookbackBlocks;
  const chainId = client.chain?.id ?? 10143;
  const signal = options.signal;

  throwIfAborted(signal);

  // Skip EOA with no transactions
  options.onProgress?.("Checking wallet activity…");
  const nonce = await client.getTransactionCount({ address: owner });
  if (nonce === 0) {
    options.onProgress?.("No transactions on this chain — no approvals.");
    return [];
  }

  const latest = await client.getBlockNumber();
  const fromBlock = Number(resolveFromBlock(latest, lookback));
  const toBlock = Number(latest);

  const useHyper =
    process.env.NEXT_PUBLIC_USE_HYPERSYNC === "true" ||
    process.env.NEXT_PUBLIC_USE_HYPERSYNC === "1";
  const hybrid = !useHyper && isUsingHybridLogs(chainId);
  const mode = useHyper
    ? " · Envio HyperSync"
    : hybrid
      ? " · public logs + Alchemy calls"
      : "";
  options.onProgress?.(
    lookback === null || lookback === 0
      ? `Full history (block 0 → ${toBlock})${mode}…`
      : `Scanning blocks ${fromBlock} → ${toBlock}${mode}…`,
  );

  const logsProvider = createScanLogsProvider(chainId, {
    maxChunk: options.chunkSize ?? recommendedScanChunk(chainId),
    minChunk: options.minChunkSize ?? recommendedMinChunk(chainId),
    concurrency: options.concurrency ?? recommendedScanConcurrency(),
    onProgress: options.onProgress,
    signal,
  });

  const ownerTopic = addressToTopic(owner);

  // Parallel event fetches
  const [approvalLogs, approvalForAllLogs] = await Promise.all([
    logsProvider.getLogs({
      topics: [APPROVAL_TOPIC, ownerTopic],
      fromBlock,
      toBlock,
    }),
    logsProvider.getLogs({
      topics: [APPROVAL_FOR_ALL_TOPIC, ownerTopic],
      fromBlock,
      toBlock,
    }),
  ]);

  throwIfAborted(signal);

  const erc20Pairs = collectErc20Pairs(approvalLogs);
  const nftPairs = collectNftPairs(approvalForAllLogs);

  options.onProgress?.(
    `Found ${erc20Pairs.size + nftPairs.size} unique pair(s) — resolving allowances…`,
  );

  const results: ClassifiedApproval[] = [];
  const metaCache = new Map<
    string,
    { symbol?: string; name?: string; decimals?: number }
  >();

  async function meta(token: Address) {
    const k = token.toLowerCase();
    if (!metaCache.has(k)) {
      metaCache.set(k, await getTokenMeta(client, token));
    }
    return metaCache.get(k)!;
  }

  const concurrency = Math.max(
    12,
    (options.concurrency ?? recommendedScanConcurrency()) * 2,
  );
  const erc20List = [...erc20Pairs.values()];

  // Smart allowance resolution from latest events + live eth_call when needed
  const erc20Settled = await mapPool(
    erc20List,
    concurrency,
    async (pair) => {
      // Latest Approval was 0 → inactive (no RPC)
      if (pair.lastAmount === 0n) return null;

      let allowance: bigint;

      // Unlimited from event → no eth_call (EIP-20: max never decreases via transferFrom)
      if (pair.lastAmount !== undefined && pair.lastAmount === maxUint256) {
        allowance = pair.lastAmount;
      } else {
        // Otherwise check live on-chain (may have been partially used)
        allowance = await getErc20Allowance(
          client,
          pair.token,
          owner,
          pair.spender,
        );
      }

      if (allowance === 0n) return null;

      const m = await meta(pair.token);
      return classifyApproval({
        token: pair.token,
        spender: pair.spender,
        allowance,
        kind: "erc20",
        tokenSymbol: m.symbol,
        tokenName: m.name,
        decimals: m.decimals ?? 18,
        blockNumber: pair.blockNumber,
        transactionHash: pair.hash,
      });
    },
    signal,
    (done, total) => {
      options.onProgress?.(`Checking allowances ${done}/${total}…`);
    },
  );
  for (const r of erc20Settled) if (r) results.push(r);

  const nftList = [...nftPairs.values()];
  const nftSettled = await mapPool(
    nftList,
    concurrency,
    async (pair) => {
      // Latest ApprovalForAll was false → inactive
      if (pair.lastApproved === false) return null;

      // True from event is not enough if later revoked off-range; prefer live check
      // unless we scanned full history and last event is approved=true
      let approved: boolean;
      if (
        pair.lastApproved === true &&
        (lookback === null || lookback === 0)
      ) {
        approved = true;
      } else {
        approved = await getIsApprovedForAll(
          client,
          pair.token,
          owner,
          pair.operator,
        );
      }

      if (!approved) return null;

      const m = await meta(pair.token);
      return classifyApproval({
        token: pair.token,
        spender: pair.operator,
        allowance: 1n,
        kind: "erc721",
        tokenSymbol: m.symbol,
        tokenName: m.name,
        blockNumber: pair.blockNumber,
        transactionHash: pair.hash,
      });
    },
    signal,
    (done, total) => {
      options.onProgress?.(`Checking NFT approvals ${done}/${total}…`);
    },
  );
  for (const r of nftSettled) if (r) results.push(r);

  const order = { high: 0, medium: 1, low: 2 } as const;
  results.sort((a, b) => order[a.risk] - order[b.risk]);

  options.onProgress?.(
    `Done — ${results.length} active approval(s) (from block ${fromBlock}).`,
  );
  return results;
}
