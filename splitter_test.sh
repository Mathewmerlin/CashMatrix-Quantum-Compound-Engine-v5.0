#!/bin/bash
set -e

echo "=== Executing Profit Splitter Simulation on BSC Testnet ==="
forge script script/TestProfitSplitter.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --slow \
  --legacy \
  --gas-price 1000000000 \
  --via-ir

echo "=== Profit Splitter Test Complete! ==="
