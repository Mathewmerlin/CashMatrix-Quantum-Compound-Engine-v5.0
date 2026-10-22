// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

interface IVault {
    function compoundYield(uint256 harvestedGrossYield, bytes calldata executionReceipt) external returns (uint256);
    function grantRole(bytes32 role, address account) external;
    function KEEPER_ROLE() external view returns (bytes32);
    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);
}

contract CashMatrixKeeper is AccessControl {
    bytes32 public constant KEEPER_ROLE = keccak256("KEEPER_ROLE");

    address public vault;
    uint256 public lastCompoundTimestamp;
    uint256 public constant COMPOUND_INTERVAL = 3;

    event CompoundTriggered(uint256 timestamp, uint256 yield);
    event VaultUpdated(address indexed oldVault, address indexed newVault);

    constructor(address _vault) {
        require(_vault != address(0), "Invalid vault address");
        vault = _vault;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(KEEPER_ROLE, msg.sender);
    }

    function checkUpkeep(bytes calldata) external view returns (
        bool upkeepNeeded,
        bytes memory performData
    ) {
        upkeepNeeded = (block.timestamp - lastCompoundTimestamp) >= COMPOUND_INTERVAL;
        performData = "";
    }

    function performUpkeep(bytes calldata) external {
        require(hasRole(KEEPER_ROLE, msg.sender), "Not authorized");
        require(vault != address(0), "Vault not set");

        lastCompoundTimestamp = block.timestamp;
        
        emit CompoundTriggered(block.timestamp, 0);

        IVault(vault).compoundYield(0, "");
    }

    function setVault(address _vault) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_vault != address(0), "Invalid vault address");
        address oldVault = vault;
        vault = _vault;
        emit VaultUpdated(oldVault, _vault);
    }
}
