"use client";

import { type ReactNode } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { monadMainnet, monadTestnet } from "@/lib/wagmi";
import { ConnectButton } from "./ConnectButton";

const SUPPORTED_IDS: number[] = [monadTestnet.id, monadMainnet.id];

export function ChainGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-2xl">
          🩺
        </div>
        <h2 className="text-xl font-semibold text-white">Connect your wallet</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Connect to Monad Testnet or Mainnet to scan approvals and check your
          health score.
        </p>
        <div className="mt-6 flex justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (chainId && !SUPPORTED_IDS.includes(chainId)) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-10 text-center">
        <h2 className="text-xl font-semibold text-amber-200">Unsupported network</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Wallet Doctor only runs on Monad. Switch network to continue.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={() => switchChain?.({ chainId: monadTestnet.id })}
            className="rounded-xl bg-[#836EF9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#6f5ad4] disabled:opacity-50"
          >
            Switch to Monad Testnet
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => switchChain?.({ chainId: monadMainnet.id })}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50"
          >
            Switch to Monad Mainnet
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
