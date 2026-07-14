# Monad Wallet Doctor

> Check your wallet health, revoke risky approvals, and prove onchain that your wallet is clean.

**Hackathon:** BuildAnything — Spark · **Network:** Monad Testnet / Mainnet · **Type:** Solo web app + smart contracts

**Repo:** [github.com/tomzsh/wallet-doctor](https://github.com/tomzsh/wallet-doctor) · **X:** [@0xTomzsh](https://x.com/0xTomzsh)

## Features

| Feature | Description |
|---|---|
| **Connect Wallet** | RainbowKit → MetaMask, WalletConnect, Rabby, OKX, Coinbase, and more. Auto switch/add Monad. |
| **Approval Scanner** | Approval / ApprovalForAll history via **Envio HyperSync** (or eth_getLogs fallback) + live allowance checks |
| **Risk labels** | High / Medium / Low from unlimited + known-spender heuristics |
| **Scan ranges** | 7d · 30d · 1y · All history (cancel anytime when switching) |
| **Revoke** | `approve(spender, 0)` / `setApprovalForAll(false)` from the user wallet only |
| **Onchain Log** | `WalletDoctorLog.logCleanup` — cleanup history + onchain score |
| **Live Health Score** | 0–100 from active approvals + cleanup bonus (dashboard gauge) |
| **Cleanup Badge NFT** | Soulbound ERC-721 when onchain score ≥ 80; mint score shown on dashboard |
| **Theme** | Light / dark · mobile-first · Monad brand colors |

**Security principle:** the frontend **never** custodies funds. Revokes go to the original token contract; Wallet Doctor contracts only record results.

## Structure

```
apps/web                 Next.js 14 (App Router) + wagmi / RainbowKit / viem
packages/contracts       Foundry: WalletDoctorLog + WalletDoctorBadge + test mocks
scripts/                 deploy-testnet.sh · seed-test-approvals.sh
```

## Quick start

### 1. Smart contracts

```bash
export PATH="$HOME/.foundry/bin:$PATH"
cd packages/contracts
forge install   # if lib/ is missing
forge build
forge test -vv
```

Deploy to Monad Testnet (auto-wires frontend env):

```bash
cp packages/contracts/.env.example packages/contracts/.env
# set PRIVATE_KEY=0x...  (wallet with testnet MON)
# Fund: https://faucet.monad.xyz/

pnpm deploy:testnet
```

Addresses are written to `apps/web/.env.local` and `packages/contracts/deployments.testnet.json`.

### 2. Frontend

```bash
cp apps/web/.env.example apps/web/.env.local
# fill WalletConnect project ID, contract addresses, optional ENVIO_API_TOKEN

pnpm install
pnpm dev
# → http://localhost:3000
```

### Important env (`apps/web/.env.local`)

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...

# Contracts (filled by pnpm deploy:testnet)
NEXT_PUBLIC_LOG_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_BADGE_ADDRESS_TESTNET=0x...

# Wallet / eth_call RPC (Alchemy recommended)
NEXT_PUBLIC_MONAD_TESTNET_RPC=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_MAINNET_RPC=https://rpc.monad.xyz

# Fast history scans — Envio HyperSync (server-side token only)
ENVIO_API_TOKEN=...
NEXT_PUBLIC_USE_HYPERSYNC=true
```

| Variable | Notes |
|---|---|
| `ENVIO_API_TOKEN` | [envio.dev/app/api-tokens](https://envio.dev/app/api-tokens) — **never** commit; not `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_USE_HYPERSYNC` | `true` → client uses `/api/hypersync/*` proxy |
| `NEXT_PUBLIC_MONAD_LOGS_RPC` | Optional override for eth_getLogs when HyperSync is off |
| `NEXT_PUBLIC_SCAN_CHUNK_SIZE` | Fallback eth_getLogs chunk (public RPC ≈ 100) |

WalletConnect Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com)

### Scan performance notes

- **With HyperSync:** full-history Approval scans typically finish in tens of seconds.
- **Without HyperSync:** public Monad RPC limits `eth_getLogs` to ~100 blocks/request — use shorter ranges (7d / 30d) or set a premium RPC.
- Alchemy Free on Monad currently caps `eth_getLogs` at ~10 blocks; keep Alchemy for wallet/`eth_call` and HyperSync (or public) for logs.

## Deployed contracts (Monad Testnet)

| Contract | Address |
|---|---|
| **WalletDoctorLog** | [`0x24f12073DC3865c816fb35d88486e3Ba88d0E167`](https://testnet.monadexplorer.com/address/0x24f12073DC3865c816fb35d88486e3Ba88d0E167) |
| **WalletDoctorBadge** | [`0x489C2396D1382FA81fBeD3399626e67A421968A7`](https://testnet.monadexplorer.com/address/0x489C2396D1382FA81fBeD3399626e67A421968A7) |

## Chain reference

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | testnet.monadexplorer.com | monadvision.com |

## Health score (v1)

```
score = 100
  - unlimited_unknown × 15
  - unlimited_known   × 7
  - other_active      × 2
score = max(score, 0)
score += min(cleanupCount × 5, 20)
score = min(score, 100)
```

- **Live score** — computed in the app from the current approval scan.
- **Onchain score** — last value written via `logCleanup` (drives badge mint).
- **NFT score at mint** — `BadgeMinted.scoreAtMint` shown on the dashboard badge card.

## Seed test approvals (demo revoke)

```bash
# packages/contracts/.env must have PRIVATE_KEY + funded testnet wallet
pnpm seed:approvals
# or: bash scripts/seed-test-approvals.sh
```

Deploys mock `wdUSD` / `wdETH` / `wdNFT` and creates mixed-risk approvals for the deployer. See `packages/contracts/seed-approvals.testnet.json`.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production web build |
| `pnpm contracts:test` | Foundry tests |
| `pnpm deploy:testnet` | Deploy contracts + wire `.env.local` |
| `pnpm seed:approvals` | Mock tokens + test approvals on testnet |

## Tech stack

Next.js 14 · TypeScript · Tailwind · RainbowKit v2 · wagmi v2 · viem · TanStack Query · Zustand · sonner · Envio HyperSync · Solidity 0.8.24 · Foundry · OpenZeppelin

## UI

- Clean, mobile-first interface with **Monad brand colors**
  ([Brand & Media Kit](https://www.monad.xyz/brand-and-media-kit))
- Primary: `#6E54FF` · Soft: `#DDD7FE` · Ink: `#0E091C`
- Typography: Inter + Roboto Mono
- Light / dark mode (persisted)

## License

MIT
