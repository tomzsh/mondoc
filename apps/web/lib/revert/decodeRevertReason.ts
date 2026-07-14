import {
  type Hex,
  type PublicClient,
  decodeErrorResult,
  hexToString,
  isHex,
} from "viem";

export interface ExplainedRevert {
  title: string;
  explanation: string;
  suggestion: string;
  rawReason?: string;
  category:
    | "allowance"
    | "balance"
    | "slippage"
    | "deadline"
    | "gas"
    | "paused"
    | "custom"
    | "unknown";
}

const PATTERNS: {
  match: RegExp;
  category: ExplainedRevert["category"];
  title: string;
  explanation: string;
  suggestion: string;
}[] = [
  {
    match: /insufficient allowance|ERC20: insufficient allowance|transfer amount exceeds allowance/i,
    category: "allowance",
    title: "Insufficient token allowance",
    explanation:
      "You have not approved enough tokens for this transaction. The contract is not allowed to pull your tokens.",
    suggestion:
      "Open the original dApp and re-approve the token with a sufficient amount (or unlimited if you trust the contract), then try again.",
  },
  {
    match: /insufficient (funds|balance)|transfer amount exceeds balance|ERC20: transfer amount exceeds balance|balance too low/i,
    category: "balance",
    title: "Insufficient balance",
    explanation: "Token balance (or native MON) is not enough to complete the transaction.",
    suggestion:
      "Check the required token balance, ensure you have enough gas (MON), then retry with a smaller amount if needed.",
  },
  {
    match: /slippage|INSUFFICIENT_OUTPUT_AMOUNT|Too little received|price impact|STF/i,
    category: "slippage",
    title: "Slippage / price moved",
    explanation:
      "The pool price changed while the transaction was pending, so the output fell below your slippage tolerance.",
    suggestion:
      "Slightly increase slippage tolerance, or retry when the market is more stable. Avoid extreme slippage on thin pools.",
  },
  {
    match: /EXPIRED|Transaction too old|deadline|Expired/i,
    category: "deadline",
    title: "Transaction deadline exceeded",
    explanation:
      "The swap/transaction deadline passed before the tx was included in a block.",
    suggestion: "Resubmit with a looser deadline (many DEXes default to ~20 minutes).",
  },
  {
    match: /out of gas|gas required exceeds|intrinsic gas too low/i,
    category: "gas",
    title: "Gas limit too low",
    explanation: "The transaction ran out of gas before finishing execution.",
    suggestion:
      "Increase the gas limit in your wallet (or use automatic estimation) and ensure you have enough MON for fees.",
  },
  {
    match: /paused|Pausable: paused/i,
    category: "paused",
    title: "Contract is paused",
    explanation:
      "The target contract has temporarily disabled the related function (e.g. emergency pause).",
    suggestion: "Check the project's announcements / explorer. Retry after the contract is unpaused.",
  },
  {
    match: /execution reverted/i,
    category: "unknown",
    title: "Transaction reverted",
    explanation:
      "The contract rejected the transaction, but no common pattern was detected for the reason.",
    suggestion:
      "Open the tx details in the explorer and inspect input data & the called contract. Verify parameters (amount, path, signature).",
  },
];

function matchPattern(text: string): ExplainedRevert | null {
  for (const p of PATTERNS) {
    if (p.match.test(text)) {
      return {
        title: p.title,
        explanation: p.explanation,
        suggestion: p.suggestion,
        rawReason: text,
        category: p.category,
      };
    }
  }
  return null;
}

function decodeRevertData(data: Hex | undefined): string | undefined {
  if (!data || data === "0x") return undefined;
  // Error(string) selector 0x08c379a0
  if (data.startsWith("0x08c379a0") && data.length >= 138) {
    try {
      const decoded = decodeErrorResult({
        abi: [
          {
            type: "error",
            name: "Error",
            inputs: [{ name: "message", type: "string" }],
          },
        ],
        data,
      });
      return String(decoded.args[0]);
    } catch {
      // fall through
    }
  }
  // Panic(uint256) 0x4e487b71
  if (data.startsWith("0x4e487b71")) {
    return "Panic: assertion failed or arithmetic error";
  }
  // try string payload
  try {
    if (isHex(data) && data.length > 2) {
      const asStr = hexToString(data);
      if (asStr && /[\x20-\x7E]/.test(asStr)) return asStr;
    }
  } catch {
    // ignore
  }
  return data;
}

/**
 * Explain a failed transaction by hash: fetch receipt + re-simulate call for revert data.
 */
export async function explainFailedTx(
  client: PublicClient,
  hash: `0x${string}`,
): Promise<ExplainedRevert> {
  const receipt = await client.getTransactionReceipt({ hash });
  if (receipt.status === "success") {
    return {
      title: "Transaction succeeded",
      explanation: "This tx hash has status success onchain — it is not a failed transaction.",
      suggestion:
        "Make sure you paste a hash from a transaction that actually failed/reverted.",
      category: "unknown",
    };
  }

  const tx = await client.getTransaction({ hash });
  let raw: string | undefined;

  try {
    await client.call({
      to: tx.to ?? undefined,
      data: tx.input,
      value: tx.value,
      account: tx.from,
      blockNumber: receipt.blockNumber,
    });
  } catch (err: unknown) {
    const e = err as {
      shortMessage?: string;
      message?: string;
      data?: Hex;
      cause?: { data?: Hex; reason?: string; shortMessage?: string };
    };
    raw =
      e.cause?.reason ||
      decodeRevertData(e.data || e.cause?.data) ||
      e.shortMessage ||
      e.cause?.shortMessage ||
      e.message;
  }

  if (!raw) {
    raw = "execution reverted";
  }

  const matched = matchPattern(raw);
  if (matched) return matched;

  return {
    title: "Transaction failed",
    explanation: `The contract reverted with: ${raw.slice(0, 280)}`,
    suggestion:
      "Compare with the contract docs. For technical messages, check allowance, balance, and tx parameters.",
    rawReason: raw,
    category: "custom",
  };
}
