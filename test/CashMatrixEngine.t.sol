// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/core/EvolutionaryMutator.sol";
import "../contracts/core/ProfitSplitterEngine.sol";
import "../contracts/security/VaultCircuitBreaker.sol";

contract CashMatrixEngineTest is Test {
    EvolutionaryMutator mutator;
    ProfitSplitterEngine splitter;
    VaultCircuitBreaker breaker;

    function setUp() public {
        mutator = new EvolutionaryMutator();
        splitter = new ProfitSplitterEngine();
        breaker = new VaultCircuitBreaker();
    }

    function test_EvolutionaryMutatorStrategy() public {
        bytes32 strategyId = keccak256("TEST_STRATEGY");
        uint256[4] memory genes = [uint256(10), 20, 30, 40];

        mutator.mutateStrategy(strategyId, genes);
        
        // Query individual elements using the auto-generated getter (key, index)
        assertEq(mutator.strategyGenes(strategyId, 0), 10);
        assertEq(mutator.strategyGenes(strategyId, 3), 40);
    }

    function test_ProfitSplitterCalculation() public {
        uint256 profit = 1000 ether;
        (uint256 userAmount, uint256 vaultAmount) = splitter.calculateSplit(profit);
        
        assertEq(userAmount + vaultAmount, profit);

        // Update split and test (50%)
        splitter.updateSplits(5000);
        (uint256 newUserAmount, uint256 newVaultAmount) = splitter.calculateSplit(profit);
        assertEq(newUserAmount, 500 ether);
        assertEq(newVaultAmount, 500 ether);
    }

    function test_VaultCircuitBreakerTripAndReset() public {
        breaker.trip("Emergency test");
        breaker.reset();
    }
}
