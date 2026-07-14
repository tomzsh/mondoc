# MonDoc

> Clinical wallet diagnostics on Monad — scan approvals, revoke risk, prove cleanups onchain.

**Hackathon:** BuildAnything — Spark · **Network:** Monad Testnet / Mainnet

**Repo:** [github.com/tomzsh/mondoc](https://github.com/tomzsh/mondoc) · **X:** [@0xTomzsh](https://x.com/0xTomzsh)

## Features

| Feature | Description |
|---|---|
| **Connect Wallet** | RainbowKit → MetaMask, WalletConnect, Rabby, OKX, Coinbase, and more |
| **Approval Scanner** | Approval / ApprovalForAll via **Envio HyperSync** (or eth_getLogs fallback) |
| **Risk labels** | High / Medium / Low |
| **Scan ranges** | 7d · 30d · 1y · All history |
| **Revoke** | From the user wallet only (`approve(0)` / `setApprovalForAll(false)`) |
| **Onchain Log** | Self-attested `logCleanup` + score |
| **Live Health Score** | 0–100 from active approvals + cleanup bonus |
| **MonDoc Badge** | Soulbound ERC-721 when onchain score ≥ 80 |
| **UI** | [Monad brand kit](https://www.monad.xyz/brand-and-media-kit) · [Phosphor Icons](https://phosphoricons.com) |

**Security:** the frontend **never** custodies funds. Scores/badges are **self-attested** after you revoke.

## Structure

```
apps/web                 Next.js 14 + wagmi / RainbowKit / viem / Phosphor
packages/contracts       Foundry: WalletDoctorLog + WalletDoctorBadge (MonDoc brand)
scripts/                 deploy · seed · skills:sync
.agents/skills/          MONSKILLS + project skill
```

## Quick start

```bash
cp apps/web/.env.example apps/web/.env.local
# WalletConnect, contract addresses, ENVIO_API_TOKEN, optional Alchemy RPC

pnpm install
pnpm dev
# → http://localhost:3000
```

Deploy contracts: `pnpm deploy:testnet`  
Seed demo approvals: `pnpm seed:approvals`  
Sync Monad agent skills: `pnpm skills:sync`

## Deployed contracts (Monad Testnet · MonDoc badge + metadata)

| Contract | Address |
|---|---|
| **Log** | [`0x530f8c879064f45dfD9dB797a790DD5c54763090`](https://testnet.monadexplorer.com/address/0x530f8c879064f45dfD9dB797a790DD5c54763090) |
| **Badge** | [`0xCCF8B0cd5CAF30617205989aa414750b4662e219`](https://testnet.monadexplorer.com/address/0xCCF8B0cd5CAF30617205989aa414750b4662e219) |

ERC-721 **MonDoc Cleanup Badge** (`MDOC`) with onchain `tokenURI` (JSON + embedded SVG image).


## Agents

See [`AGENTS.md`](./AGENTS.md). Start with local MONSKILLS (`monskill` → `mondoc` project skill).

## Product requirements

See [`mondoc-prd.md`](./mondoc-prd.md) — English PRD aligned with the shipped MonDoc app.

## License

MIT
