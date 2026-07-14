# MonDoc Contracts (Foundry)

- **`WalletDoctorLog`** — onchain cleanup history + score (self-reported by the calling wallet)
- **Mocks** — `MockERC20` / `MockERC721` for seed demos
- **`WalletDoctorBadge`** — legacy soulbound ERC-721 (still in source / prior testnet deploys; **not used by the web app**)

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

From the monorepo root:

```bash
pnpm deploy:testnet
pnpm seed:approvals
```

`deploy:testnet` runs the Foundry deploy script and writes addresses into `apps/web/.env.local` plus `deployments.testnet.json`.  
`seed:approvals` deploys mock tokens and creates **3 high · 2 medium · 1 low** risk approvals for the deployer wallet.

Connect that same wallet in the app → **Scan** → Rescan → Revoke.

## Design notes

- Contracts **never** custody tokens. Users revoke on the token contracts themselves.
- `logCleanup` / `batchLogCleanup` are **self-attested** (`msg.sender` only); score is client-reported (0–100).
- `batchLogCleanup` accepts up to **25** pairs in one tx.
- Rejects zero `spender` / `token`; history page size is capped.
- The UI discloses the self-attested score model (not a cryptographic “wallet is safe” proof).

## Testnet Log (product)

| Contract | Address |
|----------|---------|
| WalletDoctorLog | [`0x433e9B7d88332207EFa8f98A463267bFd649F661`](https://testnet.monadexplorer.com/address/0x433e9B7d88332207EFa8f98A463267bFd649F661) |

See `deployments.testnet.json` for the latest broadcast metadata.

### Verify on Sourcify (Monad)

```bash
cd packages/contracts
# Unset ETHERSCAN_API_KEY if set — otherwise forge defaults to Etherscan client
unset ETHERSCAN_API_KEY

forge verify-contract \
  --chain 10143 \
  --rpc-url https://testnet-rpc.monad.xyz \
  --verifier sourcify \
  --verifier-url 'https://sourcify-api-monad.blockvision.org' \
  0x433e9B7d88332207EFa8f98A463267bFd649F661 \
  src/WalletDoctorLog.sol:WalletDoctorLog \
  --num-of-optimizations 200 \
  --watch
```

Verified status (2026-07-14): **exact_match** on BlockVision Sourcify.
