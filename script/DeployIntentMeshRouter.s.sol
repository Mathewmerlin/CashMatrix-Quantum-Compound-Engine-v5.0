// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/IntentMeshRouter.sol";

contract DeployIntentMeshRouter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IntentMeshRouter router = new IntentMeshRouter();
        
        console.log("IntentMeshRouter deployed at:", address(router));

        vm.stopBroadcast();
    }
}
