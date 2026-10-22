// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/ai/AIOracleBridge.sol";

contract DeployAIOracleBridge is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        AIOracleBridge bridge = new AIOracleBridge();
        
        console.log("AIOracleBridge deployed at:", address(bridge));

        vm.stopBroadcast();
    }
}
