#!/bin/bash
set -e

echo "=== Executing Module Wiring on BSC Testnet ==="
forge script script/WireModules.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --slow \
  --legacy \
  --gas-price 1000000000 \
  --via-ir

echo "=== Wiring Complete! ==="
