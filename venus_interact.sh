#!/bin/bash
set -e

echo "=== Executing Venus Lending Interaction on BSC Testnet ==="
forge script script/InteractVenus.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --slow \
  --legacy \
  --gas-price 1000000000 \
  --via-ir

echo "=== Interaction Complete! ==="
