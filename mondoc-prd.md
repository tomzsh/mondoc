# MonDoc — Product Requirements Document

| Field | Value |
|---|---|
| **Product** | MonDoc |
| **Network** | Monad Testnet (`10143`) · Mainnet (`143`) |
| **Type** | Web app + smart contracts |
| **Repo** | [github.com/tomzsh/mondoc](https://github.com/tomzsh/mondoc) |
| **One-liner** | Clinical wallet diagnostics on Monad — scan approvals, revoke risk, log cleanups onchain. |

---

## 1. Product summary

**MonDoc** is a wallet check-up for the Monad ecosystem. It scans a connected wallet for active token approvals, classifies risk, lets the user revoke dangerous allowances, then records cleanups onchain with a live health score.

Unlike a pure revoke UI, MonDoc produces a **verifiable onchain history** of cleanup actions (self-attested score after revoke).

### What shipped (current product)

| Area | Status |
|---|---|
| Connect + Monad chain guard | Done |
| Approval / ApprovalForAll scan | Done (Envio HyperSync + RPC fallback) |
| Risk labels (high / medium / low) | Done |
| Scan depth ranges (7d / 30d / 1y / all) | Done |
| One-click + multi-revoke (user wallet → token) | Done |
| Onchain cleanup log + score (`batchLogCleanup`) | Done |
| Dashboard: live score + history chart | Done |
| Optimistic list/score after revoke | Done |
| Research-lab UI + Phosphor icons | Done |
| Soulbound badge NFT | **Removed from product** (not in the web app) |
| Failed TX explainer | Out of scope |
| Multichain beyond Monad | Out of scope |

---

## 2. Problem

Active wallets accumulate token approvals from swaps, mints, and experiments. Many are unlimited. Users often:

- Do not know which approvals are still active  
- Cannot tell which ones are high risk  
- Have no durable **proof** they cleaned up  
- Rely on generic revoke tools with no Monad-native UX or onchain attestation  

MonDoc focuses on **visibility → action → attestation** on Monad only.

---

## 3. Target users

- Active Monad testnet/mainnet wallet holders  
- Demo viewers who need a fast scan → revoke → log loop  
- Builders who want a reference app for approvals + self-attested health logs on Monad  

---

## 4. Core features

### 4.1 Connect wallet

- RainbowKit + wagmi + viem  
- Injected, MetaMask, Rainbow, WalletConnect  
- Monad Testnet / Mainnet only (`ChainGuard`)

### 4.2 Approval scanner

1. Resolve history via **Envio HyperSync** through a server proxy (`ENVIO_API_TOKEN` stays server-side).  
2. Fallback: adaptive `eth_getLogs` with multi-RPC transport (no fragile batching).  
3. Events: `Approval` (ERC-20) and `ApprovalForAll` (NFT operators).  
4. Filter to **live** allowances via `eth_call`.  
5. Scan ranges: 7d, 30d, 1y, All history — cancellable.

### 4.3 Risk classification

| Level | Heuristic |
|---|---|
| **High** | Unlimited (or NFT operator) to an **unknown** spender |
| **Medium** | Unlimited to a **known** spender, or large capped ERC-20 allowance |
| **Low** | Smaller ERC-20 allowance |

Known spenders are curated (heuristic only, not a security guarantee).

### 4.4 Revoke

- User wallet calls the **token contract** directly (`approve(0)` / `setApprovalForAll(false)`).  
- **No custody.**  
- After success: optimistic UI update + `logCleanup` or `batchLogCleanup` with client-computed score.  
- Gas: estimate with a small buffer (Monad charges **gas_limit**).

### 4.5 Health score (client)

```text
score = 100
score -= (unlimited + unknown) × 15
score -= (unlimited + known)   × 7
score -= (other active)        × 2
score  = max(score, 0)
score += min(cleanupCount × 5, 20)
score  = min(score, 100)
```

- Live score uses the current approval list + cleanup count.  
- Onchain score is the last value written via the log contract.

### 4.6 Cleanup log

- Contract: **WalletDoctorLog**  
- `logCleanup` / `batchLogCleanup` (max 25)  
- History pages + score trajectory chart in the UI  

---

## 5. Trust model

| Claim | Reality |
|---|---|
| Non-custodial | Yes |
| Absolute wallet safety | No |
| Score is oracle-true | No — **self-attested** after user revokes |

---

## 6. Architecture

```text
apps/web                 Next.js UI, scanner, HyperSync proxy
packages/contracts       Foundry: WalletDoctorLog + mocks + seed
scripts/                 deploy + seed helpers
```

```text
Browser ──reads──► HyperSync / RPC ──► live allowance checks
       ──writes──► token contracts (user wallet)
                ──► WalletDoctorLog (cleanup + score)
```

---

## 7. Testnet deployment

| Contract | Address |
|---|---|
| WalletDoctorLog | `0x433e9B7d88332207EFa8f98A463267bFd649F661` |

Source of truth: `packages/contracts/deployments.testnet.json`.

---

## 8. Demo path

1. Connect on Monad Testnet.  
2. Optional: `pnpm seed:approvals`.  
3. Scan → filter risk → multi-revoke.  
4. Confirm list/score update; open History for onchain log.

---

## 9. Out of scope

- Chains other than Monad  
- Custodial revoke / fund-moving session keys  
- Guaranteeing absolute wallet safety  
- Badge NFT minting in the product UI  

---

## 10. Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm deploy:testnet
pnpm seed:approvals
pnpm contracts:test
```
