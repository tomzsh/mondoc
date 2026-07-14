---
name: mondoc
description: Project skill for MonDoc (Monad wallet diagnostics) — approval scanner, revoke, onchain cleanup log + score.
---

# MonDoc — project skill

Read **`../monskill/SKILL.md`** first, then this file for repo-specific context.

## Product

- **Scan** Approval / ApprovalForAll (HyperSync preferred, eth_getLogs fallback)
- **Revoke** via user wallet (`approve(0)` / `setApprovalForAll(false)`)
- **Log** cleanup on `WalletDoctorLog` (self-reported score; supports `batchLogCleanup`)
- **No custody** of tokens or keys
- **No badge NFT** in the product UI (removed — do not re-add unless the user asks)

## Architecture

| Layer | Path | Notes |
|-------|------|--------|
| Web app | `apps/web` | Next.js 14, wagmi v2, RainbowKit, viem |
| Chains | `apps/web/lib/wagmi.ts`, `lib/rpc.ts` | 10143 testnet, 143 mainnet |
| Scan | `lib/scanner/*` | HyperSync proxy + parallel getLogs |
| Score | `lib/score/calculateScore.ts` | Live UI score vs onchain log score |
| Gas | `lib/gas.ts` | Monad-safe limits (charge on **limit**) |
| Contracts | `packages/contracts` | Foundry: Log + mocks (+ legacy Badge source) |
| Deploy | `scripts/deploy-testnet.sh` | Writes `.env.local` + deployments JSON |

## Key files

```
apps/web/hooks/useApprovals.ts      # scan hook (range + abort)
apps/web/hooks/useRevoke.ts         # revoke + logCleanup / batchLogCleanup
apps/web/hooks/useHealthScore.ts    # live score from approvals + cleanups
apps/web/app/api/hypersync/*        # server Envio proxy
packages/contracts/src/WalletDoctorLog.sol
packages/contracts/script/SeedTestApprovals.s.sol
```

## Skill pairing for common PRs

| Change | Also open |
|--------|-----------|
| New revoke path / gas UI | `../gas/SKILL.md` |
| New spender labels / token lists | `../addresses/SKILL.md` |
| Wallet connect / providers | `../wallet-integration/SKILL.md` |
| HyperIndex instead of client logs | `../indexer/SKILL.md` |
| New RPC / explorer | `../tooling-and-infra/SKILL.md` |
| Deploy from agent wallet | `../wallet/SKILL.md` |

## Trust model

- `logCleanup` / `batchLogCleanup` are **self-attested** after client revoke — not a full cryptographic health proof.
- Always surface the attestation disclaimer in UI when discussing scores.

## Non-goals

- Do not reintroduce TX explainer / custody flows.
- Do not hardcode user API keys into the client bundle.
- Do not reintroduce badge mint UI unless explicitly requested.
- Do not replace RainbowKit with another wallet kit unless the user asks.

## Brand / UI

- Monad brand kit colors (primary `#6E54FF`), dark default, Inter + Roboto Mono.
- Phosphor icons; logo: FirstAidKit seal in `components/brand/AppLogo.tsx`.
- English UI copy.

## Verification checklist

- [ ] Addresses from env / deployments JSON, not invented
- [ ] Gas estimated with ≤10% buffer (`lib/gas.ts`)
- [ ] Secrets only in gitignored env files
- [ ] `pnpm exec tsc --noEmit` (web) and/or `forge test` (contracts)
