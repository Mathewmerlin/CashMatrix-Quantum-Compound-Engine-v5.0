// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProfitSplitterEngine
 * @notice Legacy 50/50 user/vault profit split baseline logic and accounting.
 */
contract ProfitSplitterEngine is Ownable {
    uint256 public constant SPLIT_BASIS = 10000;
    uint256 public userShareBps = 5000; // 50%
    uint256 public vaultShareBps = 5000; // 50%

    event ProfitDistributed(uint256 totalProfit, uint256 userAmount, uint256 vaultAmount);
    event SplitUpdated(uint256 newUserShare, uint256 newVaultShare);

    constructor() Ownable(msg.sender) {}

    function updateSplits(uint256 _userShareBps) external onlyOwner {
        require(_userShareBps <= SPLIT_BASIS, "Exceeds basis points");
        userShareBps = _userShareBps;
        vaultShareBps = SPLIT_BASIS - _userShareBps;
        emit SplitUpdated(userShareBps, vaultShareBps);
    }

    function calculateSplit(uint256 profitAmount) external view returns (uint256 userAmount, uint256 vaultAmount) {
        userAmount = (profitAmount * userShareBps) / SPLIT_BASIS;
        vaultAmount = profitAmount - userAmount;
    }
}
