// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ZKStateBlinder
 * @notice Zero-knowledge balance and state root obfuscator.
 */
contract ZKStateBlinder is Ownable {
    mapping(bytes32 => bool) public blindedCommitments;

    event CommitmentRegistered(bytes32 indexed commitment);

    constructor() Ownable(msg.sender) {}

    function registerCommitment(bytes32 commitment) external {
        blindedCommitments[commitment] = true;
        emit CommitmentRegistered(commitment);
    }
}
