// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/core/OmniGenesis2050Master.sol";

contract DeployOmniGenesis is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Correct BSC Testnet USDC token address (18 decimals)
        address usdcTestnet = 0x64544969ed7EBf5f083679233325356EbE738930;
        
        // 2. Initial protocol genome hash signature
        bytes32 initialGenome = 0x9d448a2acf5786e8d796c10d5da10d85199af1ab8b033ae52f57c3ebba0e1306;
        
        // 3. Initial compute reserve pool (e.g., 10,000 tokens scaled to 18 decimals)
        uint256 initialReserve = 10000 * 10**18;

        OmniGenesis2050Master master = new OmniGenesis2050Master(
            usdcTestnet,
            initialGenome,
            initialReserve
        );

        console.log("OmniGenesis2050Master successfully deployed to:", address(master));

        vm.stopBroadcast();
    }
}
