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
| **UI** | Research-lab monochrome · [Phosphor Icons](https://phosphoricons.com) |

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

## Deployed contracts (Monad Testnet · v2)

| Contract | Address |
|---|---|
| **Log** | [`0x33926537818aB3113cEE97311CC32Bee385C02b5`](https://testnet.monadexplorer.com/address/0x33926537818aB3113cEE97311CC32Bee385C02b5) |
| **Badge** | [`0xa1aC20EaBd9db2F22eFad97c704A919b83E98e54`](https://testnet.monadexplorer.com/address/0xa1aC20EaBd9db2F22eFad97c704A919b83E98e54) |

## Agents

See [`AGENTS.md`](./AGENTS.md). Start with local MONSKILLS (`monskill` → `mondoc` project skill).

## License

MIT
