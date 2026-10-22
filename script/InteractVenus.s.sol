// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/adapters/VenusLendingAdapter.sol";

contract InteractVenus is Script {
    address constant VENUS_ADAPTER = 0xD550f1BDFb568A25ba0120cDE1C1bDA7c34D0cF2;
    // Correctly checksummed WBNB address on BSC Testnet
    address constant TARGET_ASSET = 0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("=== EXECUTING ACTIVE VENUS SUPPLY ===");

        VenusLendingAdapter adapter = VenusLendingAdapter(VENUS_ADAPTER);

        // Define amount to supply (e.g., 0.01 WBNB)
        uint256 amountToSupply = 0.01 ether;

        // Call the supply function exposed by your adapter
        adapter.supply(TARGET_ASSET, amountToSupply);
        
        console.log("-> Successfully invoked supply() on VenusLendingAdapter!");

        vm.stopBroadcast();
    }
}
