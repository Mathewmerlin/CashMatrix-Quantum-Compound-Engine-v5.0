// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title QuantumGuard
 * @notice Provides circuit-breaker protection and anomaly detection limits for the protocol.
 */
contract QuantumGuard is Ownable {
    bool public paused;
    mapping(address => bool) public guardians;

    event GuardTriggered(address indexed guard, string reason);
    event StatusChanged(bool isPaused);

    constructor() Ownable(msg.sender) {
        guardians[msg.sender] = true;
    }

    modifier whenNotPaused() {
        require(!paused, "Protocol is paused by QuantumGuard");
        _;
    }

    function setGuardian(address guardian, bool status) external onlyOwner {
        guardians[guardian] = status;
    }

    function emergencyPause(string calldata reason) external {
        require(guardians[msg.sender], "Not an authorized guardian");
        paused = true;
        emit GuardTriggered(msg.sender, reason);
        emit StatusChanged(true);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit StatusChanged(false);
    }
}
