# AGENTS.md — MonDoc (Monad)

Instructions for any coding agent working in this repository.

## 1. Always start with local MONSKILLS

**Do not rely on stale Ethereum defaults.** For Monad work:

1. Read **[`.agents/skills/monskill/SKILL.md`](.agents/skills/monskill/SKILL.md)** first (router).
2. Open **only** the topic skills needed for the task (local files under `.agents/skills/`).
3. Prefer local skills over remote skill sites (fallback only).

### Project → skill routing

| Task in this repo | Open these skills |
|---|---|
| Frontend wallet / RainbowKit / connect | `wallet-integration/`, `tooling-and-infra/` |
| Deploy contracts, seed txs, agent keys | `wallet/`, `gas/`, `addresses/` |
| Gas limits, estimateGas, revoke UX cost | **`gas/` (required)** |
| Protocol / token / canonical addresses | **`addresses/` (never invent)** |
| HyperSync / HyperIndex / historical logs | `indexer/`, `tooling-and-infra/` |
| Monad vs Ethereum behavior | `concepts/` |
| Greenfield architecture | `scaffold/` |
| “Does X support Monad?” | `tooling-and-infra/` |

### Project-specific skill

Also read **[`.agents/skills/mondoc/SKILL.md`](.agents/skills/mondoc/SKILL.md)** (or `wallet-doctor/`) if present for this app’s layout, contracts, and non-negotiables.

## 2. Repository map

```
apps/web                 Next.js 14 App Router · wagmi · RainbowKit · viem
  app/                   Routes: / · /scan · /history · /api/hypersync/*
  components/            UI (Monad brand kit · Phosphor icons)
  hooks/                 useApprovals · useRevoke · useHealthScore · …
  lib/scanner/           HyperSync + eth_getLogs approval scan
  lib/contracts/         Log ABI + env-wired addresses
packages/contracts       Foundry · WalletDoctorLog · mocks · seed
scripts/                 deploy-testnet.sh · seed-test-approvals.sh · sync-monskills.sh
.agents/skills/          MONSKILLS (local)
```

**Product surface (current):** scan → revoke → onchain cleanup log + score.  
**Not in the app:** soulbound badge NFT mint UI (removed; do not re-add unless requested).

## 3. Networks (do not confuse)

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | testnet.monadexplorer.com | monadvision.com |

**Never** return a mainnet address when the user is on testnet (and vice versa). If unsure, ask.

### Deployed MonDoc (testnet)

Source of truth: `packages/contracts/deployments.testnet.json` + `apps/web/.env.local` (not committed).

| Contract | Address |
|---|---|
| WalletDoctorLog (v3 · `batchLogCleanup`) | `0x433e9B7d88332207EFa8f98A463267bFd649F661` |

Scores written via the log are **self-attested** (client computes; chain stores). Verify deployment with:

```bash
cast code 0x433e9B7d88332207EFa8f98A463267bFd649F661 --rpc-url https://testnet-rpc.monad.xyz
```

## 4. Hard rules

1. **No custody** — revokes call the token contract from the user’s wallet only. Doctor contracts only log cleanup / score.
2. **No secret commits** — never commit `.env`, `.env.local`, `PRIVATE_KEY`, Alchemy keys, `ENVIO_API_TOKEN`.
3. **No address hallucination** — use `addresses/` skill + `cast code` / `eth_getCode`.
4. **Gas on Monad** — users pay **gas_limit × price**, not gas used. Estimate tightly (≤10% buffer). See `gas/` and `apps/web/lib/gas.ts`.
5. **HyperSync token is server-only** — `ENVIO_API_TOKEN` in API routes; client uses `/api/hypersync/*`.
6. **UI language is English**; visual brand follows [Monad brand kit](https://www.monad.xyz/brand-and-media-kit) (primary `#6E54FF`).

## 5. Common commands

```bash
pnpm install
pnpm dev                          # apps/web
pnpm build
pnpm contracts:test               # forge test
pnpm deploy:testnet               # needs packages/contracts/.env
pnpm seed:approvals               # mock tokens + test approvals
pnpm skills:sync                  # refresh local MONSKILLS from GitHub
```

## 6. Env (examples only — never commit real values)

- `apps/web/.env.example`
- `packages/contracts/.env.example` (if present)

Critical web vars: WalletConnect project ID, `NEXT_PUBLIC_LOG_ADDRESS_*`, `ENVIO_API_TOKEN`, `NEXT_PUBLIC_USE_HYPERSYNC`.

## 7. Refreshing skills

```bash
pnpm skills:sync
# or: bash scripts/sync-monskills.sh
```

## 8. After code changes

- Prefer small, scoped diffs.
- Run `pnpm exec tsc --noEmit` in `apps/web` and/or `forge test` when touching contracts.
- Do not push secrets.
