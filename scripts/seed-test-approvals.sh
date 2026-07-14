#!/usr/bin/env bash
# Deploy mock tokens + create test approvals on Monad Testnet for revoke demos.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS="$ROOT/packages/contracts"

if [[ -f "$CONTRACTS/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  source "$CONTRACTS/.env"
  set +a
fi

: "${PRIVATE_KEY:?Set PRIVATE_KEY in packages/contracts/.env}"
: "${MONAD_TESTNET_RPC_URL:=https://testnet-rpc.monad.xyz}"

cd "$CONTRACTS"

echo "==> Building mocks + seed script"
forge build

echo "==> Broadcasting SeedTestApprovals on Monad Testnet"
forge script script/SeedTestApprovals.s.sol:SeedTestApprovals \
  --rpc-url "$MONAD_TESTNET_RPC_URL" \
  --broadcast \
  -vvvv

echo ""
echo "Done. Connect the same wallet (deployer) in Wallet Doctor → Scan → All history → Revoke."
