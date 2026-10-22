// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title YieldInsurancePool
 * @notice Internal safety reserve buffer for loss mitigation.
 */
contract YieldInsurancePool is Ownable {
    uint256 public reserveBalance;

    event ClaimPaid(address indexed recipient, uint256 amount);

    constructor() Ownable(msg.sender) {}

    receive() external payable {
        reserveBalance += msg.value;
    }

    function payoutClaim(address recipient, uint256 amount) external onlyOwner {
        require(reserveBalance >= amount, "Insufficient reserve funds");
        reserveBalance -= amount;
        payable(recipient).transfer(amount);
        emit ClaimPaid(recipient, amount);
    }
}
