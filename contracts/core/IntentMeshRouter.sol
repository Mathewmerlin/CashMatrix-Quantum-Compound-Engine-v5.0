// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title IntentMeshRouter
 * @notice Private Intent-Centric Solver Mesh (Bypasses Public Mempool)
 */
contract IntentMeshRouter is Ownable {
    struct Intent {
        address user;
        bytes payload;
        uint256 deadline;
        bool executed;
    }

    mapping(bytes32 => Intent) public intents;
    mapping(address => bool) public authorizedSolvers;

    event IntentSubmitted(bytes32 indexed intentHash, address indexed user, uint256 deadline);
    event IntentExecuted(bytes32 indexed intentHash, address indexed solver);
    event SolverAuthorized(address indexed solver, bool status);

    constructor() Ownable(msg.sender) {}

    function setSolverAuthorization(address solver, bool status) external onlyOwner {
        authorizedSolvers[solver] = status;
        emit SolverAuthorized(solver, status);
    }

    function submitIntent(bytes calldata payload, uint256 deadline) external returns (bytes32 intentHash) {
        require(block.timestamp <= deadline, "Intent deadline expired");
        intentHash = keccak256(abi.encodePacked(msg.sender, payload, deadline, block.chainid));
        require(intents[intentHash].user == address(0), "Intent already exists");

        intents[intentHash] = Intent({
            user: msg.sender,
            payload: payload,
            deadline: deadline,
            executed: false
        });

        emit IntentSubmitted(intentHash, msg.sender, deadline);
    }

    function executeIntent(bytes32 intentHash) external {
        require(authorizedSolvers[msg.sender], "Not an authorized solver");
        Intent storage intent = intents[intentHash];
        require(intent.user != address(0), "Intent does not exist");
        require(!intent.executed, "Intent already executed");
        require(block.timestamp <= intent.deadline, "Intent expired");

        intent.executed = true;
        emit IntentExecuted(intentHash, msg.sender);
    }
}
