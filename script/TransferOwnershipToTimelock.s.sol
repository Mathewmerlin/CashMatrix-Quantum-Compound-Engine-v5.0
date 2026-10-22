// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/OmniGenesis2050Master.sol";
import "../contracts/core/IntentMeshRouter.sol";

contract TransferOwnershipToTimelock is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address timelock = vm.envAddress("CASH_MATRIX_TIMELOCK");
        address masterAddress = vm.envAddress("OMNI_GENESIS_MASTER");
        address routerAddress = vm.envAddress("INTENT_MESH_ROUTER");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== TRANSFERRING OWNERSHIP TO TIMELOCK ===");
        console.log("Timelock:", timelock);

        OmniGenesis2050Master(masterAddress).transferOwnership(timelock);
        console.log("-> OmniGenesis2050Master ownership transferred.");

        IntentMeshRouter(routerAddress).transferOwnership(timelock);
        console.log("-> IntentMeshRouter ownership transferred.");

        console.log("=== OWNERSHIP TRANSFER COMPLETE ===");

        vm.stopBroadcast();
    }
}
