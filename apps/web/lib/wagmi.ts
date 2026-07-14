import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_MONAD_TESTNET_RPC || "https://testnet-rpc.monad.xyz",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_MONAD_MAINNET_RPC || "https://rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
  testnet: false,
});

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "wallet-doctor-demo-project-id";

export const wagmiConfig = getDefaultConfig({
  appName: "Monad Wallet Doctor",
  projectId,
  chains: [monadTestnet, monadMainnet],
  ssr: true,
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
