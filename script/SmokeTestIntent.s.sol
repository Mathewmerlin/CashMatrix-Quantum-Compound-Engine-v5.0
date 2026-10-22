// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/IntentMeshRouter.sol";
import "../contracts/core/OmniGenesis2050Master.sol";

contract SmokeTestIntent is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = vm.envAddress("INTENT_MESH_ROUTER");
        address masterAddress = vm.envAddress("OMNI_GENESIS_MASTER");

        vm.startBroadcast(deployerPrivateKey);

        IntentMeshRouter router = IntentMeshRouter(routerAddress);
        OmniGenesis2050Master master = OmniGenesis2050Master(masterAddress);

        console.log("=== INTENT SMOKE TEST ===");
        console.log("Router:", routerAddress);
        console.log("Read-only target:", masterAddress);

        // Approve only the OmniGenesis master as a target.
        router.setApprovedTarget(masterAddress, true);
        console.log("-> OmniGenesis2050Master approved as read-only target.");

        // Payload calls currentGenomeHash(), a view function.
        bytes memory payload = abi.encodeWithSelector(
            master.currentGenomeHash.selector
        );

        uint256 deadline = block.timestamp + 1 hours;

        bytes32 intentHash = router.submitIntent(
            masterAddress,
            payload,
            deadline
        );

        console.log("Intent submitted:");
        console.logBytes32(intentHash);

        router.executeIntent(intentHash);
        console.log("Intent executed successfully.");

        (, , , , bool executed) = router.intents(intentHash);
        console.log("Intent executed flag:", executed);

        require(executed, "Smoke test failed");
        console.log("=== SMOKE TEST PASSED ===");

        vm.stopBroadcast();
    }
}
