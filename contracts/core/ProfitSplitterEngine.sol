// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProfitSplitterEngine is Ownable {
    uint256 public constant SPLIT_BASIS = 10000;
    uint256 public constant MIN_USER_SHARE_BPS = 1000; // 10%
    uint256 public constant MAX_USER_SHARE_BPS = 9000; // 90%

    uint256 public userShareBps = 5000;
    uint256 public vaultShareBps = 5000;

    event ProfitDistributed(
        uint256 totalProfit,
        uint256 userAmount,
        uint256 vaultAmount
    );
    event SplitUpdated(uint256 newUserShare, uint256 newVaultShare);

    constructor() Ownable(msg.sender) {}

    function updateSplits(uint256 _userShareBps) external onlyOwner {
        require(
            _userShareBps >= MIN_USER_SHARE_BPS &&
                _userShareBps <= MAX_USER_SHARE_BPS,
            "User share out of bounds"
        );

        userShareBps = _userShareBps;
        vaultShareBps = SPLIT_BASIS - _userShareBps;

        emit SplitUpdated(userShareBps, vaultShareBps);
    }

    function calculateSplit(
        uint256 profitAmount
    )
        external
        view
        returns (uint256 userAmount, uint256 vaultAmount)
    {
        userAmount = (profitAmount * userShareBps) / SPLIT_BASIS;
        vaultAmount = profitAmount - userAmount;

    }
}
