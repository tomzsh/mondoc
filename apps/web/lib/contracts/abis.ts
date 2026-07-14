export const walletDoctorLogAbi = [
  {
    type: "function",
    name: "logCleanup",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "token", type: "address" },
      { name: "newScore", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "batchLogCleanup",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spenders", type: "address[]" },
      { name: "tokens", type: "address[]" },
      { name: "finalScore", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "currentScore",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "cleanupCount",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "historyLength",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "getHistoryPage",
    stateMutability: "view",
    inputs: [
      { name: "wallet", type: "address" },
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [
      {
        name: "page",
        type: "tuple[]",
        components: [
          { name: "spender", type: "address" },
          { name: "token", type: "address" },
          { name: "timestamp", type: "uint256" },
          { name: "scoreAfter", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "MAX_SCORE",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_PAGE_LIMIT",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "MAX_BATCH",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "VERSION",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "event",
    name: "CleanupLogged",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "token", type: "address", indexed: true },
      { name: "scoreAfter", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ScoreUpdated",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "newScore", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "BatchCleanupLogged",
    inputs: [
      { name: "wallet", type: "address", indexed: true },
      { name: "count", type: "uint256", indexed: false },
      { name: "scoreAfter", type: "uint256", indexed: false },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event",
    name: "Approval",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "spender", type: "address", indexed: true },
      { name: "value", type: "uint256", indexed: false },
    ],
  },
] as const;

export const erc721Abi = [
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "event",
    name: "ApprovalForAll",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "operator", type: "address", indexed: true },
      { name: "approved", type: "bool", indexed: false },
    ],
  },
] as const;
