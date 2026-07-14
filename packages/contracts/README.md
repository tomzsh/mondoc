# Wallet Doctor Contracts (Foundry)

- `WalletDoctorLog` — onchain cleanup history + score (self-reported by wallet)
- `WalletDoctorBadge` — soulbound ERC-721 when score ≥ 80

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

Copy printed addresses into `apps/web/.env.local`.
