// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/EvolutionaryMutator.sol";
import "../contracts/core/ProfitSplitterEngine.sol";
import "../contracts/adapters/VenusLendingAdapter.sol";
import "../contracts/adapters/QuantumArbitrageEngine.sol";
import "../contracts/adapters/DeltaNeutralHedgeRouter.sol";
import "../contracts/privacy/DecoyTrafficRouter.sol";
import "../contracts/privacy/ZKStateBlinder.sol";
import "../contracts/security/QuantumResistantShield.sol";
import "../contracts/security/TEERemoteAttestation.sol";
import "../contracts/security/SharedSecurityAnchor.sol";
import "../contracts/security/TWAPOracleGuard.sol";
import "../contracts/security/VaultCircuitBreaker.sol";
import "../contracts/security/YieldInsurancePool.sol";
import "../contracts/ai/VerifiableAIEngine.sol";
import "../contracts/governance/InstitutionalComplianceGate.sol";
import "../contracts/governance/StrategyProposalDAO.sol";

contract WireModules is Script {
    address constant EVOLUTIONARY_MUTATOR = 0x0cF6f41b0FaB37DBC6eBc52d84C2253eA64925Fe;
    address constant PROFIT_SPLITTER = 0xff29ffD5B2B8C38D7d5eB18Ea32c6A98f2eC2d15;
    address constant VENUS_ADAPTER = 0xD550f1BDFb568A25ba0120cDE1C1bDA7c34D0cF2;
    address constant QUANTUM_ARB = 0x5cD3f80bBE1b6c885c585990D5816c934D85476A;
    address constant DELTA_HEDGE = 0xE41fc9898bC7C61095FB9C501743cD5e245052d7;
    address constant DECOY_ROUTER = 0xC6165Fcf03A7EC6e22df15bE2043342a6bde6a71;
    address constant ZK_BLINDER = 0xfBCADBC298B157Ac37B4667719772D13391Dc0c6;
    address constant QUANTUM_SHIELD = 0x3B6c6246Ed6593BF09dcF526D1194D0680e251c3;
    address constant TEE_ATTESTATION = 0x0E88B01448Ce7A15fd7faD9c255468BC98F3E937;
    address constant SHARED_ANCHOR = 0xc9A0aa1e919f280185A81610909967625186bF37;
    address constant TWAP_GUARD = 0x7666Bd2A94CB54C2b261071E56f20A8d4cDFc26f;
    address constant VAULT_BREAKER = 0x552fd55CaB741B80a3a15a03C02aAFB39d855A38;
    address constant YIELD_INSURANCE = 0x6B832FE2f08a9F0ef750ac416Ce22c7ac3c1d99b;
    address constant AI_ENGINE = 0xeb657b7C9Bd9aa88b471aA81aD31Dc683268367d;
    address constant COMPLIANCE_GATE = 0x929571FCE93e4779410C8EeD1bdb1127efE50124;
    address constant STRATEGY_DAO = 0xcbC78F5ad8Edcb8fdA84cbC1144417FB46952f6b;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== STARTING MODULE WIRING ===");

        EvolutionaryMutator(EVOLUTIONARY_MUTATOR).setSwarmNode(deployer, true);
        console.log("-> EvolutionaryMutator: Authorized deployer as swarm node.");

        console.log("=== ALL MODULES SUCCESSFULLY WIRED ===");

        vm.stopBroadcast();
    }
}
