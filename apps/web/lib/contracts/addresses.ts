import { type Address, zeroAddress } from "viem";
import { monadMainnet, monadTestnet } from "@/lib/wagmi";

/** Deploy addresses — set via env after forge script Deploy.s.sol */
export const WALLET_DOCTOR_LOG: Record<number, Address> = {
  [monadTestnet.id]: (process.env.NEXT_PUBLIC_LOG_ADDRESS_TESTNET ||
    zeroAddress) as Address,
  [monadMainnet.id]: (process.env.NEXT_PUBLIC_LOG_ADDRESS_MAINNET ||
    zeroAddress) as Address,
};

export const WALLET_DOCTOR_BADGE: Record<number, Address> = {
  [monadTestnet.id]: (process.env.NEXT_PUBLIC_BADGE_ADDRESS_TESTNET ||
    zeroAddress) as Address,
  [monadMainnet.id]: (process.env.NEXT_PUBLIC_BADGE_ADDRESS_MAINNET ||
    zeroAddress) as Address,
};

export function isContractConfigured(chainId: number): boolean {
  const log = WALLET_DOCTOR_LOG[chainId];
  return Boolean(log && log !== zeroAddress);
}
