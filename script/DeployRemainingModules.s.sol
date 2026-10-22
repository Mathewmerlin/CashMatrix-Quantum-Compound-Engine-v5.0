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

contract DeployRemainingModules is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // Core
        EvolutionaryMutator mutator = new EvolutionaryMutator();
        ProfitSplitterEngine splitter = new ProfitSplitterEngine();

        // Adapters (Pass explicit deployer address instead of msg.sender)
        VenusLendingAdapter venus = new VenusLendingAdapter(deployer);
        QuantumArbitrageEngine arb = new QuantumArbitrageEngine();
        DeltaNeutralHedgeRouter hedge = new DeltaNeutralHedgeRouter();

        // Privacy
        DecoyTrafficRouter decoy = new DecoyTrafficRouter();
        ZKStateBlinder blinder = new ZKStateBlinder();

        // Security
        QuantumResistantShield shield = new QuantumResistantShield();
        TEERemoteAttestation tee = new TEERemoteAttestation();
        SharedSecurityAnchor anchor = new SharedSecurityAnchor();
        TWAPOracleGuard twap = new TWAPOracleGuard();
        VaultCircuitBreaker breaker = new VaultCircuitBreaker();
        YieldInsurancePool insurance = new YieldInsurancePool();

        // AI
        VerifiableAIEngine aiEngine = new VerifiableAIEngine();

        // Governance
        InstitutionalComplianceGate kyc = new InstitutionalComplianceGate();
        StrategyProposalDAO dao = new StrategyProposalDAO();

        console.log("=== DEPLOYMENT LOG ===");
        console.log("EvolutionaryMutator:", address(mutator));
        console.log("ProfitSplitterEngine:", address(splitter));
        console.log("VenusLendingAdapter:", address(venus));
        console.log("QuantumArbitrageEngine:", address(arb));
        console.log("DeltaNeutralHedgeRouter:", address(hedge));
        console.log("DecoyTrafficRouter:", address(decoy));
        console.log("ZKStateBlinder:", address(blinder));
        console.log("QuantumResistantShield:", address(shield));
        console.log("TEERemoteAttestation:", address(tee));
        console.log("SharedSecurityAnchor:", address(anchor));
        console.log("TWAPOracleGuard:", address(twap));
        console.log("VaultCircuitBreaker:", address(breaker));
        console.log("YieldInsurancePool:", address(insurance));
        console.log("VerifiableAIEngine:", address(aiEngine));
        console.log("InstitutionalComplianceGate:", address(kyc));
        console.log("StrategyProposalDAO:", address(dao));

        vm.stopBroadcast();
    }
}
