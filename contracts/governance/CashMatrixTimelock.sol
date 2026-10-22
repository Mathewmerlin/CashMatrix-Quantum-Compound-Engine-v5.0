// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CashMatrixTimelock
 * @notice Manages timelocked governance and upgrade execution for the protocol.
 */
contract CashMatrixTimelock is Ownable {
    uint256 public constant MIN_DELAY = 1 days;
    mapping(bytes32 => bool) public queuedTransactions;

    event TransactionQueued(bytes32 indexed txHash, address target, uint256 value, bytes data, uint256 executeTime);
    event TransactionExecuted(bytes32 indexed txHash, address target, uint256 value, bytes data);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function queueTransaction(address target, uint256 value, bytes calldata data, uint256 executeTime) external onlyOwner returns (bytes32) {
        require(executeTime >= block.timestamp + MIN_DELAY, "Timelock: Delay too short");
        bytes32 txHash = keccak256(abi.encode(target, value, data, executeTime));
        queuedTransactions[txHash] = true;
        emit TransactionQueued(txHash, target, value, data, executeTime);
        return txHash;
    }

    function executeTransaction(address target, uint256 value, bytes calldata data, uint256 executeTime) external payable onlyOwner returns (bytes memory) {
        bytes32 txHash = keccak256(abi.encode(target, value, data, executeTime));
        require(queuedTransactions[txHash], "Timelock: Transaction not queued");
        require(block.timestamp >= executeTime, "Timelock: Transaction not ready");

        queuedTransactions[txHash] = false;

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Timelock: Transaction execution failed");

        emit TransactionExecuted(txHash, target, value, data);
        return result;
    }
}
