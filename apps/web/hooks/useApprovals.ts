"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { scanApprovals } from "@/lib/scanner/getApprovalEvents";
import { useUiStore } from "@/lib/store";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";

export function useApprovals(enabled = true) {
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient();
  const setScanProgress = useUiStore((s) => s.setScanProgress);

  return useQuery<ClassifiedApproval[]>({
    queryKey: ["approvals", chainId, address],
    enabled: Boolean(enabled && isConnected && address && client && chainId),
    staleTime: 30_000,
    queryFn: async () => {
      if (!client || !address) return [];
      try {
        return await scanApprovals(client, address, {
          lookbackBlocks: Number(process.env.NEXT_PUBLIC_SCAN_LOOKBACK_BLOCKS || 100_000),
          chunkSize: Number(process.env.NEXT_PUBLIC_SCAN_CHUNK_SIZE || 5_000),
          onProgress: setScanProgress,
        });
      } finally {
        setScanProgress(null);
      }
    },
  });
}
