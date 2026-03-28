// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {HydraGuard} from "../src/HydraGuard.sol";

contract Deploy is Script {
    function run() external {
        address owner = vm.envAddress("OWNER_ADDRESS");
        address agent1 = vm.envAddress("AGENT1_ADDRESS");
        address agent2 = vm.envAddress("AGENT2_ADDRESS");
        address agent3 = vm.envAddress("AGENT3_ADDRESS");

        console.log("Deploying HydraGuard...");
        console.log("Owner:", owner);
        console.log("Agent 1 (Security):", agent1);
        console.log("Agent 2 (Risk):", agent2);
        console.log("Agent 3 (Portfolio):", agent3);

        vm.startBroadcast(vm.envUint("DEPLOYER_KEY"));
        HydraGuard guard = new HydraGuard(owner, agent1, agent2, agent3);
        vm.stopBroadcast();

        console.log("HydraGuard deployed at:", address(guard));
        console.log("Chain ID:", block.chainid);
    }
}
