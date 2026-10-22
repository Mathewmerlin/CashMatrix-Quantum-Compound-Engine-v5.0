#!/bin/bash
set -e

echo "=== Inspecting Venus Lending Adapter ==="
forge script script/InspectVenus.s.sol \
  --rpc-url $RPC_URL \
  --via-ir

echo "=== Inspection Complete! ==="
