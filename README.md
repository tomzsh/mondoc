# MonDoc

> **Clinical wallet diagnostics on Monad** — scan risky approvals, revoke them, prove cleanups onchain, mint a soulbound badge.

| | |
|---|---|
| **Hackathon** | [BuildAnything](https://buildanything.monad.xyz) — **Spark** |
| **Network** | Monad Testnet (`10143`) · Mainnet-ready (`143`) |
| **Stack** | Next.js 14 · wagmi / RainbowKit / viem · Foundry · Envio HyperSync |
| **Repo** | [github.com/tomzsh/mondoc](https://github.com/tomzsh/mondoc) |
| **Cover** | [`apps/web/public/brand/cover.jpg`](./apps/web/public/brand/cover.jpg) |
| **PRD** | [`mondoc-prd.md`](./mondoc-prd.md) |
| **X** | [@0xTomzsh](https://x.com/0xTomzsh) |

---

## Why MonDoc? (problem → solution)

Monad wallets accumulate **unlimited token approvals** from swaps, mints, and experiments. Users rarely know:

1. Which allowances are still **active**  
2. Which are **high risk** (unlimited → unknown spender)  
3. How to **prove** they cleaned up  

**MonDoc** is the Monad-native loop:

```text
Connect → Scan history → Risk labels → Revoke (multi) → Onchain log + score → Optional badge
```

| Layer | What happens |
|---|---|
| **Visibility** | HyperSync (or RPC) finds `Approval` / `ApprovalForAll`, then **live** `allowance` / `isApprovedForAll` checks |
| **Action** | User wallet calls the **token** (`approve(0)` / `setApprovalForAll(false)`) — **no custody** |
| **Attestation** | `WalletDoctorLog` records cleanups + score (`logCleanup` / `batchLogCleanup`) |
| **Proof** | Optional soulbound **MonDoc Badge** NFT when onchain score ≥ 80 (manual mint only) |

---

## Demo for judges (≈ 3 minutes)

1. Open the app → connect wallet on **Monad Testnet**.  
2. (Optional) Seed demo approvals with the deployer key: `pnpm seed:approvals`  
   - Creates **3 High · 2 Medium · 1 Low** on a mock `mdDEMO` token.  
3. **Scan** → pick range (**Recent** is fine after seed; **All history** for deep wallets).  
4. Filter by risk → **Select all** / multi-select → **Revoke N selected**.  
5. Confirm: list updates **instantly** (optimistic cache); **one** `batchLogCleanup` for the batch.  
6. Dashboard: live **health score** updates without waiting for a full rescan.  
7. When onchain score ≥ 80 → **Mint soulbound badge** (explicit button — never auto-mint after each revoke).

**Important honesty for judges:** scores and the badge are **self-attested** (client computes score after user-initiated revokes). MonDoc never holds funds. See [Trust model](#trust-model-honest).

---

## Features (shipped)

| Feature | Detail |
|---|---|
| **Wallet connect** | RainbowKit — MetaMask, WalletConnect, Rabby, OKX, Coinbase, … |
| **Chain guard** | UI only on Monad Testnet / Mainnet |
| **Approval scanner** | ERC-20 `Approval` + NFT `ApprovalForAll` |
| **Fast history** | **Envio HyperSync** via `/api/hypersync/*` (token **server-side only**) |
| **RPC fallback** | Adaptive `eth_getLogs` + resilient multi-RPC (no fragile batching) |
| **Live checks** | Always re-check allowance / operator on-chain (revokes cannot “ghost”) |
| **Risk labels** | High / Medium / Low (see [Risk model](#risk-model)) |
| **Scan ranges** | 7d · 30d · 1y · All history (cancellable) |
| **One-click revoke** | User → token contract only |
| **Multi-revoke** | Select many → sequential token txs + **one** `batchLogCleanup` |
| **Optimistic UX** | List + score update immediately; no full HyperSync wait after each revoke |
| **Health score** | 0–100 live from active approvals + cleanup bonus |
| **Cleanup log** | Onchain history + score trajectory chart |
| **Soulbound badge** | ERC-721 `MDOC`, onchain `tokenURI` (JSON + SVG), **manual mint only** |
| **Gas** | Tight estimate + ≤10% buffer (Monad bills **gas_limit**) |
| **UI** | [Monad brand kit](https://www.monad.xyz/brand-and-media-kit) · [Phosphor Icons](https://phosphoricons.com) · EN |

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  apps/web  (Next.js 14 App Router)                          │
│  · Dashboard / Scan / History                               │
│  · RainbowKit + wagmi + viem                                │
│  · Optimistic cache (queryCache + tombstones after revoke)  │
│  · /api/hypersync/*  ← ENVIO_API_TOKEN never to browser     │
└───────────────┬───────────────────────────┬─────────────────┘
                │                           │
        read logs / eth_call         write (user wallet)
                │                           │
                ▼                           ▼
     HyperSync or public RPC      Token.approve(0) / setApprovalForAll
                │                           │
                │                           ▼
                │              WalletDoctorLog (batchLogCleanup / logCleanup)
                │                           │
                │                           ▼
                │              WalletDoctorBadge.mintBadge()  [optional, explicit]
                │
                └── live allowance checks (Alchemy/public RPC)
```

```text
apps/web                 Next.js UI + scanner + API routes
packages/contracts       Foundry: Log v3 + Badge v3 + mocks + seed
scripts/                 deploy-testnet · seed-approvals · sync-monskills
.agents/skills/          Local MONSKILLS for agent-assisted builds
mondoc-prd.md            Full product requirements (English)
```

---

## Smart contracts (Monad Testnet · v3)

| Contract | Address | Role |
|---|---|---|
| **WalletDoctorLog** | [`0x433e9B7d88332207EFa8f98A463267bFd649F661`](https://testnet.monadexplorer.com/address/0x433e9B7d88332207EFa8f98A463267bFd649F661) | `logCleanup` · **`batchLogCleanup`** (≤25) · `currentScore` · history |
| **WalletDoctorBadge** | [`0x57Fc8003a078d040E03E86fEb204630FE923038F`](https://testnet.monadexplorer.com/address/0x57Fc8003a078d040E03E86fEb204630FE923038F) | Soulbound ERC-721 · `mintBadge` only if score ≥ 80 · onchain metadata |

Source of truth: [`packages/contracts/deployments.testnet.json`](./packages/contracts/deployments.testnet.json)

### Design choices juri should notice

| Choice | Why |
|---|---|
| **No custody** | Doctor contracts only log / mint badge; tokens stay with the user |
| **`batchLogCleanup`** | Multi-revoke = N token txs (unavoidable on EOA) + **1** cheap log tx |
| **No auto-mint badge** | Minting after every revoke spam-signed txs and wasted MON; mint is optional |
| **Self-attested score** | Honest for a hackathon: client computes score; chain stores attestation |
| **Soulbound badge** | Non-transferable proof of cleanup habit, not a yield NFT |

---

## Risk model

| Level | Heuristic |
|---|---|
| **High** | Unlimited ERC-20 (or NFT operator) to an **unknown** spender |
| **Medium** | Unlimited to a **known** Monad ecosystem spender, or large capped allowance |
| **Low** | Smaller ERC-20 allowance |

Known spenders are curated (DEX routers, etc.) — **heuristic only**, not a security guarantee.

---

## Health score (client)

```text
score = 100
score -= (unlimited + unknown) × 15
score -= (unlimited + known)   × 7
score -= (other active)        × 2
score  = max(score, 0)
score += min(cleanupCount × 5, 20)
score  = min(score, 100)
```

- **Live score** on the dashboard uses the current approval list + cleanup count (with optimistic updates after revoke).  
- **Onchain score** is whatever was last written via `logCleanup` / `batchLogCleanup`.  
- Badge mint reads **onchain** `currentScore` ≥ 80.

---

## Trust model (honest)

| Claim | Reality |
|---|---|
| “Safe wallet” | **No** — MonDoc does not prove absence of malware or all risks |
| “Score is oracle-true” | **No** — score is **self-attested** after user revokes |
| “Non-custodial” | **Yes** — revokes hit the token from the user wallet only |
| “Badge proves cleanups” | Badge proves the wallet **chose to mint** after logging score ≥ 80 |

UI surfaces this via the attestation note on the app.

---

## Quick start

**Requirements:** Node ≥ 18, pnpm 9, Foundry (for contracts/seed).

```bash
git clone https://github.com/tomzsh/mondoc.git
cd mondoc
pnpm install

cp apps/web/.env.example apps/web/.env.local
# Fill at least:
#   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
#   ENVIO_API_TOKEN              (https://envio.dev/app/api-tokens)
#   NEXT_PUBLIC_USE_HYPERSYNC=true
#   NEXT_PUBLIC_LOG_ADDRESS_TESTNET / BADGE_...  (see deployments above)
# Optional: Alchemy RPC for snappy eth_call
#   NEXT_PUBLIC_MONAD_TESTNET_RPC=https://monad-testnet.g.alchemy.com/v2/<key>

pnpm dev
# → http://localhost:3000
```

### Useful commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Run web app |
| `pnpm build` | Production build |
| `pnpm deploy:testnet` | Deploy Log + Badge, wire `.env.local` |
| `pnpm seed:approvals` | Seed **3 high · 2 med · 1 low** demo approvals (deployer wallet) |
| `pnpm contracts:test` | Foundry tests |
| `pnpm skills:sync` | Refresh local Monad agent skills |

### Seed demo (judges / local)

```bash
# packages/contracts/.env → PRIVATE_KEY=0x... (testnet MON for gas)
pnpm seed:approvals
```

Then connect the **same** address in the app → Scan → Rescan.

---

## UX notes (caching)

After revoke MonDoc does **not** block on a full HyperSync rescan:

1. **Optimistic remove** of the approval row  
2. **Tombstone keys** so a laggy rescan cannot resurrect it  
3. **Instant score** via pending cleanup bonus  
4. Full rescan only on **Rescan** / range change (or optional quiet background)

This keeps multi-revoke usable without draining time or gas on redundant scans.

---

## Tech highlights (Monad-specific)

- Official public RPC + optional Alchemy; **no JSON-RPC batching** on flaky public endpoints  
- HyperSync tip = `max(height, archive_height, RPC)` so new txs are not skipped  
- Gas helpers estimate with a **small buffer** (Monad charges **gas_limit × price**)  
- Server rate limits on HyperSync proxy routes  

---

## Out of scope

- Multichain beyond Monad  
- Custodial revoke / session keys that move funds  
- “Failed TX explainer” (removed)  
- Guaranteeing absolute wallet safety  

---

## License

MIT

---

**MonDoc** — *scan · revoke · attest · badge* on Monad.
