// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/governance/CashMatrixTimelock.sol";

contract DeployCashMatrixTimelock is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        CashMatrixTimelock timelock = new CashMatrixTimelock(deployer);
        
        console.log("CashMatrixTimelock deployed at:", address(timelock));

        vm.stopBroadcast();
    }
}
