#!/bin/bash
set -e

CHAIN_ID=97
DEPLOYER_ADDRESS="0xc3531641bF1B5c543fAf2BeBC1f3098b32497CA9"

echo "=== Starting Sourcify Verification for Deployed Modules ==="

echo "[1/16] Verifying EvolutionaryMutator..."
forge verify-contract --chain-id $CHAIN_ID 0x0cF6f41b0FaB37DBC6eBc52d84C2253eA64925Fe contracts/core/EvolutionaryMutator.sol:EvolutionaryMutator --verifier sourcify --via-ir

echo "[2/16] Verifying ProfitSplitterEngine..."
forge verify-contract --chain-id $CHAIN_ID 0xff29ffD5B2B8C38D7d5eB18Ea32c6A98f2eC2d15 contracts/core/ProfitSplitterEngine.sol:ProfitSplitterEngine --verifier sourcify --via-ir

echo "[3/16] Verifying VenusLendingAdapter..."
VENUS_ARGS=$(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)
forge verify-contract --chain-id $CHAIN_ID 0xD550f1BDFb568A25ba0120cDE1C1bDA7c34D0cF2 contracts/adapters/VenusLendingAdapter.sol:VenusLendingAdapter --verifier sourcify --via-ir --constructor-args $VENUS_ARGS

echo "[4/16] Verifying QuantumArbitrageEngine..."
forge verify-contract --chain-id $CHAIN_ID 0x5cD3f80bBE1b6c885c585990D5816c934D85476A contracts/adapters/QuantumArbitrageEngine.sol:QuantumArbitrageEngine --verifier sourcify --via-ir

echo "[5/16] Verifying DeltaNeutralHedgeRouter..."
forge verify-contract --chain-id $CHAIN_ID 0xE41fc9898bC7C61095FB9C501743cD5e245052d7 contracts/adapters/DeltaNeutralHedgeRouter.sol:DeltaNeutralHedgeRouter --verifier sourcify --via-ir

echo "[6/16] Verifying DecoyTrafficRouter..."
forge verify-contract --chain-id $CHAIN_ID 0xC6165Fcf03A7EC6e22df15bE2043342a6bde6a71 contracts/privacy/DecoyTrafficRouter.sol:DecoyTrafficRouter --verifier sourcify --via-ir

echo "[7/16] Verifying ZKStateBlinder..."
forge verify-contract --chain-id $CHAIN_ID 0xfBCADBC298B157Ac37B4667719772D13391Dc0c6 contracts/privacy/ZKStateBlinder.sol:ZKStateBlinder --verifier sourcify --via-ir

echo "[8/16] Verifying QuantumResistantShield..."
forge verify-contract --chain-id $CHAIN_ID 0x3B6c6246Ed6593BF09dcF526D1194D0680e251c3 contracts/security/QuantumResistantShield.sol:QuantumResistantShield --verifier sourcify --via-ir

echo "[9/16] Verifying TEERemoteAttestation..."
forge verify-contract --chain-id $CHAIN_ID 0x0E88B01448Ce7A15fd7faD9c255468BC98F3E937 contracts/security/TEERemoteAttestation.sol:TEERemoteAttestation --verifier sourcify --via-ir

echo "[10/16] Verifying SharedSecurityAnchor..."
forge verify-contract --chain-id $CHAIN_ID 0xc9A0aa1e919f280185A81610909967625186bF37 contracts/security/SharedSecurityAnchor.sol:SharedSecurityAnchor --verifier sourcify --via-ir

echo "[11/16] Verifying TWAPOracleGuard..."
forge verify-contract --chain-id $CHAIN_ID 0x7666Bd2A94CB54C2b261071E56f20A8d4cDFc26f contracts/security/TWAPOracleGuard.sol:TWAPOracleGuard --verifier sourcify --via-ir

echo "[12/16] Verifying VaultCircuitBreaker..."
forge verify-contract --chain-id $CHAIN_ID 0x552fd55CaB741B80a3a15a03C02aAFB39d855A38 contracts/security/VaultCircuitBreaker.sol:VaultCircuitBreaker --verifier sourcify --via-ir

echo "[13/16] Verifying YieldInsurancePool..."
forge verify-contract --chain-id $CHAIN_ID 0x6B832FE2f08a9F0ef750ac416Ce22c7ac3c1d99b contracts/security/YieldInsurancePool.sol:YieldInsurancePool --verifier sourcify --via-ir

echo "[14/16] Verifying VerifiableAIEngine..."
forge verify-contract --chain-id $CHAIN_ID 0xeb657b7C9Bd9aa88b471aA81aD31Dc683268367d contracts/ai/VerifiableAIEngine.sol:VerifiableAIEngine --verifier sourcify --via-ir

echo "[15/16] Verifying InstitutionalComplianceGate..."
forge verify-contract --chain-id $CHAIN_ID 0x929571FCE93e4779410C8EeD1bdb1127efE50124 contracts/governance/InstitutionalComplianceGate.sol:InstitutionalComplianceGate --verifier sourcify --via-ir

echo "[16/16] Verifying StrategyProposalDAO..."
forge verify-contract --chain-id $CHAIN_ID 0xcbC78F5ad8Edcb8fdA84cbC1144417FB46952f6b contracts/governance/StrategyProposalDAO.sol:StrategyProposalDAO --verifier sourcify --via-ir

echo "=== All Sourcify Verification Requests Completed! ==="
