# MonDoc Contracts (Foundry)

- `WalletDoctorLog` — onchain cleanup history + score (self-reported by the calling wallet)
- `WalletDoctorBadge` — soulbound ERC-721 minted when score ≥ 80

## Commands

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge install   # first time / CI
forge build
forge test -vv

# Deploy (set PRIVATE_KEY + RPC)
export PRIVATE_KEY=0x...
export MONAD_TESTNET_RPC_URL=https://testnet-rpc.monad.xyz
forge script script/Deploy.s.sol --rpc-url $MONAD_TESTNET_RPC_URL --broadcast -vvvv
```

From the monorepo root you can also run:

```bash
pnpm deploy:testnet
```

That script deploys both contracts and writes addresses into `apps/web/.env.local` plus `deployments.testnet.json`.

### Seed test approvals (for Scan / Revoke demo)

```bash
# from repo root (uses packages/contracts/.env PRIVATE_KEY)
./scripts/seed-test-approvals.sh
```

Deploys mock `wdUSD` / `wdETH` / `wdNFT` and creates mixed risk approvals for the deployer wallet.
Addresses are written to `seed-approvals.testnet.json`. Connect that same wallet in the app → Scan → All history → Revoke.

## Design notes (v2 — hackathon)

- Contracts **never** custody tokens. Users revoke on the token contracts themselves.
- `logCleanup` is **self-attested** (`msg.sender` only); score is client-reported (0–100).
- Rejects zero `spender`/`token`; page limit capped at 50.
- Badge: mint only for self, stores `tokenIdOf` + `scoreAtMint`, soulbound, simple `tokenURI`.
- UI should disclose the attestation model (not full cryptographic wallet health proof).
