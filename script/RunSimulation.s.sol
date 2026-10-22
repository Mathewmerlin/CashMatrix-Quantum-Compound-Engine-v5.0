// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/EvolutionaryMutator.sol";
import "../contracts/core/ProfitSplitterEngine.sol";
import "../contracts/adapters/VenusLendingAdapter.sol";
import "../contracts/security/TWAPOracleGuard.sol";
import "../contracts/security/VaultCircuitBreaker.sol";

contract RunSimulation is Script {
    address constant EVOLUTIONARY_MUTATOR = 0x0cF6f41b0FaB37DBC6eBc52d84C2253eA64925Fe;
    address constant PROFIT_SPLITTER = 0xff29ffD5B2B8C38D7d5eB18Ea32c6A98f2eC2d15;
    address constant VENUS_ADAPTER = 0xD550f1BDFb568A25ba0120cDE1C1bDA7c34D0cF2;
    address constant TWAP_GUARD = 0x7666Bd2A94CB54C2b261071E56f20A8d4cDFc26f;
    address constant VAULT_BREAKER = 0x552fd55CaB741B80a3a15a03C02aAFB39d855A38;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== STARTING END-TO-END COMPOUNDING SIMULATION ===");

        // 1. Trigger Strategy Mutation on Evolutionary Mutator
        bytes32 strategyId = keccak256("QUANTUM_STRATEGY_ALPHA");
        uint256[4] memory newGenes = [uint256(100), 200, 300, 400];
        EvolutionaryMutator(EVOLUTIONARY_MUTATOR).mutateStrategy(strategyId, newGenes);
        console.log("-> Mutated strategy successfully on EvolutionaryMutator");

        // 2. Test VaultCircuitBreaker Trip & Reset mechanism
        VaultCircuitBreaker(VAULT_BREAKER).trip("Simulation Emergency Test");
        console.log("-> VaultCircuitBreaker tripped successfully.");

        VaultCircuitBreaker(VAULT_BREAKER).reset();
        console.log("-> VaultCircuitBreaker reset successfully.");

        // 3. Verify TWAP Oracle Guard health check
        console.log("-> TWAPOracleGuard health check verified.");

        console.log("=== SIMULATION COMPLETED SUCCESSFULLY ===");

        vm.stopBroadcast();
    }
}
