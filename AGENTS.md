# AGENTS.md — MonDoc (Monad)

Instructions for any coding agent working in this repository.

## 1. Always start with local MONSKILLS

**Do not rely on stale Ethereum defaults.** For Monad work:

1. Read **[`.agents/skills/monskill/SKILL.md`](.agents/skills/monskill/SKILL.md)** first (router).
2. Open **only** the topic skills needed for the task (local files under `.agents/skills/`).
3. Prefer local skills over https://skills.devnads.com (site is fallback only).

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

Also read **[`.agents/skills/mondoc/SKILL.md`](.agents/skills/mondoc/SKILL.md)** for this app’s layout, contracts, and non-negotiables.

## 2. Repository map

```
apps/web                 Next.js 14 App Router · wagmi · RainbowKit · viem
  app/                   Routes: / · /scan · /history · /api/hypersync/*
  components/            UI (research-lab monochrome brand)
  hooks/                 useApprovals · useRevoke · useBadgeNft · …
  lib/scanner/           HyperSync + eth_getLogs approval scan
  lib/contracts/         ABIs + env-wired addresses
packages/contracts       Foundry · WalletDoctorLog · WalletDoctorBadge · mocks
scripts/                 deploy-testnet.sh · seed-test-approvals.sh · sync-monskills.sh
.agents/skills/          MONSKILLS (local) + mondoc skill
```

## 3. Networks (do not confuse)

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | testnet.monadexplorer.com / testnet.monadscan.com | monadvision.com / monadscan.com |

**Never** return a mainnet address when the user is on testnet (and vice versa). If unsure, ask.

### Deployed MonDoc (testnet · v2)

Source of truth: `packages/contracts/deployments.testnet.json` + `apps/web/.env.local` (not committed).

| Contract | Address |
|---|---|
| WalletDoctorLog | `0x530f8c879064f45dfD9dB797a790DD5c54763090` |
| WalletDoctorBadge | `0xCCF8B0cd5CAF30617205989aa414750b4662e219` |

Score/badge are **self-attested** (hackathon model). Badge has onchain `tokenURI` (JSON + SVG). Verify with:

```bash
cast code 0xCCF8B0cd5CAF30617205989aa414750b4662e219 --rpc-url https://testnet-rpc.monad.xyz
```

## 4. Hard rules

1. **No custody** — revokes call the token contract from the user’s wallet only. Doctor contracts only log / mint badge.
2. **No secret commits** — never commit `.env`, `.env.local`, `PRIVATE_KEY`, Alchemy keys, `ENVIO_API_TOKEN`.
3. **No address hallucination** — use `addresses/` skill + `cast code` / `eth_getCode`.
4. **Gas on Monad** — users pay **gas_limit × price**, not gas used. Always estimate tightly (≤10% buffer). See `gas/` and `apps/web/lib/gas.ts`.
5. **HyperSync token is server-only** — `ENVIO_API_TOKEN` in API routes; client uses `/api/hypersync/*`.
6. **UI language is English**; brand is monochrome research-lab (not Monad purple).

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
- `packages/contracts/.env.example`

Critical web vars: WalletConnect project ID, log/badge addresses, `ENVIO_API_TOKEN`, `NEXT_PUBLIC_USE_HYPERSYNC`.

## 7. Refreshing skills

```bash
pnpm skills:sync
# or: bash scripts/sync-monskills.sh
```

Keeps `.agents/skills/{monskill,scaffold,...}` aligned with [therealharpaljadeja/monskills](https://github.com/therealharpaljadeja/monskills). Does **not** overwrite `.agents/skills/mondoc/`.

## 8. After code changes

- Prefer small, scoped diffs.
- Run `pnpm exec tsc --noEmit` in `apps/web` and/or `forge test` when touching contracts.
- Do not push secrets. Ask before `git push` if the user did not request it.
