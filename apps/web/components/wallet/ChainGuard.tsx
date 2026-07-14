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
      <div className="ui-card px-4 py-10 text-center sm:px-8 sm:py-12">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-xl text-accent">
          🔗
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Connect your wallet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Connect to Monad Testnet or Mainnet to scan approvals and check your
          health score.
        </p>
        <div className="mx-auto mt-6 flex w-full max-w-xs justify-center">
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (chainId && !SUPPORTED_IDS.includes(chainId)) {
    return (
      <div className="ui-card border-warning/30 bg-warning/5 px-4 py-10 text-center sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight">Unsupported network</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          MonDoc only runs on Monad. Switch network to continue.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            disabled={isPending}
            onClick={() => switchChain?.({ chainId: monadTestnet.id })}
            className="ui-btn"
          >
            Switch to Monad Testnet
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => switchChain?.({ chainId: monadMainnet.id })}
            className="ui-btn-secondary"
          >
            Switch to Monad Mainnet
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
