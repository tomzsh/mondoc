"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { parseAbiItem, type Address, zeroAddress } from "viem";
import { walletDoctorBadgeAbi, walletDoctorLogAbi } from "@/lib/contracts/abis";
import {
  WALLET_DOCTOR_BADGE,
  WALLET_DOCTOR_LOG,
  isContractConfigured,
} from "@/lib/contracts/addresses";

const badgeMintedEvent = parseAbiItem(
  "event BadgeMinted(address indexed wallet, uint256 indexed tokenId, uint256 scoreAtMint)",
);

export interface BadgeNftStatus {
  hasBadge: boolean;
  /** Onchain score from WalletDoctorLog.currentScore */
  onchainScore: number | null;
  /** Score recorded in BadgeMinted event (null if not minted / not found) */
  scoreAtMint: number | null;
  tokenId: number | null;
  threshold: number;
  badgeAddress: Address | undefined;
  logAddress: Address | undefined;
  configured: boolean;
  loading: boolean;
}

/**
 * Cleanup Badge NFT status for the connected wallet (soulbound).
 * Displays onchain score + mint score on the dashboard.
 */
export function useBadgeNft(): BadgeNftStatus {
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient();

  const logAddress = chainId ? WALLET_DOCTOR_LOG[chainId] : undefined;
  const badgeAddress = chainId ? WALLET_DOCTOR_BADGE[chainId] : undefined;
  const configured = Boolean(
    chainId &&
      isContractConfigured(chainId) &&
      badgeAddress &&
      badgeAddress !== zeroAddress,
  );

  const hasBadgeQuery = useReadContract({
    address: badgeAddress,
    abi: walletDoctorBadgeAbi,
    functionName: "hasBadge",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && configured && badgeAddress),
    },
  });

  const onchainScoreQuery = useReadContract({
    address: logAddress,
    abi: walletDoctorLogAbi,
    functionName: "currentScore",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(
        isConnected &&
          address &&
          logAddress &&
          logAddress !== zeroAddress &&
          isContractConfigured(chainId ?? 0),
      ),
    },
  });

  const thresholdQuery = useReadContract({
    address: badgeAddress,
    abi: walletDoctorBadgeAbi,
    functionName: "SCORE_THRESHOLD",
    query: {
      enabled: Boolean(configured && badgeAddress),
    },
  });

  const mintMetaQuery = useQuery({
    queryKey: ["badge-minted", chainId, address, badgeAddress],
    enabled: Boolean(
      isConnected &&
        address &&
        client &&
        configured &&
        badgeAddress &&
        hasBadgeQuery.data === true,
    ),
    staleTime: 60_000,
    queryFn: async (): Promise<{ tokenId: number; scoreAtMint: number } | null> => {
      if (!client || !address || !badgeAddress) return null;

      // Prefer recent window first (public RPC 100-block limit); expand if empty
      try {
        const latest = await client.getBlockNumber();
        // Search last ~50k blocks in 100-block chunks is heavy — use single large try then fallback
        // Most mints are recent; try last 10_000 then full via API proxy if available
        const windows: Array<{ from: bigint; to: bigint }> = [
          { from: latest > 10_000n ? latest - 10_000n : 0n, to: latest },
          { from: 0n, to: latest },
        ];

        for (const w of windows) {
          try {
            const logs = await client.getLogs({
              address: badgeAddress,
              event: badgeMintedEvent,
              args: { wallet: address },
              fromBlock: w.from,
              toBlock: w.to,
            });
            if (!logs.length) continue;
            const last = logs[logs.length - 1]!;
            return {
              tokenId: Number(last.args.tokenId ?? 0n),
              scoreAtMint: Number(last.args.scoreAtMint ?? 0n),
            };
          } catch {
            // Range limit — try next strategy
          }
        }
      } catch {
        // ignore
      }

      // Fallback: HyperSync proxy (same as approval scan)
      try {
        const { fetchLogsViaApi } = await import("@/lib/scanner/hypersync");
        const { toEventSelector } = await import("viem");
        const topic0 = toEventSelector(badgeMintedEvent);
        const ownerTopic =
          `0x000000000000000000000000${address.slice(2).toLowerCase()}` as `0x${string}`;
        const latest = await client.getBlockNumber();
        const raw = await fetchLogsViaApi(chainId!, {
          address: badgeAddress,
          topics: [topic0, ownerTopic],
          fromBlock: 0,
          toBlock: Number(latest),
        });
        if (!raw.length) return null;
        const last = raw[raw.length - 1]!;
        // data is abi-encoded scoreAtMint (uint256); tokenId is topics[2]
        const tokenId = last.topics[2]
          ? Number(BigInt(last.topics[2]))
          : 0;
        const scoreAtMint = last.data && last.data !== "0x"
          ? Number(BigInt(last.data))
          : 0;
        return { tokenId, scoreAtMint };
      } catch {
        return null;
      }
    },
  });

  const hasBadge = Boolean(hasBadgeQuery.data);
  const onchainScore =
    onchainScoreQuery.data !== undefined
      ? Number(onchainScoreQuery.data)
      : null;
  const threshold =
    thresholdQuery.data !== undefined ? Number(thresholdQuery.data) : 80;

  return {
    hasBadge,
    onchainScore,
    scoreAtMint: mintMetaQuery.data?.scoreAtMint ?? null,
    tokenId: mintMetaQuery.data?.tokenId ?? null,
    threshold,
    badgeAddress,
    logAddress,
    configured,
    loading:
      hasBadgeQuery.isLoading ||
      onchainScoreQuery.isLoading ||
      (hasBadge && mintMetaQuery.isLoading),
  };
}
