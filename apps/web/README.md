# MonDoc — Web App

Next.js 14 (App Router) frontend for **MonDoc** on Monad.

## Stack

- RainbowKit + wagmi + viem  
- TanStack Query, Zustand, sonner  
- Envio HyperSync (server proxy under `/api/hypersync`)  
- Tailwind · Phosphor Icons · [Monad brand kit](https://www.monad.xyz/brand-and-media-kit)  

Typography: **Inter** · **Roboto Mono**  
Primary color: `#6E54FF`

## Develop

From the monorepo root:

```bash
cp apps/web/.env.example apps/web/.env.local
# WalletConnect ID, LOG address, ENVIO_API_TOKEN
pnpm install
pnpm dev
# http://localhost:3000
```

## Routes

| Path | Page |
|---|---|
| `/` | Dashboard — live score, stats, score chart |
| `/scan` | Approval scanner, range picker, revoke |
| `/history` | Onchain cleanup history |
| `/api/hypersync/*` | Server proxy for Envio (token stays server-side) |

## Env

See `.env.example`. After `pnpm deploy:testnet`, the log address is written into `.env.local`.

Never commit `.env.local` (API keys, HyperSync token).
