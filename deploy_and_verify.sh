#!/bin/bash
set -e

echo "=== 1. Building & Compiling Contracts with IR ==="
forge build --via-ir

echo "=== 2. Deploying Remaining Modules to BSC Testnet (via IR) ==="
forge script script/DeployRemainingModules.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --slow \
  --legacy \
  --gas-price 1000000000 \
  --via-ir

echo "=== Deployment Complete! ==="
