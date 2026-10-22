// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/IntentMeshRouter.sol";

contract WireCoreContracts is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address routerAddress = vm.envAddress("INTENT_MESH_ROUTER");

        vm.startBroadcast(deployerPrivateKey);

        IntentMeshRouter router = IntentMeshRouter(routerAddress);

        console.log("=== WIRING CORE CONTRACTS ===");
        console.log("Router:", routerAddress);
        console.log("Deployer:", deployer);

        router.setSolverAuthorization(deployer, true);
        console.log("-> Deployer authorized as IntentMesh solver.");

        console.log("=== CORE CONTRACT WIRING COMPLETE ===");

        vm.stopBroadcast();
    }
}
