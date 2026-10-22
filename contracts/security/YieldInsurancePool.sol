// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldInsurancePool is Ownable {
    uint256 public reserveBalance;

    event DepositReceived(address indexed sender, uint256 amount);
    event ClaimPaid(address indexed recipient, uint256 amount);

    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status = _NOT_ENTERED;

    modifier nonReentrant() {
        require(_status != _ENTERED, "Reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }

    constructor() Ownable(msg.sender) {}

    receive() external payable {
        require(msg.value > 0, "Zero deposit");
        reserveBalance += msg.value;

        emit DepositReceived(msg.sender, msg.value);
    }

    function payoutClaim(
        address recipient,
        uint256 amount
    ) external nonReentrant onlyOwner {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Zero amount");
        require(reserveBalance >= amount, "Insufficient reserve funds");

            reserveBalance -= amount;
        emit ClaimPaid(recipient, amount);

        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "ETH transfer failed");
    }
}
