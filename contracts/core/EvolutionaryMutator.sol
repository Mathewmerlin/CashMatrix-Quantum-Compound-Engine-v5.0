// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EvolutionaryMutator
 * @notice Handles runtime code mutation parameters and genetic algorithm strategy weights (TEE Swarm).
 */
contract EvolutionaryMutator is Ownable {
    mapping(bytes32 => uint256[4]) public strategyGenes; // [riskTolerance, alphaWeight, gasOptimization, mutationRate]
    mapping(address => bool) public authorizedSwarmNodes;

    event GeneMutated(bytes32 indexed strategyId, uint256[4] newGenes);
    event SwarmNodeUpdated(address indexed node, bool status);

    constructor() Ownable(msg.sender) {}

    function setSwarmNode(address node, bool status) external onlyOwner {
        authorizedSwarmNodes[node] = status;
        emit SwarmNodeUpdated(node, status);
    }

    function mutateStrategy(bytes32 strategyId, uint256[4] calldata newGenes) external {
        require(authorizedSwarmNodes[msg.sender] || msg.sender == owner(), "Unauthorized mutator");
        strategyGenes[strategyId] = newGenes;
        emit GeneMutated(strategyId, newGenes);
    }
}
