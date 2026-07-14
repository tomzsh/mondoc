"use client";

import { useEffect, useMemo, useRef } from "react";
import { useAccount, useReadContract } from "wagmi";
import {
  calculateScore,
  scoreLabel,
  scoreColor,
} from "@/lib/score/calculateScore";
import { useApprovals } from "./useApprovals";
import { useCleanupHistory } from "./useCleanupHistory";
import { walletDoctorBadgeAbi } from "@/lib/contracts/abis";
import { WALLET_DOCTOR_BADGE } from "@/lib/contracts/addresses";
import { useUiStore } from "@/lib/store";

export function useHealthScore() {
  const { address, chainId } = useAccount();
  const approvalsQuery = useApprovals();
  const history = useCleanupHistory();
  const pendingCleanups = useUiStore((s) => s.pendingCleanups);
  const consumePendingCleanups = useUiStore((s) => s.consumePendingCleanups);

  const onchainCleanups = history.total;
  const prevOnchain = useRef(onchainCleanups);

  // Consume local bonus by the amount historyLength grew (not a hard clear)
  useEffect(() => {
    const prev = prevOnchain.current;
    if (onchainCleanups > prev && pendingCleanups > 0) {
      consumePendingCleanups(onchainCleanups - prev);
    }
    prevOnchain.current = onchainCleanups;
  }, [onchainCleanups, pendingCleanups, consumePendingCleanups]);

  const cleanupCount = onchainCleanups + pendingCleanups;
  const approvals = approvalsQuery.data ?? [];

  const score = useMemo(
    () => calculateScore(approvals, cleanupCount),
    [approvals, cleanupCount],
  );

  const badgeAddress = chainId ? WALLET_DOCTOR_BADGE[chainId] : undefined;
  const hasBadgeQuery = useReadContract({
    address: badgeAddress,
    abi: walletDoctorBadgeAbi,
    functionName: "hasBadge",
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(
        address &&
          badgeAddress &&
          badgeAddress !== "0x0000000000000000000000000000000000000000",
      ),
      staleTime: 60_000,
    },
  });

  /** True only on cold first load (no cached list yet) */
  const approvalsLoading =
    approvalsQuery.isLoading &&
    !approvalsQuery.data &&
    !approvalsQuery.isFetched;

  const approvalsRefreshing =
    approvalsQuery.isFetching && !approvalsLoading && Boolean(approvalsQuery.data || approvalsQuery.isFetched);

  return {
    score,
    label: scoreLabel(score),
    color: scoreColor(score),
    approvals,
    approvalsLoading,
    approvalsRefreshing,
    approvalsError: approvalsQuery.error,
    refetchApprovals: approvalsQuery.refetch,
    cleanupCount,
    hasBadge: Boolean(hasBadgeQuery.data),
    eligibleForBadge: score >= 80,
  };
}
