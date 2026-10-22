// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/adapters/VenusLendingAdapter.sol";

contract InspectVenus is Script {
    address constant VENUS_ADAPTER = 0xD550f1BDFb568A25ba0120cDE1C1bDA7c34D0cF2;

    function run() external view {
        console.log("=== INSPECTING VENUS LENDING ADAPTER POSITIONS ===");

        VenusLendingAdapter adapter = VenusLendingAdapter(VENUS_ADAPTER);

        address owner = adapter.owner();
        console.log("-> Adapter Owner:", owner);

        // Add additional read calls here if your adapter exposes position getters
        console.log("-> Position inspection check finished.");
    }
}
