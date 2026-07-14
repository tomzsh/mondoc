# MonDoc

Clinical wallet diagnostics for **Monad**. Scan token approvals, revoke risk, and log cleanups onchain.

| | |
|---|---|
| Network | Monad Testnet (`10143`) · Mainnet-ready (`143`) |
| Stack | Next.js 14 · wagmi · RainbowKit · viem · Foundry · Envio HyperSync |
| Repo | [github.com/tomzsh/mondoc](https://github.com/tomzsh/mondoc) |
| Contracts | [`deployments.testnet.json`](./packages/contracts/deployments.testnet.json) |
| Cover | [`apps/web/public/brand/cover.jpg`](./apps/web/public/brand/cover.jpg) |

---

## What it does

Unlimited approvals pile up on active wallets. MonDoc makes them visible and actionable—without ever holding funds.

```text
Connect → Scan history → Risk labels → Revoke (single or multi)
       → Onchain cleanup log + score
```

| Step | Behavior |
|------|----------|
| **Scan** | HyperSync (or RPC fallback) finds `Approval` / `ApprovalForAll`, then live `allowance` / `isApprovedForAll` checks |
| **Revoke** | The **user wallet** calls the **token** (`approve(0)` / `setApprovalForAll(false)`) |
| **Log** | `WalletDoctorLog` records cleanups and score (`logCleanup` / `batchLogCleanup`) |

---

## Demo (≈ 3 minutes)

1. Open the app and connect a wallet on **Monad Testnet**.
2. Optional: seed demo approvals (`pnpm seed:approvals`) — **3 high · 2 medium · 1 low** on a mock `mdDEMO` token.
3. Open **Scan**, run a rescan (use **All history** for older wallets).
4. Filter by risk, multi-select, **Revoke selected**.
5. Confirm the list and score update immediately; one `batchLogCleanup` for the batch.
6. Open **History** for the onchain cleanup log and score chart.

Scores are **self-attested** (see [Trust model](#trust-model)). MonDoc never custodizes assets.

---

## Features

- RainbowKit connect (injected, MetaMask, Rainbow, WalletConnect)
- Chain guard: Monad Testnet / Mainnet only
- ERC-20 + NFT operator approval scanner with High / Medium / Low labels
- Fast history via **Envio HyperSync** (`/api/hypersync/*`; token stays server-side)
- Resilient RPC fallback (no fragile JSON-RPC batching on public endpoints)
- Live onchain re-checks so revoked allowances do not reappear as “ghosts”
- Scan ranges: 7d · 30d · 1y · All history (cancellable)
- Multi-revoke + single `batchLogCleanup` (max 25 per batch)
- Optimistic UI after revoke (no full rescan wait)
- Health score 0–100 and cleanup history chart
- Gas helpers tuned for Monad (**gas_limit** billing)
- UI: [Monad brand kit](https://www.monad.xyz/brand-and-media-kit) · [Phosphor Icons](https://phosphoricons.com) · English

---

## Architecture

```text
apps/web                 Next.js UI, scanner, HyperSync proxy
packages/contracts       Foundry: cleanup log + mocks + seed
scripts/                 deploy-testnet, seed-approvals
```

```text
Browser ──reads──► HyperSync / RPC ──► live allowance checks
       ──writes──► token contracts (user wallet)
                ──► WalletDoctorLog (cleanup + score)
```

---

## Contracts (Monad Testnet)

| Contract | Address |
|----------|---------|
| **WalletDoctorLog** | [`0x433e9B7d88332207EFa8f98A463267bFd649F661`](https://testnet.monadexplorer.com/address/0x433e9B7d88332207EFa8f98A463267bFd649F661) |

- `logCleanup`, `batchLogCleanup` (≤ 25), `currentScore`, history
- Log contract **never** moves user tokens

---

## Risk model

| Level | Heuristic |
|-------|-----------|
| **High** | Unlimited ERC-20 or NFT operator approval to an **unknown** spender |
| **Medium** | Unlimited to a **known** ecosystem spender, or a large capped allowance |
| **Low** | Smaller ERC-20 allowance |

Known spenders are curated (e.g. DEX routers). Labels are heuristics, not a security guarantee.

### Health score (client)

```text
score = 100
score -= (unlimited + unknown) × 15
score -= (unlimited + known)   × 7
score -= (other active)        × 2
score  = max(score, 0)
score += min(cleanupCount × 5, 20)
score  = min(score, 100)
```

- **Live score** uses the current approval list and cleanup count (optimistic after revoke).
- **Onchain score** is the last value written by `logCleanup` / `batchLogCleanup`.

---

## Trust model

| Claim | Reality |
|-------|---------|
| Non-custodial | **Yes** — revokes go from the user wallet to the token contract |
| “Safe wallet” | **No** — MonDoc does not prove malware-free or complete safety |
| Score is oracle-true | **No** — score is **self-attested** after user-initiated revokes |

The app surfaces this in the attestation note on the home page.

---

## Quick start

**Requirements:** Node ≥ 18, [pnpm](https://pnpm.io) 9, [Foundry](https://getfoundry.sh) (for contracts / seed).

```bash
git clone https://github.com/tomzsh/mondoc.git
cd mondoc
pnpm install

cp apps/web/.env.example apps/web/.env.local
# Required:
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID   https://cloud.walletconnect.com
#   ENVIO_API_TOKEN                        https://envio.dev/app/api-tokens
#   NEXT_PUBLIC_USE_HYPERSYNC=true
#   NEXT_PUBLIC_LOG_ADDRESS_TESTNET         (default matches testnet deploy)
# Optional:
#   NEXT_PUBLIC_MONAD_TESTNET_RPC          Alchemy recommended for eth_call

pnpm dev
# http://localhost:3000
```

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Local web app |
| `pnpm build` | Production build |
| `pnpm deploy:testnet` | Deploy contracts; wire env |
| `pnpm seed:approvals` | Seed 3H / 2M / 1L demo approvals |
| `pnpm contracts:test` | Foundry tests |

Seed needs `PRIVATE_KEY` (testnet MON for gas) in `packages/contracts/.env`. Connect that same address in the app after seeding.

---

## Deploy (Vercel)

Monorepo: set **Root Directory** to `apps/web` in the Vercel project (or use the root `vercel.json` build command).

**Environment variables** (Project → Settings → Environment Variables):

| Name | Notes |
|------|--------|
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | [cloud.walletconnect.com](https://cloud.walletconnect.com) |
| `ENVIO_API_TOKEN` | Server-only; [envio.dev](https://envio.dev/app/api-tokens) |
| `NEXT_PUBLIC_USE_HYPERSYNC` | `true` |
| `NEXT_PUBLIC_LOG_ADDRESS_TESTNET` | Default: `0x433e9B7d88332207EFa8f98A463267bFd649F661` |
| `NEXT_PUBLIC_MONAD_TESTNET_RPC` | Optional; Alchemy recommended |
| `NEXT_PUBLIC_MONAD_MAINNET_RPC` | Optional; default public RPC |

```bash
# From monorepo root (after linking the project once)
npx vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard and deploy on push to `main`.

---

## Out of scope

- Chains other than Monad
- Custodial revoke or session keys that move funds
- Guaranteeing absolute wallet safety

---

## License

MIT
