"use client";

import { ConnectButton as RKConnectButton } from "@rainbow-me/rainbowkit";
import {
  MonadNetworkIcon,
  MONAD_CHAIN_IDS,
} from "@/components/brand/MonadNetworkIcon";

/**
 * Compact RainbowKit header controls.
 * Mobile: icon-only network + short account · Desktop: labels.
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
                      <span className="sm:hidden">Connect</span>
                      <span className="hidden sm:inline">Connect wallet</span>
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
                  <>
                    <button
                      type="button"
                      onClick={openChainModal}
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
                      <ChevronDown className="hidden opacity-60 sm:block" />
                    </button>
                    <button
                      type="button"
                      onClick={openAccountModal}
                      className="rk-header-btn rk-header-btn-secondary max-w-[5.5rem] sm:max-w-[8rem]"
                      title={account.address}
                    >
                      <span className="truncate">{account.displayName}</span>
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
