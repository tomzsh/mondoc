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

  const logCleanup = useCallback(
    async (spender: Address, token: Address, newScore: number) => {
      if (!chainId || !isContractConfigured(chainId)) {
        toast.message("Cleanup log skipped", {
          description: "WalletDoctorLog is not set (NEXT_PUBLIC_LOG_ADDRESS_*).",
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
      if (client) {
        await client.waitForTransactionReceipt({ hash });
      }
      toast.success("Cleanup logged onchain", {
        description: `Score → ${newScore}`,
      });
    },
    [address, chainId, client, writeContractAsync],
  );

  const tryMintBadge = useCallback(
    async (score: number) => {
      if (!address || !chainId || score < 80) return;
      const badgeAddress = WALLET_DOCTOR_BADGE[chainId];
      if (!badgeAddress || badgeAddress === zeroAddress) return;

      try {
        const has = await client?.readContract({
          address: badgeAddress,
          abi: walletDoctorBadgeAbi,
          functionName: "hasBadge",
          args: [address],
        });
        if (has) return;

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
        toast.success("Cleanup Badge minted! 🏅", {
          description: "Soulbound NFT as proof of a healthy wallet.",
        });
      } catch {
        // mint is best-effort; score may not be onchain yet or already minted
      }
    },
    [address, chainId, client, writeContractAsync],
  );

  const revokeOne = useCallback(
    async (approval: ClassifiedApproval, remaining: ClassifiedApproval[], cleanupCount: number) => {
      if (!address) {
        toast.error("Connect your wallet first");
        return;
      }
      setBusy(true);
      try {
        let hash: `0x${string}`;
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
          hash = await writeContractAsync({
            address: approval.token,
            abi: erc20Abi,
            functionName: "approve",
            args: [approval.spender, 0n],
            ...(gas !== undefined ? { gas } : {}),
          });
        } else {
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
          hash = await writeContractAsync({
            address: approval.token,
            abi: erc721Abi,
            functionName: "setApprovalForAll",
            args: [approval.spender, false],
            ...(gas !== undefined ? { gas } : {}),
          });
        }
        setPendingHash(hash);
        toast.loading("Waiting for revoke confirmation…", { id: "revoke" });
        if (client) await client.waitForTransactionReceipt({ hash });
        toast.success("Approval revoked", { id: "revoke" });

        const nextApprovals = remaining.filter(
          (a) =>
            !(
              a.token.toLowerCase() === approval.token.toLowerCase() &&
              a.spender.toLowerCase() === approval.spender.toLowerCase()
            ),
        );
        const newScore = calculateScore(nextApprovals, cleanupCount + 1);

        try {
          await logCleanup(approval.spender, approval.token, newScore);
          await tryMintBadge(newScore);
        } catch (e) {
          console.error(e);
          toast.error("Revoke succeeded, but onchain log failed");
        }

        await invalidate();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Revoke cancelled / failed";
        toast.error(msg.slice(0, 120), { id: "revoke" });
      } finally {
        setBusy(false);
      }
    },
    [address, client, writeContractAsync, logCleanup, tryMintBadge, invalidate],
  );

  const revokeMany = useCallback(
    async (items: ClassifiedApproval[], allApprovals: ClassifiedApproval[], cleanupCount: number) => {
      let remaining = [...allApprovals];
      let cleanups = cleanupCount;
      for (const item of items) {
        await revokeOne(item, remaining, cleanups);
        remaining = remaining.filter(
          (a) =>
            !(
              a.token.toLowerCase() === item.token.toLowerCase() &&
              a.spender.toLowerCase() === item.spender.toLowerCase()
            ),
        );
        cleanups += 1;
      }
    },
    [revokeOne],
  );

  return {
    revokeOne,
    revokeMany,
    busy: busy || receipt.isLoading,
    pendingHash,
  };
}
