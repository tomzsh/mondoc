// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {WalletDoctorLog} from "../src/WalletDoctorLog.sol";
import {WalletDoctorBadge} from "../src/WalletDoctorBadge.sol";

/// @notice Deploy WalletDoctorLog lalu WalletDoctorBadge (badge depends on log).
contract Deploy is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerKey);

        WalletDoctorLog logContract = new WalletDoctorLog();
        WalletDoctorBadge badge = new WalletDoctorBadge(address(logContract));

        console2.log("WalletDoctorLog:", address(logContract));
        console2.log("WalletDoctorBadge:", address(badge));

        vm.stopBroadcast();
    }
}
