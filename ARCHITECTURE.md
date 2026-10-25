# CashMatrix Q1-Q4 Finalized Architecture (LOCKED)

## Project
CashMatrix-Quantum-Compound-Engine-v5.0 (Solidity, Foundry, React frontend, Node.js backend keeper)

## Core Design Principle
ONE deployment, upgradeable forever. Proxy + implementation pattern (UUPS or Transparent Upgradeable Proxy) for Vault, Router, Registry, and StrategyHub - deployed once in Phase 1, upgraded in place for all later phases. No user migration, no address changes, no lost state. The system grows by registerAdapter() + upgrade() - nothing ever gets redeployed.

## Locked Money-Management Rules
- 100% of every trade profit compounds continuously into the next trade (nothing extracted per trade)
- User can withdraw 50% of their accumulated profit at any time (no lockup) - this is their claimable balance
- The other 50% of profit is admin-allocated and stays deployed, continuing to trade/compound
- 1% cumulative loss cap per user - on-chain backstop; per-user cumulative loss limit, NOT per-trade, NOT a trade-rejection rule
- No 30-day timelock - user withdraws their 50% profit share whenever they want

## Contract Suite

### 1. CashMatrixVault (Proxy) - the heart
Per-user sub-accounts: principal, currentCapital, cumulativeLoss, claimableProfit, tradingFrozen.
Enforces 1% cumulative loss cap per user (on-chain backstop).
100% profit compounding, 50% claimable / 50% admin-allocated.
settleBatch(users, pnlDeltas, batchId) for batch settlement (Q2).
ERC-5564 stealth-withdrawal support built in from day one (Phase 3-4 hook).
Phase 1: core accounting; later phases add features via upgrade, same address.

### 2. StrategyHub (Proxy) - trade orchestration
Executes strategies via registered adapters.
Enforces per-batch net-profit guard with DYNAMIC gas + slippage + min profit (no fixed $0.20 minimum).
Calls back into Vault settleBatch after execution.
Phase 1: spatial arb via PancakeSwap V2 + Venus. Phase 2+: add strategies via Registry, no redeploy.

### 3. IntentMeshRouter (Proxy) - batch/multicall engine
Receives batched intents from Solver Mesh.
Atomic execution: whole batch reverts if net profit < dynamic threshold.
Shared flashloan support (Phase 2-3 triangular).
Fee-tier routing logic (Phase 2).
Built in Phase 1 with the batch interface; strategies plug in later.

### 4. AdapterRegistry (Proxy) - the plug-in board
Maps adapterId to adapter contract address.
Each adapter has an enabled flag = pause switch (Q2 hardening).
Adding Biswap/DODO/Wombat/Curve later = registerAdapter() call, no Vault/Router redeploy.

### 5. DEX Adapters (per-DEX, non-proxy, immutable)
PancakeV2Adapter, PancakeV3Adapter, UniswapV3Adapter, BiswapAdapter, DodoAdapter, WombatAdapter, CurveAdapter.
Each implements common IAdapter interface: quote(), swap().
Deployed as needed per phase, registered into Registry - never touch Vault/Router.

### 6. Lending Adapters
VenusAdapter, AaveV3Adapter.
Same IAdapter interface: supply/borrow/repay/redeem.
Venus in Phase 1, Aave V3 in Phase 2.

### 7. AccessControl / Roles
Baked into each proxy via OpenZeppelin AccessControlUpgradeable.
Roles: ADMIN (upgrade, pause, register adapters), KEEPER (execute batches, settle), USER (deposit/withdraw).

### 8. (Phase 3-4, optional) StealthWithdrawal module
ERC-5564 helper attached to Vault via upgrade; Vault withdraw function designed with stealth-hook from day one.

## Strategy Mix (all three, integrated)
1. Arbitrage batch/bundled trading
2. Venus yield (supply/borrow)
3. WBNB position trading

## Phase Rollout
- Phase 1: Deploy Vault + StrategyHub + Router + Registry + PancakeV2 + Venus adapters
- Phase 2: registerAdapter() for PancakeV3/UniV3/AaveV3 + upgrade() for fee-tier routing - same addresses
- Phase 3: Register Curve/Wombat/DODO + stealth withdrawal upgrade - same addresses
- Phase 4: 1inch Fusion intent lane + any new strategy - same addresses

## Architecture Decision
Option A - one unified vault with tagged accounting (not separate admin treasury), maximizing capital efficiency and compounding power.

## Important Corrections
- The 1% rule = per-user CUMULATIVE loss cap (on-chain backstop), not per-trade
- Profit split = 50% user-claimable / 50% admin-allocated, with 100% compounding
- Min profit guard = DYNAMIC (gas + slippage aware), never a fixed dollar amount
- Testnet has minimal liquidity (only WBNB/USDC viable) - mainnet paper-trading mode is the path to validate strategy with real market data at zero risk
