import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http, fallback, defineChain, type Chain } from "viem";
import {
  getMainnetRpc,
  getTestnetRpc,
  getRpcFallbacks,
  MONAD_MAINNET_ID,
  MONAD_TESTNET_ID,
  DEFAULT_TESTNET_RPC,
  DEFAULT_MAINNET_RPC,
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
      public: { http: [DEFAULT_TESTNET_RPC] },
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
      public: { http: [DEFAULT_MAINNET_RPC] },
    },
    blockExplorers: {
      default: { name: "MonadVision", url: "https://monadvision.com" },
    },
    testnet: false,
  }),
  ...monadIcon,
} as Chain & { iconUrl: string; iconBackground: string };

const projectId =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim()) ||
  "";

const walletConnectProjectId =
  projectId.length > 0 ? projectId : "00000000000000000000000000000000";

function makeTransport(chainId: number) {
  const urls = getRpcFallbacks(chainId);
  const opts = {
    // Batching causes intermittent "HTTP request failed" on public Monad RPC
    batch: false as const,
    retryCount: 3,
    retryDelay: 400,
    timeout: 25_000,
  };
  if (urls.length === 1) return http(urls[0], opts);
  return fallback(
    urls.map((u) => http(u, opts)),
    { rank: false, retryCount: 1 },
  );
}

export const wagmiConfig = getDefaultConfig({
  appName: "MonDoc",
  projectId: walletConnectProjectId,
  chains: [monadTestnet, monadMainnet],
  ssr: true,
  transports: {
    [monadTestnet.id]: makeTransport(MONAD_TESTNET_ID),
    [monadMainnet.id]: makeTransport(MONAD_MAINNET_ID),
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
