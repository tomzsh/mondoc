"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { scanApprovals } from "@/lib/scanner/getApprovalEvents";
import { getScanRange, type ScanRangeId } from "@/lib/scanner/scanRanges";
import {
  recommendedMinChunk,
  recommendedScanChunk,
  recommendedScanConcurrency,
} from "@/lib/rpc";
import { useUiStore } from "@/lib/store";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";

export function useApprovals(enabled = true) {
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const setScanProgress = useUiStore((s) => s.setScanProgress);
  const scanRangeId = useUiStore((s) => s.scanRangeId);

  return useQuery<ClassifiedApproval[]>({
    queryKey: ["approvals", chainId, address, scanRangeId],
    enabled: Boolean(enabled && isConnected && address && client && chainId),
    // Short stale time so Rescan after seed/revoke picks up new logs quickly
    staleTime: 15_000,
    gcTime: 10 * 60_000,
    // Important: allow switching range while a long "all" scan is running
    // TanStack Query will abort the previous query via `signal`
    retry: false,
    queryFn: async ({ signal, queryKey }) => {
      if (!client || !address || !chainId) return [];

      // Always read range from the query key (never a stale closure)
      const rangeId = queryKey[3] as ScanRangeId;
      const range = getScanRange(rangeId);

      try {
        return await scanApprovals(client, address, {
          lookbackBlocks: range.lookbackBlocks,
          chunkSize: recommendedScanChunk(chainId),
          minChunkSize: recommendedMinChunk(chainId),
          concurrency: recommendedScanConcurrency(),
          onProgress: (msg) => {
            // Ignore progress from aborted / superseded scans
            if (signal.aborted) return;
            const current = useUiStore.getState().scanRangeId;
            if (current !== rangeId) return;
            setScanProgress(msg);
          },
          signal,
        });
      } finally {
        // Only clear progress if this scan is still the active range
        if (!signal.aborted && useUiStore.getState().scanRangeId === rangeId) {
          setScanProgress(null);
        }
      }
    },
  });
}

/** Cancel in-flight approval scans (e.g. when user switches history range). */
export function useCancelApprovalScans() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.cancelQueries({ queryKey: ["approvals"] });
  };
}
