"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { type Address } from "viem";
import { walletDoctorLogAbi } from "@/lib/contracts/abis";
import { WALLET_DOCTOR_LOG, isContractConfigured } from "@/lib/contracts/addresses";

export interface CleanupRecord {
  spender: Address;
  token: Address;
  timestamp: bigint;
  scoreAfter: bigint;
}

/** Max page size matches contract MAX_PAGE_LIMIT (v2). */
export function useCleanupHistory(pageSize = 50) {
  const limit = Math.min(Math.max(1, pageSize), 50);
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient();
  const logAddress = chainId ? WALLET_DOCTOR_LOG[chainId] : undefined;
  const configured = chainId ? isContractConfigured(chainId) : false;

  const lengthQuery = useReadContract({
    address: logAddress,
    abi: walletDoctorLogAbi,
    functionName: "historyLength",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && address && configured && logAddress) },
  });

  const historyQuery = useQuery({
    queryKey: ["cleanup-history", chainId, address, lengthQuery.data?.toString()],
    enabled: Boolean(
      isConnected && address && client && configured && logAddress && lengthQuery.data !== undefined,
    ),
    queryFn: async (): Promise<CleanupRecord[]> => {
      if (!client || !address || !logAddress) return [];
      const total = Number(lengthQuery.data ?? 0n);
      if (total === 0) return [];

      // latest first: fetch from end
      const start = Math.max(0, total - limit);
      const page = (await client.readContract({
        address: logAddress,
        abi: walletDoctorLogAbi,
        functionName: "getHistoryPage",
        args: [address, BigInt(start), BigInt(limit)],
      })) as CleanupRecord[];

      return [...page].reverse();
    },
  });

  return {
    ...historyQuery,
    total: lengthQuery.data ? Number(lengthQuery.data) : 0,
    isLoading: lengthQuery.isLoading || historyQuery.isLoading,
  };
}

export function useOnchainScore() {
  const { address, chainId, isConnected } = useAccount();
  const logAddress = chainId ? WALLET_DOCTOR_LOG[chainId] : undefined;
  const configured = chainId ? isContractConfigured(chainId) : false;

  return useReadContract({
    address: logAddress,
    abi: walletDoctorLogAbi,
    functionName: "currentScore",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(isConnected && address && configured && logAddress) },
  });
}
