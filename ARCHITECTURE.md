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
# CashMatrix — Locked Architecture & Working Memory
# Last updated: 2026-10-25
# Rule: Read this file FIRST in every new session before any work.

## PROJECT STATUS (as of 2026-10-25)

- Old project restructured; 30 retired contracts archived in contracts/archive/ (untouched reference)
- Admin dashboard ALREADY EXISTS and is fully tested:
  - Sidebar: Venus Yield | Portfolio | Venus Market | Swap | Activity | Yield Optimizer
  - Multi-token Venus integration working end-to-end
- CashMatrix Vault contract DEPLOYED and VERIFIED
  - Contract logic, functions, and events all working on-chain
- 9 Phase-1 contracts + multi-token keeper bot deployed on testnet
- Testnet liquidity issue: only WBNB has depth; all other tokens/pairs dead
- CURRENT MODE: Paper trading using full existing infrastructure with MAINNET MARKET LOGIC
  - Keeper reads real mainnet PancakeSwap/Venus quotes, gas, spreads
  - Simulates execution (no real funds move)
  - Settles simulated PnL on-chain via Vault.settleBatch()
  - This exercises compounding, 50/50 split, and 1% cap for real

## LOCKED MONEY-MANAGEMENT RULES

- Per-user VIRTUAL SUB-ACCOUNTS (not one pooled blob):
  struct UserAccount { principal, currentCapital, cumulativeLoss, claimableProfit, tradingFrozen }
- 1% CUMULATIVE LOSS CAP — PER USER, on that user's own principal
  - $10 user → $0.10 cap; $500 user → $5 cap; $2000 user → $20 cap
  - When hit: ONLY that user frozen (Option A: capital sits idle, preserved, no Venus parking in Phase 1)
  - Other users keep trading with their own capital
  - Keeper sizes trades using only sum of NON-FROZEN users' currentCapital
  - PnL allocated only to users who participated in that trade
- 100% of profit compounds continuously
- Profit split: 50% user-claimable (withdraw anytime, no timelock) / 50% admin-allocated (keeps trading)
- Losses reduce currentCapital, add to cumulativeLoss, freeze user at 1% of principal

## DYNAMIC THRESHOLD (no fixed $0.20)

A batch fires only when:
  gross spread > live gas cost + slippage buffer + min net profit
- Live gas cost recalculated per batch (gasPrice × gasUsed × BNB price)
- Slippage buffer dynamic, based on pool depth at ACTUAL trade size
- Min net profit: small configurable floor, not fixed
- Atomic multicall: whole batch reverts if net profit doesn't clear threshold

## EXECUTION ARCHITECTURE (3 layers)

Layer 1 — Micro-Agent Mesh (off-chain, WebSocket, <50ms reaction)
  - Agent per strategy/pair, submits signed intents to gossip bus
Layer 2 — Private Solver Mesh
  - Redis Pub/Sub gossip bus (Phase 1-2, not true P2P)
  - Dedup intents → aggregate into multicall batch → off-chain simulate → private tx submit
  - Gas Sentinel + Circuit Breaker listen on same bus
Layer 3 — Compounding Ledger
  - Real-time off-chain mirror (Redis/Postgres) for instant dashboard updates
  - Periodic on-chain settleBatch() = canonical source of truth

## MAINNET HARDENING (all 5 locked)

1. Private tx submission (48 Club Puissant / bloXroute) — no public mempool
2. Dynamic gas threshold — recalculated per batch, never hardcoded
3. Depth-checked quoting — getAmountsOut at actual trade size, not spot price
4. Approval hygiene — exact-amount approvals or Permit2, no unlimited approvals
5. Adapter pause switches — kill any single adapter without touching others

## STRATEGY ROADMAP (locked priority)

1. Spatial Cross-DEX Arb — Phase 1-2 (core engine)
2. Fee-Tier Triangular Routing — Phase 2 (multiplier on #1)
3. Stablecoin Peg Arb — Phase 2-3
4. Flashloan Triangular Arb — Phase 2-3
5. PMM vs AMM (DODO) — Phase 3
6. Dutch Auction IntentMesh — Phase 4 via 1inch Fusion (intent lane, NOT multicall leg)

## ADAPTER FEASIBILITY ON BSC MAINNET

Build first: PancakeSwap V2, PancakeSwap V3, Uniswap V3, Venus, Aave V3
Add later: Biswap, DODO, Wombat, Curve
Skip entirely: Uniswap V2, Aave V2 (don't exist on BSC)
1inch Fusion: separate intent-fallback lane, not part of atomic batch

## ACTIVE CONTRACT SET (8 total)

1. interfaces/IAdapter.sol — common interface (DEX + lending)
2. core/AdapterRegistry.sol — registration + pause switches
3. adapters/PancakeV2Adapter.sol — DEX leg
4. core/CashMatrixVault.sol — per-user accounts, 1% cap, 50/50, settleBatch (DEPLOYED+VERIFIED)
5. strategies/CashMatrixStrategyHub.sol — orchestration + dynamic threshold
6. core/IntentMeshRouter.sol — atomic batch + flashloan
7. core/KeeperBot.sol — thin keeper shell
8. adapters/VenusLendingAdapter.sol — lending leg

Later phases (register/upgrade only, no redeploy):
- Phase 2: PancakeV3Adapter, UniswapV3Adapter, AaveV3Adapter, BiswapAdapter
- Phase 3: DodoAdapter, WombatAdapter, CurveAdapter, stealth withdrawal
- Phase 4: OneInchFusionAdapter (intent lane)

Existing router/flashloan contracts fold into IntentMeshRouter + StrategyHub (not separate mainnet contracts).

## DASHBOARD INTEGRATION PLAN (next work)

Dashboard already exists (Venus Yield/Portfolio/Market/Swap/Activity/Yield Optimizer).
Next: wire newly deployed CashMatrix contracts into it.

Step 1 — Add "CashMatrix" sidebar section + Vault read calls
  (principal, currentCapital, cumulativeLoss, claimableProfit, tradingFrozen)
Step 2 — Wire deposit()/claimProfit() write calls
Step 3 — Surface settleBatch() events in Activity tab
Step 4 — Add 1% cap gauge (cumulativeLoss / principal×1%)
Step 5 — Keeper switches to mainnet-logic paper mode, feeds settleBatch()
Step 6 — "PAPER MODE" badge on all PnL displays
Step 7 — Strategy tabs populate (Spatial Arb, Venus Yield, WBNB Position)
Step 8 — Swarm Monitor panel (agents, gas sentinel, circuit breaker, batch queue)
Step 9 — Adapter Registry panel (register/toggle adapters)
Step 10 — Phase 2-4 adapters/strategies auto-appear via Registry

## WORKING RULES (how we operate)

- ONE thing at a time — present design/thinking, user reviews, only proceed on explicit "proceed"
- No code dumps before user confirms direction
- Every new session: read this file first, confirm understanding, then wait for instruction
- Testnet passing ≠ mainnet ready — always think mainnet-first (liquidity, MEV, gas, approvals)
- Paper trading with mainnet logic is the current validation path before any real capital moves
