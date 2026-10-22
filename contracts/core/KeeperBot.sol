// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IVault {
    function compoundYield(
        uint256 harvestedGrossYield,
        bytes calldata executionReceipt
    ) external returns (uint256);
}

contract CashMatrixKeeper is AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    address public vault;
    uint256 public lastCompoundTimestamp;
    uint256 public constant COMPOUND_INTERVAL = 1 hours;

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    event CompoundTriggered(uint256 timestamp, uint256 yield);
    event VaultUpdated(address indexed oldVault, address indexed newVault);

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor(address _vault) {
        require(_vault != address(0), "Invalid vault address");
        vault = _vault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    function checkUpkeep(
        bytes calldata
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded =
            vault != address(0) &&
            block.timestamp >= lastCompoundTimestamp + COMPOUND_INTERVAL;
        performData = "";
    }

    function performUpkeep(bytes calldata) external nonReentrant {
        require(hasRole(KEEPER_ROLE, msg.sender), "Not authorized");
        require(vault != address(0), "Vault not set");
        require(
            block.timestamp >= lastCompoundTimestamp + COMPOUND_INTERVAL,
            "Compound interval not elapsed"
        );

        lastCompoundTimestamp = block.timestamp;

        uint256 harvestedYield = IVault(vault).compoundYield(0, "");
        require(harvestedYield >= 0, "Compound failed");

        emit CompoundTriggered(block.timestamp, harvestedYield);
    }

    function setVault(address _vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_vault != address(0), "Invalid vault address");
        address oldVault = vault;
        vault = _vault;
        emit VaultUpdated(oldVault, _vault);
    }
}
