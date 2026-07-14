# MonDoc — Product Requirements

**Hackathon:** BuildAnything — Spark
**Kategori:** Monad Testnet / Mainnet
**Tipe:** Solo project, web app + smart contract

---

## 1. Ringkasan Produk

Monad MonDoc adalah "check-up" untuk kesehatan wallet onchain. Aplikasi memindai token approval yang berisiko, membantu user mencabutnya dalam satu klik, menjelaskan transaksi gagal dengan bahasa manusia, lalu mencatat semua aktivitas "pembersihan" ke smart contract sehingga wallet punya riwayat kesehatan yang bisa dibuktikan onchain — plus skor keamanan dan badge sebagai bukti hasil.

**One-liner:** "Cek kesehatan wallet-mu, cabut approval berbahaya, dan buktikan onchain kalau wallet-mu sudah bersih."

## 2. Problem Statement

Kebanyakan user crypto punya puluhan token approval aktif dari transaksi lama (swap, mint NFT, staking) yang mereka lupakan. Sebagian approval ini "unlimited" — kontrak lain punya akses tak terbatas ke token mereka. Ini risiko keamanan nyata (celah untuk exploit/drain wallet), tapi:
- User tidak tahu approval apa saja yang masih aktif.
- User tidak tahu mana yang berisiko.
- Tidak ada bukti/histori kalau mereka sudah "bersih-bersih".
- Saat transaksi gagal, pesan error teknis (revert reason) susah dipahami orang awam.

## 3. Target User

Pemegang wallet aktif di ekosistem Monad yang sudah pernah swap, mint, atau approve token ke berbagai dApp — dari pemula yang bingung soal approval, sampai power user yang ingin rutin audit wallet-nya sendiri.

## 4. Fitur Inti

### 4.1 Connect Wallet
Connect via RainbowKit (mendukung MetaMask, WalletConnect, Rabby, OKX Wallet, Coinbase Wallet, dll) ke Monad testnet/mainnet, dengan auto-prompt "switch/add network" kalau wallet user belum punya konfigurasi Monad.

### 4.2 Token Approval Scanner
- Ambil semua event `Approval` / `ApprovalForAll` milik wallet user dari chain (via `eth_getLogs` atau indexer).
- Untuk tiap approval, cek allowance saat ini via `eth_call` — kalau `0`, sudah tidak aktif, disembunyikan.
- Klasifikasi risiko tiap approval:
  - 🔴 **Tinggi**: allowance unlimited (`uint256.max`) ke kontrak yang tidak dikenal/tidak terverifikasi.
  - 🟡 **Sedang**: unlimited tapi ke kontrak populer/terverifikasi, atau allowance besar tapi terbatas.
  - 🟢 **Rendah**: allowance kecil/wajar, spender dikenal baik.

### 4.3 Revoke Approval
- Tombol "Revoke" memanggil `approve(spender, 0)` (ERC-20) atau `setApprovalForAll(operator, false)` (ERC-721/1155) langsung dari wallet user.
- Bisa revoke satu per satu atau batch (multicall) untuk beberapa approval sekaligus.
- Setelah tx sukses, otomatis trigger pencatatan cleanup ke smart contract (lihat bagian 8).

### 4.4 Failed Transaction Explainer
- User paste tx hash yang gagal (atau otomatis diambil dari histori wallet).
- App decode revert reason dari receipt/trace, lalu terjemahkan ke bahasa sederhana + saran perbaikan. Contoh pola yang dikenali:
  - Allowance kurang → "Kamu belum approve token dalam jumlah cukup untuk transaksi ini."
  - Saldo kurang → "Saldo token tidak cukup untuk menyelesaikan transaksi."
  - Slippage/deadline exceeded pada swap.
  - Gas limit terlalu rendah.

### 4.5 Wallet Health Score
Skor 0–100, dihitung dari kondisi approval wallet saat ini + histori cleanup (detail di bagian 9). Ditampilkan sebagai gauge/badge visual di dashboard.

### 4.6 Onchain Wallet Health Log
Smart contract `WalletDoctorLog` mencatat setiap aksi cleanup (approval mana yang direvoke, kapan, skor baru setelahnya) sebagai riwayat permanen dan bisa diverifikasi siapa pun — ini yang membedakan dari sekadar tool revoke biasa.

### 4.7 Cleanup Badge (NFT)
Saat skor melewati threshold (misal ≥ 80) atau semua approval berisiko-tinggi sudah nol, kontrak mint badge ERC-721 sederhana ke wallet user sebagai bukti onchain "wallet ini pernah dibersihkan".

---

## 5. Tech Stack

### 5.1 Frontend
| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 14 (App Router)** + TypeScript | SSR/RSC untuk landing page cepat, API routes untuk proxy indexer |
| Wallet connection | **RainbowKit v2** | UX connect-wallet siap pakai, mendukung banyak wallet EVM, chain-switch prompt otomatis |
| Web3 client | **wagmi v2** (hooks) + **viem** | Type-safe, ringan, native support custom chain (Monad belum ada di default chain list-nya) |
| Data fetching / cache | **TanStack Query** (dipakai internal oleh wagmi) | Cache hasil `eth_call`/`eth_getLogs`, auto-refetch setelah tx sukses |
| Styling | **TailwindCSS** + **shadcn/ui** | Komponen cepat dibangun, mudah dikustom biar tidak terlihat template generik |
| State ringan (UI) | **Zustand** | Untuk state non-chain seperti filter risiko, modal, tab aktif |
| Charts/gauge | **Recharts** atau custom SVG | Untuk gauge skor kesehatan |
| Notifikasi tx | **react-hot-toast** / sonner | Feedback pending/success/error tiap transaksi |

### 5.2 Smart Contract
| Layer | Pilihan | Alasan |
|---|---|---|
| Bahasa | **Solidity ^0.8.24** | Kompatibel EVM, sesuai versi terbaru yang didukung tooling |
| Framework | **Foundry** (forge + cast + anvil) | Testing cepat, fuzzing bawaan, deploy script langsung ke Monad |
| Library | **OpenZeppelin Contracts** (`ERC721`, `Ownable`, `ReentrancyGuard`) | Standar teraudit, kurangi risiko bug custom |
| Verifikasi kontrak | **Foundry `forge verify-contract`** ke block explorer Monad | Supaya kontrak bisa diverifikasi publik saat demo |

### 5.3 Data & Infra
| Layer | Pilihan | Alasan |
|---|---|---|
| Node/RPC | RPC publik Monad (lihat bagian 7) | Untuk `eth_getLogs`, `eth_call`, `eth_sendTransaction` |
| Indexer (opsional, kalau waktu cukup) | **Envio HyperIndex** atau subgraph-like indexer di ekosistem Monad | Mempercepat query event `Approval` historis dibanding scan `eth_getLogs` manual per block-range |
| Deployment frontend | **Vercel** | Deploy Next.js cepat, cocok untuk demo hackathon |
| Package manager | **pnpm** | Instalasi lebih cepat, monorepo-friendly kalau contract & frontend dipisah folder |

### 5.4 Monorepo Tooling
- **Turborepo** (opsional) untuk menjalankan `apps/web` (Next.js) dan `packages/contracts` (Foundry) dalam satu repo dengan caching build.

---

## 6. Arsitektur Sistem & Struktur Proyek

### 6.1 Diagram Alur Data

```
┌─────────────┐      connect wallet       ┌──────────────────┐
│   Browser   │ ─────────────────────────▶│  RainbowKit +     │
│  (User)     │◀───────────────────────── │  wagmi Provider   │
└─────────────┘      account/chain state  └────────┬──────────┘
                                                     │
                                    eth_getLogs / eth_call (viem)
                                                     │
                                                     ▼
                                          ┌────────────────────┐
                                          │  Monad RPC Node     │
                                          │  (testnet/mainnet)  │
                                          └─────────┬───────────┘
                                                     │
                              approve(0) / setApprovalForAll(false)
                              logCleanup() / mintBadge()
                                                     │
                                                     ▼
                                     ┌───────────────────────────┐
                                     │  WalletDoctorLog.sol       │
                                     │  WalletDoctorBadge.sol     │
                                     └───────────────────────────┘
```

Poin penting: frontend **tidak pernah** menjadi perantara dana. Semua tx `approve`/`setApprovalForAll` dipanggil langsung dari wallet user ke kontrak token asli. Kontrak MonDoc hanya menerima **laporan hasil** (`logCleanup`), tidak pernah menyentuh token/allowance secara langsung.

### 6.2 Struktur Folder (Monorepo)

```
monad-mondoc/
├── apps/
│   └── web/                          # Next.js 14 App Router
│       ├── app/
│       │   ├── layout.tsx            # Root layout + providers
│       │   ├── page.tsx              # Landing / dashboard
│       │   ├── scan/page.tsx         # Halaman scan approval
│       │   ├── history/page.tsx      # Riwayat cleanup onchain
│       │   └── tx-explainer/page.tsx # Failed tx explainer
│       ├── components/
│       │   ├── wallet/
│       │   │   ├── ConnectButton.tsx
│       │   │   └── ChainGuard.tsx    # Blokir UI kalau chain salah
│       │   ├── approval/
│       │   │   ├── ApprovalTable.tsx
│       │   │   ├── ApprovalRow.tsx
│       │   │   └── RiskBadge.tsx
│       │   ├── score/
│       │   │   ├── HealthGauge.tsx
│       │   │   └── ScoreHistoryChart.tsx
│       │   └── tx/
│       │       └── RevertExplainer.tsx
│       ├── lib/
│       │   ├── wagmi.ts              # Konfigurasi chain + RainbowKit
│       │   ├── contracts/
│       │   │   ├── walletDoctorLog.ts    # ABI + address per chain
│       │   │   └── walletDoctorBadge.ts
│       │   ├── scanner/
│       │   │   ├── getApprovalEvents.ts  # eth_getLogs wrapper
│       │   │   ├── getCurrentAllowance.ts
│       │   │   └── classifyRisk.ts
│       │   ├── score/
│       │   │   └── calculateScore.ts
│       │   └── revert/
│       │       └── decodeRevertReason.ts
│       ├── hooks/
│       │   ├── useApprovals.ts       # TanStack Query + wagmi
│       │   ├── useRevoke.ts
│       │   ├── useHealthScore.ts
│       │   └── useCleanupHistory.ts
│       └── public/
├── packages/
│   └── contracts/                    # Foundry project
│       ├── src/
│       │   ├── WalletDoctorLog.sol
│       │   └── WalletDoctorBadge.sol
│       ├── script/
│       │   └── Deploy.s.sol
│       ├── test/
│       │   ├── WalletDoctorLog.t.sol
│       │   └── WalletDoctorBadge.t.sol
│       └── foundry.toml
└── turbo.json
```

### 6.3 Pemisahan Tanggung Jawab
- **`lib/scanner`** — murni baca data chain (read-only), tidak pernah mengirim transaksi.
- **`hooks/useRevoke`** — satu-satunya tempat yang memanggil tx tulis (`approve`, `setApprovalForAll`, `logCleanup`).
- **`lib/score`** — logika skor dipisah dari UI supaya bisa di-unit-test tanpa render komponen.
- **`packages/contracts`** — independen dari frontend, punya test suite Foundry sendiri sebelum di-deploy.

---

## 7. Konfigurasi Chain

Monad belum tersedia sebagai default chain di `viem`/`wagmi`, jadi didefinisikan manual dengan `defineChain`.

```ts
// apps/web/lib/wagmi.ts
import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: {
      name: "Monad Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});

export const monadMainnet = defineChain({
  id: 143,
  name: "Monad Mainnet",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.monad.xyz"] },
  },
  blockExplorers: {
    default: { name: "MonadVision", url: "https://monadvision.com" },
  },
  testnet: false,
});

export const wagmiConfig = getDefaultConfig({
  appName: "Monad MonDoc",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [monadTestnet, monadMainnet],
  ssr: true,
});
```

```tsx
// apps/web/app/layout.tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, monadTestnet } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider initialChain={monadTestnet}>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

### 7.1 Referensi Nilai Chain

| | Testnet | Mainnet |
|---|---|---|
| Chain ID | `10143` | `143` |
| RPC (default publik) | `https://testnet-rpc.monad.xyz` | `https://rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` | `https://monadvision.com` / `https://monadscan.com` |
| Native currency | MON | MON |

> Catatan: RPC publik mainnet dan testnet punya rate limit. Untuk kebutuhan scan `eth_getLogs` dalam jumlah besar saat demo, siapkan RPC provider berbayar (Alchemy/QuickNode/Ankr sudah punya endpoint Monad) sebagai fallback, dan cek nilai chain ID/RPC terbaru di dokumentasi resmi Monad sebelum deploy karena endpoint dan rate limit bisa berubah.

---

## 8. Desain Smart Contract

Dua kontrak ringan, cukup untuk MVP dan mudah didemokan. Prinsip desain: **kontrak MonDoc tidak pernah custody dana/token user** — revoke tetap dipanggil user langsung ke kontrak token asli, kontrak MonDoc hanya mencatat hasil.

### 8.1 `WalletDoctorLog.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WalletDoctorLog
/// @notice Mencatat riwayat cleanup approval sebuah wallet secara onchain.
///         Kontrak ini tidak pernah menerima/mentransfer token — read & log only.
contract WalletDoctorLog {
    struct CleanupEvent {
        address spender;
        address token;
        uint256 timestamp;
        uint256 scoreAfter;
    }

    /// @dev Batas atas skor untuk mencegah input di luar rentang wajar.
    uint256 public constant MAX_SCORE = 100;

    mapping(address => CleanupEvent[]) private _history;
    mapping(address => uint256) public currentScore;

    error ScoreOutOfRange(uint256 given, uint256 max);

    event CleanupLogged(
        address indexed wallet,
        address indexed spender,
        address indexed token,
        uint256 scoreAfter,
        uint256 timestamp
    );
    event ScoreUpdated(address indexed wallet, uint256 newScore);

    /// @notice Dipanggil frontend setelah tx revoke sukses, untuk mencatat hasilnya.
    /// @param spender  Alamat kontrak yang allowance-nya baru saja dicabut.
    /// @param token    Alamat token (ERC-20/721/1155) terkait.
    /// @param newScore Skor kesehatan wallet setelah revoke, dihitung di frontend (0–100).
    function logCleanup(address spender, address token, uint256 newScore) external {
        if (newScore > MAX_SCORE) revert ScoreOutOfRange(newScore, MAX_SCORE);

        _history[msg.sender].push(
            CleanupEvent({
                spender: spender,
                token: token,
                timestamp: block.timestamp,
                scoreAfter: newScore
            })
        );
        currentScore[msg.sender] = newScore;

        emit CleanupLogged(msg.sender, spender, token, newScore, block.timestamp);
        emit ScoreUpdated(msg.sender, newScore);
    }

    /// @notice Jumlah cleanup event yang tercatat untuk sebuah wallet.
    function historyLength(address wallet) external view returns (uint256) {
        return _history[wallet].length;
    }

    /// @notice Ambil sebagian riwayat dengan pagination, hindari gas/limit issue
    ///         kalau riwayat sudah panjang.
    function getHistoryPage(
        address wallet,
        uint256 offset,
        uint256 limit
    ) external view returns (CleanupEvent[] memory page) {
        CleanupEvent[] storage full = _history[wallet];
        uint256 total = full.length;
        if (offset >= total) return new CleanupEvent[](0);

        uint256 end = offset + limit > total ? total : offset + limit;
        page = new CleanupEvent[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = full[i];
        }
    }
}
```

### 8.2 `WalletDoctorBadge.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IWalletDoctorLog {
    function currentScore(address wallet) external view returns (uint256);
}

/// @title WalletDoctorBadge
/// @notice Mint badge ERC-721 non-transferable sebagai bukti onchain
///         bahwa sebuah wallet pernah mencapai skor kesehatan minimum.
contract WalletDoctorBadge is ERC721, Ownable {
    IWalletDoctorLog public immutable logContract;
    uint256 public constant SCORE_THRESHOLD = 80;

    uint256 private _nextTokenId;
    mapping(address => bool) public hasBadge;

    error ScoreTooLow(uint256 current, uint256 required);
    error AlreadyMinted(address wallet);
    error SoulboundToken();

    event BadgeMinted(address indexed wallet, uint256 indexed tokenId, uint256 scoreAtMint);

    constructor(address logContractAddress)
        ERC721("MonDoc Cleanup Badge", "WDCB")
        Ownable(msg.sender)
    {
        logContract = IWalletDoctorLog(logContractAddress);
    }

    /// @notice Mint badge untuk `wallet` jika skornya sudah memenuhi threshold.
    ///         Siapa pun boleh memicu (misal frontend user sendiri), karena
    ///         hasil mint selalu ke `wallet` — tidak bisa disalahgunakan ke alamat lain.
    function mintBadge(address wallet) external {
        uint256 score = logContract.currentScore(wallet);
        if (score < SCORE_THRESHOLD) revert ScoreTooLow(score, SCORE_THRESHOLD);
        if (hasBadge[wallet]) revert AlreadyMinted(wallet);

        hasBadge[wallet] = true;
        uint256 tokenId = _nextTokenId++;
        _safeMint(wallet, tokenId);

        emit BadgeMinted(wallet, tokenId, score);
    }

    /// @dev Badge dibuat soulbound (non-transferable) supaya benar-benar
    ///      merepresentasikan riwayat wallet itu sendiri, bukan bisa diperjualbelikan.
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert SoulboundToken();
        return super._update(to, tokenId, auth);
    }
}
```

### 8.3 Catatan Keamanan & Desain

- **Tidak ada custody dana.** Revoke (`approve`/`setApprovalForAll`) dipanggil user langsung ke kontrak token asli, bukan lewat kontrak MonDoc — kontrak ini hanya mencatat hasilnya (log & badge).
- **`logCleanup` bersifat self-report.** Skor dihitung di frontend lalu dikirim onchain oleh wallet user sendiri (`msg.sender`), jadi tidak ada satu wallet yang bisa memalsukan skor wallet lain. Untuk MVP ini cukup, karena mengubah `logCleanup` menjadi trustless (dihitung ulang di kontrak) butuh menyimpan seluruh data approval onchain — di luar scope hackathon.
- **Badge soulbound** (override `_update`) supaya tidak bisa diperjualbelikan, konsisten dengan tujuannya sebagai bukti riwayat wallet, bukan koleksi tradeable.
- **Custom errors** dipakai (bukan `require(..., "string")`) untuk hemat gas dan pesan error yang lebih jelas saat debugging di frontend.
- **Pagination di `getHistoryPage`** mengantisipasi riwayat yang tumbuh panjang, supaya query tetap murah dan tidak melebihi batas response RPC.
- **Testing minimum via Foundry:** kasus skor tepat di batas (79/80/100), mint dobel, transfer badge (harus revert), lonjakan gas untuk riwayat panjang.

---

## 9. Algoritma Wallet Health Score (v1, sederhana)

```
score = 100
score -= (jumlah approval unlimited ke kontrak tak dikenal) × 15
score -= (jumlah approval unlimited ke kontrak dikenal)      × 7
score -= (jumlah approval aktif lainnya)                     × 2
score = max(score, 0)
score += min(jumlah cleanup tercatat onchain × 5, 20)   // bonus, cap +20
score = min(score, 100)
```

Skor dihitung ulang di frontend tiap kali data approval berubah, lalu dikirim ke `logCleanup` setelah revoke berhasil — sehingga histori skor di kontrak selalu sinkron dengan aksi nyata, bukan angka statis.

## 10. Alur Demo (3 Menit)

| Waktu | Aksi | Yang ditunjukkan ke judge |
|---|---|---|
| 0:00–0:20 | Connect wallet | UI bersih, langsung tampil skor awal (misal 45/100) |
| 0:20–0:50 | Scan approval | List approval dengan label risiko warna, highlight 2–3 yang unlimited/berisiko |
| 0:50–1:30 | Klik Revoke | Tx wallet muncul, konfirmasi, approval hilang dari list secara real-time |
| 1:30–1:50 | Log onchain | Tampilkan tx `logCleanup` di explorer Monad, histori bertambah |
| 1:50–2:10 | Skor naik | Animasi skor naik (45 → 70+), badge NFT ter-mint jika threshold tercapai |
| 2:10–2:50 | Failed TX Explainer | Paste 1 hash tx gagal, tampilkan penjelasan bahasa sederhana + saran |
| 2:50–3:00 | Closing | Tunjukkan riwayat wallet health lengkap, ajak coba di link live |

## 11. Non-Goals (di luar scope MVP)

- Dukungan multi-chain (fokus Monad saja)
- Aplikasi mobile native
- Model ML untuk deteksi kontrak jahat (v1 pakai daftar/heuristik sederhana)
- Auto-revoke tanpa konfirmasi user (semua tetap butuh signature manual, demi keamanan)

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Data approval historis sulit didapat kalau RPC tidak simpan log lama | Batasi range blok scan, atau pakai indexer (Envio/subgraph-like) jika waktu memungkinkan |
| Rate limit RPC publik Monad saat demo live | Siapkan RPC provider berbayar (Alchemy/QuickNode/Ankr) sebagai fallback |
| Dianggap "AI slop" oleh judging agent | UI custom (Tailwind + shadcn dikustom), identitas visual jelas, bukan template generik |
| Dianggap vaporware kalau demo cuma toast sukses | Revoke & log harus benar-benar tx onchain nyata, ditunjukkan di explorer saat demo |
| Skor bisa "dipalsukan" karena `logCleanup` self-report | Cukup untuk MVP karena hanya memengaruhi skor wallet pengirim sendiri; dijelaskan sebagai batasan v1, bukan celah keamanan dana |

## 13. Pemetaan ke Submission Requirements

- **Description:** "App yang memindai, membersihkan, dan mencatat kesehatan wallet-mu langsung onchain."
- **Problem:** "User punya token approval berisiko yang terlupakan dan tidak tahu cara membersihkannya dengan aman."
- **Solution:** "Scan approval, revoke sekali klik, catat setiap cleanup onchain, dan beri skor keamanan + badge sebagai bukti."
- **Contract address:** isi setelah deploy `WalletDoctorLog` dan `WalletDoctorBadge` ke Monad testnet/mainnet (lihat bagian 7.1 untuk chain ID & explorer).

## 14. Metrik Sukses (untuk diri sendiri, bukan submission)

- Approval berisiko terdeteksi akurat (uji manual di wallet sendiri sebelum submit)
- Revoke → log onchain → skor berubah berjalan mulus tanpa reload manual
- Demo video bisa dijalankan ulang oleh orang lain dalam < 3 menit tanpa penjelasan tambahan
