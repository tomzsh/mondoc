import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, defineChain, type Chain } from "viem";
import {
  getMainnetRpc,
  getTestnetRpc,
  MONAD_MAINNET_ID,
  MONAD_TESTNET_ID,
} from "@/lib/rpc";

const monadIcon = {
  iconUrl: "/monad-icon.svg",
  iconBackground: "#6E54FF",
};

export const monadTestnet = {
  ...defineChain({
    id: MONAD_TESTNET_ID,
    name: "Monad Testnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: {
      default: { http: [getTestnetRpc()] },
    },
    blockExplorers: {
      default: {
        name: "Monad Explorer",
        url: "https://testnet.monadexplorer.com",
      },
    },
    testnet: true,
  }),
  ...monadIcon,
} as Chain & { iconUrl: string; iconBackground: string };

export const monadMainnet = {
  ...defineChain({
    id: MONAD_MAINNET_ID,
    name: "Monad Mainnet",
    nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
    rpcUrls: {
      default: { http: [getMainnetRpc()] },
    },
    blockExplorers: {
      default: { name: "MonadVision", url: "https://monadvision.com" },
    },
    testnet: false,
  }),
  ...monadIcon,
} as Chain & { iconUrl: string; iconBackground: string };

/**
 * WalletConnect Cloud project ID is required for the WalletConnect option
 * in the RainbowKit modal. Get one free at https://cloud.walletconnect.com
 *
 * Injected wallets (MetaMask, Rabby, OKX browser extension) work without it.
 */
const projectId =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()) ||
  "";

const walletConnectProjectId =
  projectId.length > 0 ? projectId : "00000000000000000000000000000000";

export const wagmiConfig = getDefaultConfig({
  appName: "Monad Wallet Doctor",
  projectId: walletConnectProjectId,
  chains: [monadTestnet, monadMainnet],
  ssr: true,
  transports: {
    [monadTestnet.id]: http(getTestnetRpc(), {
      batch: true,
      retryCount: 2,
      timeout: 30_000,
    }),
    [monadMainnet.id]: http(getMainnetRpc(), {
      batch: true,
      retryCount: 2,
      timeout: 30_000,
    }),
  },
});

export function getExplorerTxUrl(chainId: number, hash: string): string {
  if (chainId === monadMainnet.id) {
    return `https://monadvision.com/tx/${hash}`;
  }
  return `https://testnet.monadexplorer.com/tx/${hash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  if (chainId === monadMainnet.id) {
    return `https://monadvision.com/address/${address}`;
  }
  return `https://testnet.monadexplorer.com/address/${address}`;
}
