import {
  type Address,
  type PublicClient,
  type Log,
  parseAbiItem,
  getAddress,
} from "viem";
import {
  getErc20Allowance,
  getIsApprovedForAll,
  getTokenMeta,
} from "./getCurrentAllowance";
import { classifyApproval, type ClassifiedApproval } from "./classifyRisk";

const approvalEvent = parseAbiItem(
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
);
const approvalForAllEvent = parseAbiItem(
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
);

export interface ScanOptions {
  /** How far back to scan (blocks). Default for demo on public RPC. */
  lookbackBlocks?: number;
  /** Chunk size for eth_getLogs to avoid RPC limits. */
  chunkSize?: number;
  onProgress?: (msg: string) => void;
}

/**
 * Scan Approval + ApprovalForAll logs for `owner`, then filter to currently active
 * allowances via eth_call. Read-only — never sends transactions.
 */
export async function scanApprovals(
  client: PublicClient,
  owner: Address,
  options: ScanOptions = {},
): Promise<ClassifiedApproval[]> {
  const lookback = options.lookbackBlocks ?? 200_000;
  const chunkSize = options.chunkSize ?? 10_000;
  const latest = await client.getBlockNumber();
  const fromBlock = latest > BigInt(lookback) ? latest - BigInt(lookback) : 0n;

  options.onProgress?.(`Scanning blocks ${fromBlock} → ${latest}…`);

  const erc20Logs: Log[] = [];
  const nftLogs: Log[] = [];

  for (let start = fromBlock; start <= latest; start += BigInt(chunkSize)) {
    const end =
      start + BigInt(chunkSize) - 1n > latest ? latest : start + BigInt(chunkSize) - 1n;
    options.onProgress?.(
      `Fetching logs ${start.toString()}–${end.toString()} / ${latest.toString()}…`,
    );

    try {
      const [a, b] = await Promise.all([
        client.getLogs({
          event: approvalEvent,
          args: { owner },
          fromBlock: start,
          toBlock: end,
        }),
        client.getLogs({
          event: approvalForAllEvent,
          args: { owner },
          fromBlock: start,
          toBlock: end,
        }),
      ]);
      erc20Logs.push(...a);
      nftLogs.push(...b);
    } catch {
      // Skip chunk on RPC failure (rate limit / range too large)
      options.onProgress?.(
        `Chunk ${start}–${end} failed (RPC limit) — continuing…`,
      );
    }
  }

  // Deduplicate (token, spender) pairs — keep latest log
  const erc20Pairs = new Map<
    string,
    { token: Address; spender: Address; blockNumber?: bigint; hash?: `0x${string}` }
  >();
  for (const log of erc20Logs) {
    if (!log.address || !log.topics?.[2]) continue;
    const token = getAddress(log.address);
    const spenderTopic = log.topics[2];
    const spender = getAddress(`0x${spenderTopic.slice(26)}`);
    const key = `${token.toLowerCase()}-${spender.toLowerCase()}`;
    erc20Pairs.set(key, {
      token,
      spender,
      blockNumber: log.blockNumber ?? undefined,
      hash: log.transactionHash ?? undefined,
    });
  }

  const nftPairs = new Map<
    string,
    { token: Address; operator: Address; blockNumber?: bigint; hash?: `0x${string}` }
  >();
  for (const log of nftLogs) {
    if (!log.address || !log.topics?.[2]) continue;
    const token = getAddress(log.address);
    const operatorTopic = log.topics[2];
    const operator = getAddress(`0x${operatorTopic.slice(26)}`);
    const key = `${token.toLowerCase()}-${operator.toLowerCase()}`;
    nftPairs.set(key, {
      token,
      operator,
      blockNumber: log.blockNumber ?? undefined,
      hash: log.transactionHash ?? undefined,
    });
  }

  options.onProgress?.(`Checking ${erc20Pairs.size + nftPairs.size} approval(s)…`);

  const results: ClassifiedApproval[] = [];
  const metaCache = new Map<string, { symbol?: string; name?: string; decimals?: number }>();

  async function meta(token: Address) {
    const k = token.toLowerCase();
    if (!metaCache.has(k)) {
      metaCache.set(k, await getTokenMeta(client, token));
    }
    return metaCache.get(k)!;
  }

  for (const pair of erc20Pairs.values()) {
    const allowance = await getErc20Allowance(client, pair.token, owner, pair.spender);
    if (allowance === 0n) continue;
    const m = await meta(pair.token);
    results.push(
      classifyApproval({
        token: pair.token,
        spender: pair.spender,
        allowance,
        kind: "erc20",
        tokenSymbol: m.symbol,
        tokenName: m.name,
        decimals: m.decimals ?? 18,
        blockNumber: pair.blockNumber,
        transactionHash: pair.hash,
      }),
    );
  }

  for (const pair of nftPairs.values()) {
    const approved = await getIsApprovedForAll(client, pair.token, owner, pair.operator);
    if (!approved) continue;
    const m = await meta(pair.token);
    results.push(
      classifyApproval({
        token: pair.token,
        spender: pair.operator,
        allowance: 1n,
        kind: "erc721",
        tokenSymbol: m.symbol,
        tokenName: m.name,
        blockNumber: pair.blockNumber,
        transactionHash: pair.hash,
      }),
    );
  }

  const order = { high: 0, medium: 1, low: 2 } as const;
  results.sort((a, b) => order[a.risk] - order[b.risk]);

  options.onProgress?.(`Found ${results.length} active approval(s).`);
  return results;
}
