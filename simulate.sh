#!/bin/bash
set -e

echo "=== Running End-to-End Simulation & Compounding Cycle ==="
forge script script/RunSimulation.s.sol \
  --rpc-url $RPC_URL \
  --broadcast \
  --slow \
  --legacy \
  --gas-price 1000000000 \
  --via-ir

echo "=== Simulation Complete! ==="
