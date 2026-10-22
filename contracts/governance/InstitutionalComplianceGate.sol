// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InstitutionalComplianceGate
 * @notice On-chain KYC/AML credential gating.
 */
contract InstitutionalComplianceGate is Ownable {
    mapping(address => bool) public kycVerified;

    event KYCStatusUpdated(address indexed account, bool status);

    constructor() Ownable(msg.sender) {}

    function setKYCStatus(address account, bool status) external onlyOwner {
        kycVerified[account] = status;
        emit KYCStatusUpdated(account, status);
    }

    modifier onlyCompliant(address account) {
        require(kycVerified[account], "Account not KYC compliant");
        _;
    }
}
