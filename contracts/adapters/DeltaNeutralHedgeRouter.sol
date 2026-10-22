// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeltaNeutralHedgeRouter
 * @notice Funding rate market-neutral perpetual hedging execution router.
 */
contract DeltaNeutralHedgeRouter is Ownable {
    event HedgePositionOpened(address indexed asset, uint256 collateral, bool isShort);

    constructor() Ownable(msg.sender) {}

    function openHedge(address asset, uint256 collateral, bool isShort) external onlyOwner {
        emit HedgePositionOpened(asset, collateral, isShort);
    }
}
