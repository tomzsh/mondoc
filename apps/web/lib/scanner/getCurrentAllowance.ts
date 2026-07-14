import {
  type Address,
  type PublicClient,
  erc20Abi as viemErc20Abi,
} from "viem";
import { erc721Abi } from "@/lib/contracts/abis";

export async function getErc20Allowance(
  client: PublicClient,
  token: Address,
  owner: Address,
  spender: Address,
): Promise<bigint> {
  try {
    return await client.readContract({
      address: token,
      abi: viemErc20Abi,
      functionName: "allowance",
      args: [owner, spender],
    });
  } catch {
    return 0n;
  }
}

export async function getIsApprovedForAll(
  client: PublicClient,
  token: Address,
  owner: Address,
  operator: Address,
): Promise<boolean> {
  try {
    return await client.readContract({
      address: token,
      abi: erc721Abi,
      functionName: "isApprovedForAll",
      args: [owner, operator],
    });
  } catch {
    return false;
  }
}

export async function getTokenMeta(
  client: PublicClient,
  token: Address,
): Promise<{ symbol?: string; name?: string; decimals?: number }> {
  try {
    const [symbol, name, decimals] = await Promise.all([
      client
        .readContract({ address: token, abi: viemErc20Abi, functionName: "symbol" })
        .catch(() => undefined),
      client
        .readContract({ address: token, abi: viemErc20Abi, functionName: "name" })
        .catch(() => undefined),
      client
        .readContract({ address: token, abi: viemErc20Abi, functionName: "decimals" })
        .catch(() => undefined),
    ]);
    return {
      symbol: symbol as string | undefined,
      name: name as string | undefined,
      decimals: decimals as number | undefined,
    };
  } catch {
    return {};
  }
}
