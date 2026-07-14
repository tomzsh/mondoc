# Monad Wallet Doctor

> Cek kesehatan wallet-mu, cabut approval berbahaya, dan buktikan onchain kalau wallet-mu sudah bersih.

Hackathon **BuildAnything — Spark** · Monad Testnet / Mainnet · Solo web app + smart contract

## Fitur

| Fitur | Deskripsi |
|---|---|
| **Connect Wallet** | RainbowKit → MetaMask, WalletConnect, Rabby, OKX, Coinbase, dll. Auto switch/add Monad. |
| **Approval Scanner** | `eth_getLogs` Approval / ApprovalForAll + cek allowance aktif, klasifikasi 🔴🟡🟢 |
| **Revoke** | `approve(spender, 0)` / `setApprovalForAll(false)` langsung dari wallet user |
| **Onchain Log** | `WalletDoctorLog.logCleanup` — riwayat cleanup + skor |
| **Health Score** | 0–100 dari approval aktif + bonus cleanup |
| **Cleanup Badge** | ERC-721 soulbound saat skor ≥ 80 |
| **TX Explainer** | Decode revert reason → bahasa manusia + saran |

**Prinsip keamanan:** frontend **tidak pernah** custody dana. Revoke dipanggil user ke token contract asli; kontrak Wallet Doctor hanya mencatat hasil.

## Struktur

```
apps/web                 Next.js 14 (App Router) + wagmi/RainbowKit/viem
packages/contracts       Foundry: WalletDoctorLog + WalletDoctorBadge
```

## Quick start

### 1. Smart contracts

```bash
export PATH="$HOME/.foundry/bin:$PATH"
cd packages/contracts
forge install   # jika lib belum ada
forge build
forge test -vv
```

Deploy ke Monad Testnet (auto-wire frontend env):

```bash
# 1) Siapkan packages/contracts/.env (PRIVATE_KEY + RPC)
cp packages/contracts/.env.example packages/contracts/.env
# isi PRIVATE_KEY=0x...  (wallet dengan testnet MON)

# 2) Fund deployer dari faucet jika balance 0
#    https://faucet.monad.xyz/

# 3) Deploy + tulis alamat ke apps/web/.env.local
pnpm deploy:testnet
# atau: bash scripts/deploy-testnet.sh
```

Setelah sukses, `NEXT_PUBLIC_LOG_ADDRESS_TESTNET` dan `NEXT_PUBLIC_BADGE_ADDRESS_TESTNET`
terisi otomatis. Alamat juga disimpan di `packages/contracts/deployments.testnet.json`.

### 2. Frontend

```bash
# dari root monorepo
cp apps/web/.env.example apps/web/.env.local
# isi NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID + alamat kontrak

pnpm install
pnpm dev
# → http://localhost:3000
```

### Env penting (`apps/web/.env.local`)

```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_LOG_ADDRESS_TESTNET=0x...
NEXT_PUBLIC_BADGE_ADDRESS_TESTNET=0x...
# optional paid RPC untuk scan logs
NEXT_PUBLIC_MONAD_TESTNET_RPC=https://...
NEXT_PUBLIC_SCAN_LOOKBACK_BLOCKS=50000
NEXT_PUBLIC_SCAN_CHUNK_SIZE=2000
```

WalletConnect Project ID: [cloud.walletconnect.com](https://cloud.walletconnect.com)

## Chain reference

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | testnet.monadexplorer.com | monadvision.com |

## Health score (v1)

```
score = 100
  - unlimited_unknown × 15
  - unlimited_known   × 7
  - other_active      × 2
score = max(score, 0)
score += min(cleanupCount × 5, 20)
score = min(score, 100)
```

## Scripts

| Command | Keterangan |
|---|---|
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build web |
| `pnpm contracts:test` | Foundry tests |
| `pnpm contracts:deploy:testnet` | Deploy contracts |

## Tech stack

Next.js 14 · TypeScript · Tailwind · RainbowKit v2 · wagmi v2 · viem · TanStack Query · Zustand · sonner · Solidity 0.8.24 · Foundry · OpenZeppelin

## License

MIT
