// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultCircuitBreaker
 * @notice Emergency volatility and depeg autonomous pauser.
 */
contract VaultCircuitBreaker is Ownable {
    bool public tripped;

    event CircuitBreakerTripped(string reason);

    constructor() Ownable(msg.sender) {}

    function trip(string calldata reason) external onlyOwner {
        tripped = true;
        emit CircuitBreakerTripped(reason);
    }

    function reset() external onlyOwner {
        tripped = false;
    }
}
