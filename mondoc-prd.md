# MonDoc — Product Requirements Document

| Field | Value |
|---|---|
| **Product** | MonDoc |
| **Hackathon** | BuildAnything — Spark |
| **Network** | Monad Testnet (`10143`) · Mainnet (`143`) |
| **Type** | Solo · web app + smart contracts |
| **Repo** | [github.com/tomzsh/mondoc](https://github.com/tomzsh/mondoc) |
| **One-liner** | Clinical wallet diagnostics on Monad — scan approvals, revoke risk, prove cleanups onchain. |

---

## 1. Product summary

**MonDoc** is a wallet “check-up” for the Monad ecosystem. It scans a connected wallet for active token approvals, classifies risk, lets the user revoke dangerous allowances in one click, then records cleanups onchain with a live health score and an optional soulbound badge.

Unlike a pure revoke UI, MonDoc produces a **verifiable onchain history** of cleanup actions (self-attested score after revoke) and a **soulbound NFT** when the onchain score reaches the threshold.

### What shipped (current product)

| Area | Status |
|---|---|
| Connect + Monad chain guard | Done |
| Approval / ApprovalForAll scan | Done (Envio HyperSync + RPC fallback) |
| Risk labels (high / medium / low) | Done |
| Scan depth ranges (7d / 30d / 1y / all) | Done |
| One-click revoke (user wallet → token) | Done |
| Onchain cleanup log + score | Done (v2 contracts) |
| Soulbound MonDoc badge (score ≥ 80) | Done |
| Dashboard: live score + badge NFT card | Done |
| Research-lab UI + Phosphor icons | Done |
| Failed TX explainer | **Out of scope** (removed) |
| Multichain beyond Monad | **Out of scope** |

---

## 2. Problem

Most active wallets accumulate dozens of token approvals from old swaps, mints, and staking flows. Many are **unlimited**. Users typically:

- Do not know which approvals are still active  
- Cannot tell which ones are high risk  
- Have no durable **proof** they cleaned up  
- Rely on generic revoke tools with no Monad-native UX or onchain attestation  

MonDoc focuses on **visibility → action → attestation** on Monad only.

---

## 3. Target users

- Active Monad testnet/mainnet wallet holders  
- Hackathon judges / demo viewers who need a fast scan → revoke → badge loop  
- Builders who want a reference app for approvals + self-attested health logs on Monad  

---

## 4. Core features

### 4.1 Connect wallet

- **RainbowKit v2** + **wagmi v2** + **viem**  
- MetaMask, WalletConnect, Rabby, OKX, Coinbase, and other EVM wallets  
- Auto switch / add **Monad Testnet** and **Monad Mainnet**  
- UI blocked unless the connected chain is Monad (`ChainGuard`)

### 4.2 Approval scanner

1. Resolve history via **Envio HyperSync** (preferred) through a server proxy that keeps `ENVIO_API_TOKEN` server-side.  
2. Fallback: parallel / adaptive `eth_getLogs` with resilient multi-RPC transport (no fragile batching).  
3. Events: `Approval` (ERC-20) and `ApprovalForAll` (NFT operators).  
4. Filter to **live** allowances via `eth_call` (`allowance` / `isApprovedForAll`).  
5. Smart skips: zero / `maxUint256` decoded from logs where safe.  
6. **Scan ranges:** Recent (7d), 30d, 1y, All history — cancellable when switching.

### 4.3 Risk classification

| Level | Heuristic |
|---|---|
| **High** | Unlimited (or NFT operator) to an **unknown** spender |
| **Medium** | Unlimited to a **known** spender, or large but capped ERC-20 allowance |
| **Low** | Smaller ERC-20 allowance and/or known spender |

Known spenders are curated from Monad ecosystem lists (DEX routers, etc.) — heuristic only, not a security guarantee.

### 4.4 Revoke

- User wallet calls the **token contract** directly:  
  - ERC-20: `approve(spender, 0)`  
  - ERC-721 style: `setApprovalForAll(operator, false)`  
- **No custody**: MonDoc contracts never hold or transfer user tokens.  
- After a successful revoke, the app offers **`logCleanup`** with a client-computed score, then optional **`mintBadge`**.  
- Gas: estimates with a **≤10% buffer** (Monad charges **gas_limit**, not gas used).

### 4.5 Live wallet health score (client)

```
score = 100
  - unlimited_unknown × 15
  - unlimited_known   × 7
  - other_active      × 2
score = max(score, 0)
score += min(cleanupCount × 5, 20)
score = min(score, 100)
```

Displayed on the dashboard and scan page as a gauge.

### 4.6 Onchain cleanup log (self-attested)

Contract: **`WalletDoctorLog`** (product name: MonDoc Log)

- `logCleanup(spender, token, newScore)` — only updates `msg.sender`  
- Score range `0…100`; zero addresses rejected  
- Paginated history (`MAX_PAGE_LIMIT = 50`)  
- Stores `currentScore` and `cleanupCount`  

**Trust model (explicit for hackathon):** scores are **self-attested** after the user revokes. They are not a cryptographic proof of full wallet health. The UI shows an **Attestation model** notice.

### 4.7 MonDoc Badge (soulbound NFT)

Contract: **`WalletDoctorBadge`** (ERC-721 name **MonDoc Cleanup Badge**, symbol **MDOC**)

- Mint when `currentScore(msg.sender) ≥ 80`  
- Mint **only for self**  
- Soulbound (transfers revert)  
- Onchain `tokenIdOf`, `scoreAtMint`, simple `tokenURI` (JSON metadata)  

### 4.8 Dashboard

- Live health score + approval risk counts  
- Badge NFT card (onchain score / score at mint / token id)  
- Score trajectory from cleanup history  
- CTA into Scan and History  

---

## 5. Tech stack

### 5.1 Frontend (`apps/web`)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Wallet | RainbowKit v2 + wagmi v2 + viem |
| Data | TanStack Query |
| UI state | Zustand |
| Styling | Tailwind · monochrome research-lab aesthetic |
| Icons | [Phosphor Icons](https://phosphoricons.com) (`@phosphor-icons/react`) |
| Toasts | sonner |

### 5.2 Smart contracts (`packages/contracts`)

| Layer | Choice |
|---|---|
| Language | Solidity `^0.8.24` |
| Framework | Foundry |
| Library | OpenZeppelin (`ERC721`, `Strings`, `Base64`) |
| Version | Contract `VERSION = 2` (hackathon upgrade) |

### 5.3 Data & infra

| Layer | Choice |
|---|---|
| Primary RPC | Configurable (`NEXT_PUBLIC_MONAD_*_RPC`, Alchemy recommended) + public fallback |
| History index | Envio HyperSync (`ENVIO_API_TOKEN` server-only via `/api/hypersync/*`) |
| Logs fallback | Official public RPC `eth_getLogs` with adaptive chunks |
| Hosting | Vercel-ready Next.js app |
| Package manager | pnpm monorepo |

### 5.4 Agent / skills tooling

- Local **MONSKILLS** under `.agents/skills/`  
- Project skill: `.agents/skills/mondoc/`  
- Entry: `AGENTS.md` · `pnpm skills:sync`  

---

## 6. Architecture

### 6.1 Data flow

```
Browser (MonDoc UI)
   │  connect / switch chain
   ▼
RainbowKit + wagmi
   │
   ├─ HyperSync proxy (Next API) ──► Envio HyperSync  (approval history)
   │
   ├─ Resilient RPC fallbacks ─────► Alchemy / public Monad RPC
   │     eth_call allowance · nonce · block number
   │
   └─ User-signed txs ─────────────► Token contracts (revoke)
                                     WalletDoctorLog (logCleanup)
                                     WalletDoctorBadge (mintBadge)
```

### 6.2 Repository layout

```
mondoc/
├── apps/web/
│   ├── app/
│   │   ├── page.tsx                 # Dashboard
│   │   ├── scan/page.tsx            # Approval scanner
│   │   ├── history/page.tsx         # Onchain cleanup history
│   │   └── api/hypersync/           # Server-side Envio proxy
│   ├── components/                  # Brand, layout, approval, score
│   ├── hooks/                       # useApprovals, useRevoke, useBadgeNft, …
│   └── lib/                         # scanner, rpc, gas, contracts, score
├── packages/contracts/
│   ├── src/WalletDoctorLog.sol
│   ├── src/WalletDoctorBadge.sol
│   ├── src/mocks/                   # Seed tokens for demos
│   └── script/Deploy.s.sol · SeedTestApprovals.s.sol
├── scripts/                         # deploy-testnet · seed · skills:sync
├── .agents/skills/                  # MONSKILLS + mondoc skill
├── AGENTS.md
└── mondoc-prd.md                    # This document
```

---

## 7. Networks

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| Native gas | MON | MON |
| Default RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorers | testnet.monadexplorer.com | monadvision.com |

### Deployed MonDoc contracts (testnet v2)

| Contract | Address |
|---|---|
| Log | `0x530f8c879064f45dfD9dB797a790DD5c54763090` |
| Badge | `0xCCF8B0cd5CAF30617205989aa414750b4662e219` |

Source of truth: `packages/contracts/deployments.testnet.json` and `apps/web/.env.local` (not committed).

---

## 8. Smart contract API (v2)

### 8.1 WalletDoctorLog

| Function | Notes |
|---|---|
| `logCleanup(spender, token, newScore)` | Self-attested; `msg.sender` only; rejects zero addresses; score ≤ 100 |
| `currentScore(wallet)` | Last attested score |
| `cleanupCount(wallet)` | Number of log entries |
| `historyLength(wallet)` / `getHistoryPage(wallet, offset, limit)` | Paginated history; `limit ≤ 50` |
| `VERSION` | `2` |

### 8.2 WalletDoctorBadge

| Function | Notes |
|---|---|
| `mintBadge()` | Mints to `msg.sender` if score ≥ 80 and not already minted |
| `hasBadge` / `tokenIdOf` / `scoreAtMint` | Onchain badge metadata |
| `tokenURI(tokenId)` | Data-URI JSON + embedded SVG image (name, scoreAtMint, soulbound, network) |
| Soulbound | Transfers revert |

---

## 9. Security & trust principles

1. **No custody** — revokes are always user → token contract.  
2. **Self-attested scores** — onchain score is written by the user after revoke; UI must disclose this.  
3. **Secrets stay server-side** — `ENVIO_API_TOKEN`, deployer `PRIVATE_KEY`, Alchemy keys never committed.  
4. **HyperSync proxy** — rate limited (in-memory) + input validation + timeouts.  
5. **Monad gas** — set tight gas limits (estimate + ≤10% buffer); users pay for **limit**.  
6. **No address hallucination** — deploy addresses from env / deployments JSON; ecosystem addresses via MONSKILLS `addresses/`.  

---

## 10. UX / brand

| Aspect | Spec |
|---|---|
| Name | **MonDoc** |
| Visual system | Dark-first research lab · monochrome · sharp edges · grid |
| Typography | IBM Plex Sans + IBM Plex Mono |
| Icons | Phosphor (`FirstAidKit`, `Sun`/`Moon`, social logos, `MedalMilitary`) |
| Tone | Clinical, precise, English UI |
| Demo helpers | `pnpm seed:approvals` mints mock tokens + mixed-risk approvals |

---

## 11. Success criteria (hackathon demo)

A judge can, in under ~2 minutes:

1. Connect a funded Monad Testnet wallet (or seeded demo wallet).  
2. Open **Scan → All history** and see active approvals with risk badges.  
3. **Revoke** a high-risk approval and confirm the allowance is gone.  
4. See **logCleanup** succeed and score update on History / Dashboard.  
5. If score ≥ 80, mint the **MonDoc Badge** and show soulbound ownership + score at mint.  

---

## 12. Non-goals (this version)

- Failed transaction / revert explainer  
- Multichain support beyond Monad  
- Backend custody or “auto-revoke without signature”  
- Full cryptographic proof that a wallet has zero residual risk  
- Para / embedded wallet migration (RainbowKit remains)  
- Production-grade rate limiting infrastructure (KV/Redis) — in-memory only for demo  

---

## 13. Future (post-hackathon)

| Priority | Idea |
|---|---|
| P1 | Shareable score / badge card with explorer links |
| P1 | Stronger rate limiting for HyperSync proxy |
| P2 | Envio HyperIndex for always-fresh history without client pagination |
| P2 | Gas cost preview before revoke (Monad limit-based) |
| P3 | Stronger attestation (e.g. prove allowance is zero onchain before log) |

---

## 14. Commands

```bash
pnpm install
pnpm dev                 # apps/web
pnpm build
pnpm contracts:test      # Foundry
pnpm deploy:testnet      # Deploy log + badge, wire .env.local
pnpm seed:approvals      # Mock tokens + test approvals
pnpm skills:sync         # Refresh local MONSKILLS
```

---

## 15. References

- Product README: [`README.md`](./README.md)  
- Agent guide: [`AGENTS.md`](./AGENTS.md)  
- Deployments: [`packages/contracts/deployments.testnet.json`](./packages/contracts/deployments.testnet.json)  
- MONSKILLS: [skills.devnads.com](https://skills.devnads.com) · local `.agents/skills/`  
- Phosphor Icons: [phosphoricons.com](https://phosphoricons.com)  
- Monad docs: [docs.monad.xyz](https://docs.monad.xyz)  
