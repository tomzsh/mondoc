"use client";

import { useAccount, useReadContract } from "wagmi";
import { type Address, zeroAddress } from "viem";
import { walletDoctorBadgeAbi, walletDoctorLogAbi } from "@/lib/contracts/abis";
import {
  WALLET_DOCTOR_BADGE,
  WALLET_DOCTOR_LOG,
  isContractConfigured,
} from "@/lib/contracts/addresses";

export interface BadgeNftStatus {
  hasBadge: boolean;
  onchainScore: number | null;
  scoreAtMint: number | null;
  tokenId: number | null;
  threshold: number;
  badgeAddress: Address | undefined;
  logAddress: Address | undefined;
  configured: boolean;
  loading: boolean;
}

/**
 * Cleanup Badge NFT status — prefers onchain scoreAtMint / tokenIdOf (v2).
 */
export function useBadgeNft(): BadgeNftStatus {
  const { address, chainId, isConnected } = useAccount();

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

  const tokenIdQuery = useReadContract({
    address: badgeAddress,
    abi: walletDoctorBadgeAbi,
    functionName: "tokenIdOf",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(
        isConnected &&
          address &&
          configured &&
          badgeAddress &&
          hasBadgeQuery.data === true,
      ),
    },
  });

  const tokenId =
    hasBadgeQuery.data && tokenIdQuery.data !== undefined
      ? Number(tokenIdQuery.data)
      : null;

  const scoreAtMintQuery = useReadContract({
    address: badgeAddress,
    abi: walletDoctorBadgeAbi,
    functionName: "scoreAtMint",
    args: tokenId != null ? [BigInt(tokenId)] : undefined,
    query: {
      enabled: Boolean(
        configured && badgeAddress && tokenId != null && hasBadgeQuery.data,
      ),
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
    scoreAtMint:
      scoreAtMintQuery.data !== undefined
        ? Number(scoreAtMintQuery.data)
        : null,
    tokenId,
    threshold,
    badgeAddress,
    logAddress,
    configured,
    loading:
      hasBadgeQuery.isLoading ||
      onchainScoreQuery.isLoading ||
      (hasBadge && (tokenIdQuery.isLoading || scoreAtMintQuery.isLoading)),
  };
}
