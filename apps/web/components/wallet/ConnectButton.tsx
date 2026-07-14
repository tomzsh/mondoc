"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import { CaretDown } from "@phosphor-icons/react";
import {
  MonadNetworkIcon,
  MONAD_CHAIN_IDS,
} from "@/components/brand/MonadNetworkIcon";
import { useHasMounted } from "@/lib/useHasMounted";

/** Stable SSR + first paint markup (must match server HTML). */
function ConnectPlaceholder() {
  return (
    <button
      type="button"
      className="rk-header-btn rk-header-btn-primary"
      aria-label="Connect wallet"
      disabled
    >
      <span className="sm:hidden">Connect</span>
      <span className="hidden sm:inline">Connect wallet</span>
    </button>
  );
}

/**
 * Compact header wallet control.
 * Waits for client mount before reading RainbowKit account state so SSR HTML
 * always matches the first client paint (avoids hydration text mismatches).
 */
export function ConnectButton() {
  const hasMounted = useHasMounted();

  if (!hasMounted) {
    return (
      <div className="rk-connect-wrap">
        <ConnectPlaceholder />
      </div>
    );
  }

  return (
    <div className="rk-connect-wrap">
      <RKConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          mounted,
        }) => {
          if (!mounted) {
            return <ConnectPlaceholder />;
          }

          if (!account || !chain) {
            return (
              <button
                type="button"
                onClick={() => openConnectModal?.()}
                className="rk-header-btn rk-header-btn-primary"
                aria-label="Connect wallet"
              >
                <span className="sm:hidden">Connect</span>
                <span className="hidden sm:inline">Connect wallet</span>
              </button>
            );
          }

          if (chain.unsupported) {
            return (
              <button
                type="button"
                onClick={() => openChainModal?.()}
                className="rk-header-btn rk-header-btn-warn"
                aria-label="Wrong network — switch network"
              >
                <span className="sm:hidden">Network</span>
                <span className="hidden sm:inline">Wrong network</span>
              </button>
            );
          }

          const isMonad = MONAD_CHAIN_IDS.has(chain.id);
          const shortLabel =
            chain.id === 10143
              ? "Testnet"
              : chain.id === 143
                ? "Mainnet"
                : chain.name;

          return (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => openChainModal?.()}
                className="rk-header-btn rk-header-btn-network rk-header-btn-icon"
                title={chain.name}
                aria-label={`Network: ${chain.name}. Switch network`}
              >
                {isMonad ? (
                  <MonadNetworkIcon size={16} />
                ) : chain.hasIcon && chain.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    src={chain.iconUrl}
                    className="h-4 w-4 rounded-full"
                    style={{ background: chain.iconBackground }}
                  />
                ) : (
                  <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-white">
                    ?
                  </span>
                )}
                <span className="hidden max-w-[5.5rem] truncate sm:inline">
                  {shortLabel}
                </span>
                <CaretDown
                  size={12}
                  weight="bold"
                  className="hidden opacity-60 sm:block"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                onClick={() => openAccountModal?.()}
                className="rk-header-btn rk-header-btn-secondary max-w-[5.5rem] sm:max-w-[8rem]"
                title={account.address}
                aria-label={`Account ${account.displayName}`}
              >
                <span className="truncate">{account.displayName}</span>
              </button>
            </div>
          );
        }}
      </RKConnectButton.Custom>
    </div>
  );
}
