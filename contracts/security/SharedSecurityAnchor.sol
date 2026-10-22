// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SharedSecurityAnchor
 * @notice Restaking economic slashing security anchor (EigenLayer model).
 */
contract SharedSecurityAnchor is Ownable {
    mapping(address => uint256) public stakedCollateral;

    event Slashed(address indexed operator, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function slashOperator(address operator, uint256 amount) external onlyOwner {
        require(stakedCollateral[operator] >= amount, "Insufficient stake to slash");
        stakedCollateral[operator] -= amount;
        emit Slashed(operator, amount);
    }
}
