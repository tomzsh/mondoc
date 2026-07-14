"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  calculateScore,
  scoreLabel,
  scoreColor,
} from "@/lib/score/calculateScore";
import { useApprovals } from "./useApprovals";
import { useCleanupHistory } from "./useCleanupHistory";
import { useUiStore } from "@/lib/store";

export function useHealthScore() {
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

  /** True only on cold first load (no cached list yet) */
  const approvalsLoading =
    approvalsQuery.isLoading &&
    !approvalsQuery.data &&
    !approvalsQuery.isFetched;

  const approvalsRefreshing =
    approvalsQuery.isFetching &&
    !approvalsLoading &&
    Boolean(approvalsQuery.data || approvalsQuery.isFetched);

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
  };
}
