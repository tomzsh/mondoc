# Wallet Doctor — Web App

Next.js 14 (App Router) frontend for **Monad Wallet Doctor**.

## Stack

- RainbowKit + wagmi + viem
- TanStack Query, Zustand, sonner
- Envio HyperSync (server proxy under `/api/hypersync`)
- Tailwind · mobile-first · **Monad brand colors**
  ([Brand & Media Kit](https://www.monad.xyz/brand-and-media-kit))

### Brand palette

| Token | Hex |
|---|---|
| Primary purple | `#6E54FF` |
| Soft purple | `#DDD7FE` |
| Ink | `#0E091C` |
| Cyan | `#85E6FF` |
| Pink | `#FF8EE4` |
| Orange | `#FFAE45` |

Typography: **Inter** · **Roboto Mono**

## Develop

From the monorepo root:

```bash
cp apps/web/.env.example apps/web/.env.local
# WalletConnect ID, contract addresses, ENVIO_API_TOKEN (recommended)
pnpm install
pnpm dev
# → http://localhost:3000
```

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard — live score, badge NFT score, stats |
| `/scan` | Approval scanner, range picker, revoke |
| `/history` | Onchain cleanup history |
| `/api/hypersync/*` | Server proxy for Envio (token stays server-side) |

## Env

See `.env.example`. After `pnpm deploy:testnet`, contract addresses are written into `.env.local`.

Never commit `.env.local` (API keys, HyperSync token).
