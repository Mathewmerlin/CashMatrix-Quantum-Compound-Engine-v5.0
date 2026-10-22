// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CashMatrixTimelock is Ownable {
    uint256 public constant MIN_DELAY = 1 days;
    uint256 public constant MAX_DELAY = 30 days;

    mapping(bytes32 => bool) public queuedTransactions;

    event TransactionQueued(
        bytes32 indexed txHash,
        address target,
        uint256 value,
        bytes data,
        uint256 executeTime
    );
    event TransactionExecuted(
        bytes32 indexed txHash,
        address target,
        uint256 value,
        bytes data
    );
    event TransactionCancelled(bytes32 indexed txHash);

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function queueTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    ) external onlyOwner returns (bytes32 txHash) {
        require(target != address(0), "Invalid target");
        require(
            executeTime >= block.timestamp + MIN_DELAY,
            "Delay too short"
        );
        require(
            executeTime <= block.timestamp + MAX_DELAY,
            "Delay too long"
        );

        txHash = keccak256(abi.encode(target, value, data, executeTime));
        require(!queuedTransactions[txHash], "Already queued");

        queuedTransactions[txHash] = true;

        emit TransactionQueued(txHash, target, value, data, executeTime);
    }

    function executeTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    )
        external
        payable
        onlyOwner
        nonReentrant
        returns (bytes memory)
    {
        require(target != address(0), "Invalid target");

        bytes32 txHash = keccak256(
            abi.encode(target, value, data, executeTime)
        );
        require(queuedTransactions[txHash], "Transaction not queued");
        require(block.timestamp >= executeTime, "Transaction not ready");
        require(
            block.timestamp <= executeTime + MAX_DELAY,
            "Transaction expired"
        );

        queuedTransactions[txHash] = false;

        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Execution failed");

        emit TransactionExecuted(txHash, target, value, data);

        return result;
    }

    function cancelTransaction(
        address target,
        uint256 value,
        bytes calldata data,
        uint256 executeTime
    ) external onlyOwner {
        bytes32 txHash = keccak256(
            abi.encode(target, value, data, executeTime)
        );
        require(queuedTransactions[txHash], "Transaction not queued");

        queuedTransactions[txHash] = false;

        emit TransactionCancelled(txHash);
    }
}
