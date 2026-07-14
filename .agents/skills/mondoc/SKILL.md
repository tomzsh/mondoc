---
name: mondoc
description: Project skill for MonDoc (Monad wallet diagnostics) — approval scanner, revoke, onchain cleanup log, soulbound badge.
---

# MonDoc — project skill

Read **`../monskill/SKILL.md`** first, then this file for repo-specific context.

## Product

- **Scan** Approval / ApprovalForAll (HyperSync preferred, eth_getLogs fallback)
- **Revoke** via user wallet (`approve(0)` / `setApprovalForAll(false)`)
- **Log** cleanup on `WalletDoctorLog` (self-reported score)
- **Mint** soulbound `WalletDoctorBadge` when onchain score ≥ 80
- **No custody** of tokens or keys

## Architecture

| Layer | Path | Notes |
|-------|------|--------|
| Web app | `apps/web` | Next.js 14, wagmi v2, RainbowKit, viem |
| Chains | `apps/web/lib/wagmi.ts`, `lib/rpc.ts` | 10143 testnet, 143 mainnet |
| Scan | `lib/scanner/*` | HyperSync proxy + parallel getLogs |
| Score | `lib/score/calculateScore.ts` | Live UI score vs onchain log score |
| Gas | `lib/gas.ts` | Monad-safe limits (charge on **limit**) |
| Contracts | `packages/contracts` | Foundry OZ ERC-721 badge + log |
| Deploy | `scripts/deploy-testnet.sh` | Writes `.env.local` + deployments JSON |

## Key files

```
apps/web/hooks/useApprovals.ts      # scan hook (range + abort)
apps/web/hooks/useRevoke.ts         # revoke + logCleanup + mintBadge
apps/web/hooks/useBadgeNft.ts       # onchain + mint score for dashboard
apps/web/app/api/hypersync/*        # server Envio proxy
packages/contracts/src/WalletDoctorLog.sol
packages/contracts/src/WalletDoctorBadge.sol
packages/contracts/script/SeedTestApprovals.s.sol
```

## Skill pairing for common PRs

| Change | Also open |
|--------|-----------|
| New revoke path / gas UI | `../gas/SKILL.md` |
| New spender labels / token lists | `../addresses/SKILL.md` |
| Wallet connect / Para / providers | `../wallet-integration/SKILL.md` |
| HyperIndex instead of client logs | `../indexer/SKILL.md` |
| New RPC / explorer | `../tooling-and-infra/SKILL.md` |
| Deploy from agent wallet | `../wallet/SKILL.md` |

## Trust model (hackathon v2)

- `logCleanup` is **self-attested** after client revoke — not a full cryptographic health proof.
- Badge mint requires `currentScore >= 80`, only by the wallet itself; stores `scoreAtMint` + `tokenURI`.
- Always surface the attestation disclaimer in UI when discussing scores/badges.

## Non-goals

- Do not reintroduce TX explainer / custody flows.
- Do not hardcode user API keys into the client bundle.
- Do not replace RainbowKit with Para unless the user asks (see wallet-integration skill; requires `para login`).

## Brand / UI

- Research-lab monochrome (dark default), IBM Plex, sharp corners.
- Logo: clinical seal (cross + ECG) in `components/brand/AppLogo.tsx`.
- English UI copy.

## Verification checklist

- [ ] Addresses from env / deployments JSON, not invented
- [ ] Gas estimated with ≤10% buffer (`withGasBuffer` in `lib/gas.ts`)
- [ ] Secrets only in gitignored env files
- [ ] `pnpm exec tsc --noEmit` (web) and/or `forge test` (contracts)
