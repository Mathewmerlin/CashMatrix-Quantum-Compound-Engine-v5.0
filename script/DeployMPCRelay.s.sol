// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/privacy/MPCObfuscatedRelay.sol";

contract DeployMPCRelay is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        MPCObfuscatedRelay relay = new MPCObfuscatedRelay();
        
        console.log("MPCObfuscatedRelay deployed at:", address(relay));

        vm.stopBroadcast();
    }
}
