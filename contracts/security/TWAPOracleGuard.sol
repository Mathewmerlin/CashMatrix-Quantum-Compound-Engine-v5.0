// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TWAPOracleGuard
 * @notice Flash-loan and price manipulation shield using Time-Weighted Average Prices.
 */
contract TWAPOracleGuard is Ownable {
    uint256 public maxAllowedDeviationBps = 300; // 3%

    constructor() Ownable(msg.sender) {}

    function validatePrice(uint256 spotPrice, uint256 twapPrice) external view returns (bool) {
        uint256 diff = spotPrice > twapPrice ? spotPrice - twapPrice : twapPrice - spotPrice;
        uint256 deviation = (diff * 10000) / twapPrice;
        require(deviation <= maxAllowedDeviationBps, "Price deviation exceeds TWAP limit");
        return true;
    }
}
