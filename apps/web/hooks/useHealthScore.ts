"use client";

import { useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { calculateScore, scoreLabel, scoreColor } from "@/lib/score/calculateScore";
import { useApprovals } from "./useApprovals";
import { useCleanupHistory } from "./useCleanupHistory";
import { walletDoctorBadgeAbi } from "@/lib/contracts/abis";
import { WALLET_DOCTOR_BADGE } from "@/lib/contracts/addresses";

export function useHealthScore() {
  const { address, chainId } = useAccount();
  const approvalsQuery = useApprovals();
  const history = useCleanupHistory();

  const score = useMemo(() => {
    const approvals = approvalsQuery.data ?? [];
    return calculateScore(approvals, history.total);
  }, [approvalsQuery.data, history.total]);

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
    },
  });

  return {
    score,
    label: scoreLabel(score),
    color: scoreColor(score),
    approvals: approvalsQuery.data ?? [],
    approvalsLoading: approvalsQuery.isLoading || approvalsQuery.isFetching,
    approvalsError: approvalsQuery.error,
    refetchApprovals: approvalsQuery.refetch,
    cleanupCount: history.total,
    hasBadge: Boolean(hasBadgeQuery.data),
    eligibleForBadge: score >= 80,
  };
}
