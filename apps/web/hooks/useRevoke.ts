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
import { erc721Abi, walletDoctorLogAbi, walletDoctorBadgeAbi } from "@/lib/contracts/abis";
import {
  WALLET_DOCTOR_LOG,
  WALLET_DOCTOR_BADGE,
  isContractConfigured,
} from "@/lib/contracts/addresses";
import type { ClassifiedApproval } from "@/lib/scanner/classifyRisk";
import { calculateScore } from "@/lib/score/calculateScore";
import { estimateContractGasBuffered } from "@/lib/gas";
import { useQueryClient } from "@tanstack/react-query";
import { approvalKey } from "@/lib/store";

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

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["approvals"] });
    await queryClient.invalidateQueries({ queryKey: ["cleanup-history"] });
    await queryClient.invalidateQueries({ queryKey: ["badge-minted"] });
  }, [queryClient]);

  const optimisticallyRemove = useCallback(
    (items: ClassifiedApproval[]) => {
      const drop = new Set(items.map((a) => approvalKey(a.token, a.spender)));
      queryClient.setQueriesData<ClassifiedApproval[]>(
        { queryKey: ["approvals"] },
        (old) =>
          old?.filter((a) => !drop.has(approvalKey(a.token, a.spender))) ?? old,
      );
    },
    [queryClient],
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

  /**
   * One tx for N cleanup records + single score write.
   * Never mints a badge.
   */
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

      // Prefer v3 batchLogCleanup; fall back to single logCleanup if missing
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
        // Old contract without batchLogCleanup — single final entry
        console.warn("batchLogCleanup failed, falling back to logCleanup", e);
        const last = chunk[chunk.length - 1]!;
        await logCleanup(last.spender, last.token, finalScore);
      }
    },
    [address, chainId, client, writeContractAsync, logCleanup],
  );

  /**
   * Explicit badge mint only — never called from revoke paths.
   */
  const mintBadge = useCallback(async () => {
    if (!address || !chainId) {
      toast.error("Connect your wallet first");
      return;
    }
    const badgeAddress = WALLET_DOCTOR_BADGE[chainId];
    if (!badgeAddress || badgeAddress === zeroAddress) {
      toast.error("Badge contract not configured");
      return;
    }

    setBusy(true);
    try {
      const has = await client?.readContract({
        address: badgeAddress,
        abi: walletDoctorBadgeAbi,
        functionName: "hasBadge",
        args: [address],
      });
      if (has) {
        toast.message("Badge already minted");
        return;
      }

      const gas = client
        ? await estimateContractGasBuffered(() =>
            client.estimateContractGas({
              address: badgeAddress,
              abi: walletDoctorBadgeAbi,
              functionName: "mintBadge",
              args: [],
              account: address,
            }),
          )
        : undefined;

      const hash = await writeContractAsync({
        address: badgeAddress,
        abi: walletDoctorBadgeAbi,
        functionName: "mintBadge",
        args: [],
        ...(gas !== undefined ? { gas } : {}),
      });
      setPendingHash(hash);
      if (client) await client.waitForTransactionReceipt({ hash });
      toast.success("MonDoc badge minted", {
        description: "Soulbound NFT — mint is optional, not tied to each revoke.",
      });
      await invalidate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Mint failed";
      toast.error(msg.slice(0, 140));
    } finally {
      setBusy(false);
    }
  }, [address, chainId, client, writeContractAsync, invalidate]);

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
          // Log only — never mint badge here
          await logCleanup(approval.spender, approval.token, newScore);
        } catch (e) {
          console.error(e);
          toast.error("Revoke succeeded, but onchain log failed");
        }

        if (newScore >= 80) {
          toast.message("Score ≥ 80 — mint badge from the Badge panel (optional)");
        }

        await invalidate();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Revoke cancelled / failed";
        toast.error(msg.slice(0, 120), { id: "revoke" });
      } finally {
        setBusy(false);
      }
    },
    [address, sendRevokeTx, optimisticallyRemove, logCleanup, invalidate],
  );

  /**
   * Multi-revoke:
   * 1) Sequential token revokes (EOA must call each token contract)
   * 2) One batchLogCleanup tx for all successful pairs
   * 3) Never mints badge
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

        if (newScore >= 80) {
          toast.message(
            "Score ≥ 80 — mint badge from the Badge panel when ready (not auto)",
          );
        }

        await invalidate();
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
      invalidate,
    ],
  );

  return {
    revokeOne,
    revokeMany,
    mintBadge,
    busy: busy || receipt.isLoading,
    pendingHash,
  };
}
