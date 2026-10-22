// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract QuantumGuard is Ownable {
    bool public paused;
    mapping(address => bool) public guardians;

    event GuardTriggered(address indexed guard, string reason);
    event StatusChanged(bool isPaused);
    event GuardianUpdated(address indexed guardian, bool status);

    constructor() Ownable(msg.sender) {
        guardians[msg.sender] = true;
        emit GuardianUpdated(msg.sender, true);
    }

    modifier whenNotPaused() {
        require(!paused, "Protocol is paused by QuantumGuard");
        _;
    }

    function setGuardian(
        address guardian,
        bool status
    ) external onlyOwner {
        require(guardian != address(0), "Invalid guardian");

        guardians[guardian] = status;

        emit GuardianUpdated(guardian, status);
    }

    function emergencyPause(
        string calldata reason
    ) external {
        require(guardians[msg.sender], "Not an authorized guardian");
        require(!paused, "Already paused");

        paused = true;

        emit GuardTriggered(msg.sender, reason);
        emit StatusChanged(true);
    }

    function unpause() external onlyOwner {
        require(paused, "Not paused");

        paused = false;

        emit StatusChanged(false);
    }
}
