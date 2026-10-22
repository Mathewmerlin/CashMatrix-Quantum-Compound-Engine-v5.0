// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/ProfitSplitterEngine.sol";

contract TestProfitSplitter is Script {
    address constant PROFIT_SPLITTER = 0xff29ffD5B2B8C38D7d5eB18Ea32c6A98f2eC2d15;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== TESTING PROFIT SPLITTER ENGINE ===");

        ProfitSplitterEngine splitter = ProfitSplitterEngine(PROFIT_SPLITTER);

        // 1. Test calculation split with a dummy profit amount (e.g., 1000 tokens)
        uint256 sampleProfit = 1000 ether;
        (uint256 userAmount, uint256 vaultAmount) = splitter.calculateSplit(sampleProfit);
        console.log("-> Sample Profit:", sampleProfit / 1 ether, "tokens");
        console.log("-> Calculated User Share Amount:", userAmount / 1 ether);
        console.log("-> Calculated Vault Share Amount:", vaultAmount / 1 ether);

        // 2. Test updating split configuration (e.g., set user share to 5000 bps / 50%)
        splitter.updateSplits(5000);
        console.log("-> Updated user share BPS to 5000 (50%)");

        // 3. Recalculate after update
        (uint256 newUserAmount, uint256 newVaultAmount) = splitter.calculateSplit(sampleProfit);
        console.log("-> New User Share Amount:", newUserAmount / 1 ether);
        console.log("-> New Vault Share Amount:", newVaultAmount / 1 ether);

        console.log("=== PROFIT SPLITTER TEST COMPLETED ===");

        vm.stopBroadcast();
    }
}
