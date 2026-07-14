"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import {
  MonadNetworkIcon,
  MONAD_CHAIN_IDS,
} from "@/components/brand/MonadNetworkIcon";

/**
 * Compact RainbowKit header controls.
 * Always shows Monad logo on the network switch button (mobile has no chain name).
 */
export function ConnectButton() {
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
          const ready = mounted;
          const connected = ready && account && chain;

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none" as const,
                  userSelect: "none" as const,
                },
              })}
              className="flex items-center gap-1 sm:gap-1.5"
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="rk-header-btn rk-header-btn-primary"
                    >
                      Connect
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="rk-header-btn rk-header-btn-warn"
                    >
                      Wrong network
                    </button>
                  );
                }

                const isMonad = MONAD_CHAIN_IDS.has(chain.id);
                const shortLabel = isMonad
                  ? chain.id === 10143
                    ? "Testnet"
                    : "Mainnet"
                  : chain.name;

                return (
                  <>
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="rk-header-btn rk-header-btn-network"
                      title={chain.name}
                      aria-label={`Network: ${chain.name}. Switch network`}
                    >
                      {/* Always show logo — Monad custom chains often have no iconUrl */}
                      {isMonad ? (
                        <MonadNetworkIcon size={18} />
                      ) : chain.hasIcon && chain.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          src={chain.iconUrl}
                          className="h-[18px] w-[18px] rounded-full"
                          style={{ background: chain.iconBackground }}
                        />
                      ) : (
                        <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white">
                          ?
                        </span>
                      )}
                      {/* Mobile: short label; desktop: full name */}
                      <span className="max-w-[3.75rem] truncate sm:hidden">
                        {shortLabel}
                      </span>
                      <span className="hidden max-w-[5.5rem] truncate sm:inline">
                        {chain.name}
                      </span>
                      <ChevronDown className="opacity-60" />
                    </button>
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="rk-header-btn rk-header-btn-secondary"
                    >
                      {account.displayName}
                    </button>
                  </>
                );
              })()}
            </div>
          );
        }}
      </RKConnectButton.Custom>
    </div>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={className}
      aria-hidden
    >
      <path
        d="M2.5 3.75L5 6.25L7.5 3.75"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
