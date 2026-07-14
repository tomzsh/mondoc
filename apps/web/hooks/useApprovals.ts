"use client";

import { useEffect } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { scanApprovals } from "@/lib/scanner/getApprovalEvents";
import { getScanRange, type ScanRangeId } from "@/lib/scanner/scanRanges";
import {
  recommendedMinChunk,
  recommendedScanChunk,
  recommendedScanConcurrency,
} from "@/lib/rpc";
import { approvalKey, useUiStore } from "@/lib/store";
import {
  APPROVALS_GC_MS,
  APPROVALS_STALE_MS,
  filterRevokedApprovals,
} from "@/lib/queryCache";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";

export function useApprovals(enabled = true) {
  const { address, chainId, isConnected } = useAccount();
  const client = usePublicClient();
  const setScanProgress = useUiStore((s) => s.setScanProgress);
  const scanRangeId = useUiStore((s) => s.scanRangeId);
  const revokedKeys = useUiStore((s) => s.revokedKeys);
  const reconcileRevokedWithScan = useUiStore(
    (s) => s.reconcileRevokedWithScan,
  );
  const resetSessionCache = useUiStore((s) => s.resetSessionCache);

  // New wallet / chain → drop session tombstones & pending cleanups
  useEffect(() => {
    resetSessionCache();
  }, [address, chainId, resetSessionCache]);

  const query = useQuery<ClassifiedApproval[]>({
    queryKey: ["approvals", chainId, address, scanRangeId],
    enabled: Boolean(enabled && isConnected && address && client && chainId),
    staleTime: APPROVALS_STALE_MS,
    gcTime: APPROVALS_GC_MS,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
    queryFn: async ({ signal, queryKey }) => {
      if (!client || !address || !chainId) return [];

      const rangeId = queryKey[3] as ScanRangeId;
      const range = getScanRange(rangeId);

      try {
        return await scanApprovals(client, address, {
          lookbackBlocks: range.lookbackBlocks,
          chunkSize: recommendedScanChunk(chainId),
          minChunkSize: recommendedMinChunk(chainId),
          concurrency: recommendedScanConcurrency(),
          onProgress: (msg) => {
            if (signal.aborted) return;
            if (useUiStore.getState().scanRangeId !== rangeId) return;
            setScanProgress(msg);
          },
          signal,
        });
      } finally {
        if (
          !signal.aborted &&
          useUiStore.getState().scanRangeId === rangeId
        ) {
          setScanProgress(null);
        }
      }
    },
  });

  // Filter tombstones at read time; reconcile after a successful fetch
  const raw = query.data;
  const filtered = filterRevokedApprovals(raw, revokedKeys);

  useEffect(() => {
    if (!query.isSuccess || !raw) return;
    // Only reconcile when this is a settled network fetch (not pure cache)
    if (query.isFetching) return;
    const activeKeys = raw.map((a) => approvalKey(a.token, a.spender));
    reconcileRevokedWithScan(activeKeys);
  }, [
    query.isSuccess,
    query.isFetching,
    query.dataUpdatedAt,
    raw,
    reconcileRevokedWithScan,
  ]);

  return {
    ...query,
    data: filtered,
  };
}

/** Cancel in-flight approval scans (e.g. when user switches history range). */
export function useCancelApprovalScans() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.cancelQueries({ queryKey: ["approvals"] });
  };
}
