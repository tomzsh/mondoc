"use client";

import { useCallback, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { toast } from "sonner";
import { type Address, erc20Abi, zeroAddress } from "viem";
import { erc721Abi, walletDoctorLogAbi } from "@/lib/contracts/abis";
import {
  WALLET_DOCTOR_LOG,
  isContractConfigured,
} from "@/lib/contracts/addresses";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { calculateScore } from "@/lib/score/calculateScore";
import { estimateContractGasBuffered } from "@/lib/gas";
import { useQueryClient } from "@tanstack/react-query";
import { approvalKey, useUiStore } from "@/lib/store";
import { applyOptimisticRevokes, invalidateLightReads } from "@/lib/queryCache";

/** Onchain batch cap (WalletDoctorLog.MAX_BATCH). */
const MAX_LOG_BATCH = 25;

function samePair(a: ClassifiedApproval, b: ClassifiedApproval) {
  return (
    a.token.toLowerCase() === b.token.toLowerCase() &&
    a.spender.toLowerCase() === b.spender.toLowerCase()
  );
}

export function useRevoke() {
  const { address, chainId } = useAccount();
  const client = usePublicClient();
  const queryClient = useQueryClient();
  const { writeContractAsync } = useWriteContract();
  const [pendingHash, setPendingHash] = useState<`0x${string}` | undefined>();
  const [busy, setBusy] = useState(false);

  const receipt = useWaitForTransactionReceipt({ hash: pendingHash });
  const addPendingCleanups = useUiStore((s) => s.addPendingCleanups);
  const markRevoked = useUiStore((s) => s.markRevoked);

  /**
   * After revoke: optimistic list + tombstones + light onchain reads.
   * No automatic full HyperSync rescan (user hits Rescan when needed).
   */
  const softRefreshAfterRevoke = useCallback(
    (cleanupDelta: number) => {
      if (cleanupDelta > 0) addPendingCleanups(cleanupDelta);
      invalidateLightReads(queryClient);
    },
    [queryClient, addPendingCleanups],
  );

  const optimisticallyRemove = useCallback(
    (items: ClassifiedApproval[]) => {
      applyOptimisticRevokes(queryClient, items);
      markRevoked(items.map((a) => approvalKey(a.token, a.spender)));
    },
    [queryClient, markRevoked],
  );

  const logCleanup = useCallback(
    async (spender: Address, token: Address, newScore: number) => {
      if (!chainId || !isContractConfigured(chainId)) {
        toast.message("Cleanup log skipped", {
          description: "MonDoc log contract is not set (NEXT_PUBLIC_LOG_ADDRESS_*).",
        });
        return;
      }
      const logAddress = WALLET_DOCTOR_LOG[chainId];
      if (!logAddress || logAddress === zeroAddress || !address) return;

      const gas = client
        ? await estimateContractGasBuffered(() =>
            client.estimateContractGas({
              address: logAddress,
              abi: walletDoctorLogAbi,
              functionName: "logCleanup",
              args: [spender, token, BigInt(newScore)],
              account: address,
            }),
          )
        : undefined;

      const hash = await writeContractAsync({
        address: logAddress,
        abi: walletDoctorLogAbi,
        functionName: "logCleanup",
        args: [spender, token, BigInt(newScore)],
        ...(gas !== undefined ? { gas } : {}),
      });
      setPendingHash(hash);
      if (client) await client.waitForTransactionReceipt({ hash });
      toast.success("Cleanup logged onchain", {
        description: `Score → ${newScore}`,
      });
    },
    [address, chainId, client, writeContractAsync],
  );

  /** One tx for N cleanup records + single score write. */
  const batchLogCleanup = useCallback(
    async (items: ClassifiedApproval[], finalScore: number) => {
      if (!chainId || !isContractConfigured(chainId) || !address) {
        toast.message("Cleanup log skipped", {
          description: "MonDoc log contract is not set.",
        });
        return;
      }
      const logAddress = WALLET_DOCTOR_LOG[chainId];
      if (!logAddress || logAddress === zeroAddress) return;

      const chunk = items.slice(0, MAX_LOG_BATCH);
      const spenders = chunk.map((i) => i.spender);
      const tokens = chunk.map((i) => i.token);

      try {
        const gas = client
          ? await estimateContractGasBuffered(() =>
              client.estimateContractGas({
                address: logAddress,
                abi: walletDoctorLogAbi,
                functionName: "batchLogCleanup",
                args: [spenders, tokens, BigInt(finalScore)],
                account: address,
              }),
            )
          : undefined;

        const hash = await writeContractAsync({
          address: logAddress,
          abi: walletDoctorLogAbi,
          functionName: "batchLogCleanup",
          args: [spenders, tokens, BigInt(finalScore)],
          ...(gas !== undefined ? { gas } : {}),
        });
        setPendingHash(hash);
        if (client) await client.waitForTransactionReceipt({ hash });
        toast.success(
          chunk.length > 1
            ? `Logged ${chunk.length} cleanups onchain`
            : "Cleanup logged onchain",
          { description: `Score → ${finalScore}` },
        );
      } catch (e) {
        console.warn("batchLogCleanup failed, falling back to logCleanup", e);
        const last = chunk[chunk.length - 1]!;
        await logCleanup(last.spender, last.token, finalScore);
      }
    },
    [address, chainId, client, writeContractAsync, logCleanup],
  );

  const sendRevokeTx = useCallback(
    async (approval: ClassifiedApproval) => {
      if (!address) throw new Error("Connect your wallet first");

      if (approval.kind === "erc20") {
        const gas = client
          ? await estimateContractGasBuffered(() =>
              client.estimateContractGas({
                address: approval.token,
                abi: erc20Abi,
                functionName: "approve",
                args: [approval.spender, 0n],
                account: address,
              }),
            )
          : undefined;
        const hash = await writeContractAsync({
          address: approval.token,
          abi: erc20Abi,
          functionName: "approve",
          args: [approval.spender, 0n],
          ...(gas !== undefined ? { gas } : {}),
        });
        setPendingHash(hash);
        if (client) await client.waitForTransactionReceipt({ hash });
        return hash;
      }

      const gas = client
        ? await estimateContractGasBuffered(() =>
            client.estimateContractGas({
              address: approval.token,
              abi: erc721Abi,
              functionName: "setApprovalForAll",
              args: [approval.spender, false],
              account: address,
            }),
          )
        : undefined;
      const hash = await writeContractAsync({
        address: approval.token,
        abi: erc721Abi,
        functionName: "setApprovalForAll",
        args: [approval.spender, false],
        ...(gas !== undefined ? { gas } : {}),
      });
      setPendingHash(hash);
      if (client) await client.waitForTransactionReceipt({ hash });
      return hash;
    },
    [address, client, writeContractAsync],
  );

  const revokeOne = useCallback(
    async (
      approval: ClassifiedApproval,
      remaining: ClassifiedApproval[],
      cleanupCount: number,
    ) => {
      if (!address) {
        toast.error("Connect your wallet first");
        return;
      }
      setBusy(true);
      try {
        toast.loading("Waiting for revoke confirmation…", { id: "revoke" });
        await sendRevokeTx(approval);
        toast.success("Approval revoked", { id: "revoke" });

        optimisticallyRemove([approval]);

        const nextApprovals = remaining.filter((a) => !samePair(a, approval));
        const newScore = calculateScore(nextApprovals, cleanupCount + 1);

        try {
          await logCleanup(approval.spender, approval.token, newScore);
        } catch (e) {
          console.error(e);
          toast.error("Revoke succeeded, but onchain log failed");
        }

        softRefreshAfterRevoke(1);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Revoke cancelled / failed";
        toast.error(msg.slice(0, 120), { id: "revoke" });
      } finally {
        setBusy(false);
      }
    },
    [
      address,
      sendRevokeTx,
      optimisticallyRemove,
      logCleanup,
      softRefreshAfterRevoke,
    ],
  );

  /**
   * Multi-revoke:
   * 1) Sequential token revokes (EOA must call each token contract)
   * 2) One batchLogCleanup for all successful pairs
   */
  const revokeMany = useCallback(
    async (
      items: ClassifiedApproval[],
      allApprovals: ClassifiedApproval[],
      cleanupCount: number,
    ) => {
      if (!address) {
        toast.error("Connect your wallet first");
        return;
      }
      if (items.length === 0) return;

      if (items.length === 1) {
        await revokeOne(items[0]!, allApprovals, cleanupCount);
        return;
      }

      setBusy(true);
      const done: ClassifiedApproval[] = [];

      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]!;
          toast.loading(`Revoking ${i + 1}/${items.length}…`, { id: "revoke" });
          try {
            await sendRevokeTx(item);
            done.push(item);
            optimisticallyRemove([item]);
          } catch (e) {
            const msg =
              e instanceof Error ? e.message : "Revoke cancelled / failed";
            toast.error(
              `Stopped at ${i + 1}/${items.length}: ${msg.slice(0, 80)}`,
              { id: "revoke" },
            );
            break;
          }
        }

        if (done.length === 0) return;

        toast.success(
          done.length === items.length
            ? `Revoked ${done.length} approvals`
            : `Revoked ${done.length}/${items.length} (stopped early)`,
          { id: "revoke" },
        );

        const remaining = allApprovals.filter(
          (a) => !done.some((d) => samePair(a, d)),
        );
        const newScore = calculateScore(remaining, cleanupCount + done.length);

        try {
          toast.loading(
            done.length > 1
              ? `Batch-logging ${Math.min(done.length, MAX_LOG_BATCH)} cleanups…`
              : "Logging cleanup…",
            { id: "revoke-log" },
          );
          await batchLogCleanup(done, newScore);
          toast.dismiss("revoke-log");
        } catch (e) {
          console.error(e);
          toast.error("Revokes ok, but onchain log failed", {
            id: "revoke-log",
          });
        }

        softRefreshAfterRevoke(done.length);
      } finally {
        setBusy(false);
      }
    },
    [
      address,
      revokeOne,
      sendRevokeTx,
      optimisticallyRemove,
      batchLogCleanup,
      softRefreshAfterRevoke,
    ],
  );

  return {
    revokeOne,
    revokeMany,
    busy: busy || receipt.isLoading,
    pendingHash,
  };
}
