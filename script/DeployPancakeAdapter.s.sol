// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/adapters/PancakeV3Adapter.sol";

contract DeployPancakeAdapter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        // Correctly checksummed PancakeSwap V3 Testnet Router address
        address testnetRouter = 0x9A489505A00c6e72120eeB04831e0170a521021C;

        vm.startBroadcast(deployerPrivateKey);

        PancakeV3Adapter adapter = new PancakeV3Adapter(testnetRouter);
        
        console.log("PancakeV3Adapter deployed at:", address(adapter));

        vm.stopBroadcast();
    }
}
