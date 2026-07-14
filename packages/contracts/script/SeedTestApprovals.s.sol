// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

/// @notice Seed demo approvals: **3 high · 2 medium · 1 low** (matches app classifyRisk).
/// @dev 1 deploy+mint + 6 approves = 7 txs. PRIVATE_KEY required.
///      Optional TARGET_WALLET (defaults to deployer).
contract SeedTestApprovals is Script {
    // --- Known spenders (unlimited → MEDIUM) — labels in apps/web knownSpenders.ts ---
    address constant KNOWN_1 = 0x3012E9049d05B4B5369D690114D5A5861EbB85cb; // Atlantis · SwapRouter
    address constant KNOWN_2 = 0xc7E09B556E1a00cfc40b1039D6615f8423136Df7; // Atlantis · V2SwapRouterV2

    // --- Unknown spenders (unlimited → HIGH) ---
    address constant UNKNOWN_1 = 0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF;
    address constant UNKNOWN_2 = 0xb0B0000000000000000000000000000000000001;
    address constant UNKNOWN_3 = 0xBAdbeef000000000000000000000000000000001;

    // --- Limited small allowance (→ LOW); unknown or known both low if not large ---
    address constant LIMITED = 0x1111111111111111111111111111111111111111;

    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(key);
        address wallet = vm.envOr("TARGET_WALLET", deployer);

        console2.log("Deployer:", deployer);
        console2.log("Test wallet (owner of approvals):", wallet);
        console2.log("Plan: 3 HIGH + 2 MEDIUM + 1 LOW");

        vm.startBroadcast(key);

        // Deploy + mint in one tx
        MockERC20 token = new MockERC20("MonDoc Demo", "mdDEMO", wallet, 1_000_000 ether);

        if (wallet == deployer) {
            // HIGH × 3 — unlimited to unknown
            token.approve(UNKNOWN_1, type(uint256).max);
            token.approve(UNKNOWN_2, type(uint256).max);
            token.approve(UNKNOWN_3, type(uint256).max);

            // MEDIUM × 2 — unlimited to known routers
            token.approve(KNOWN_1, type(uint256).max);
            token.approve(KNOWN_2, type(uint256).max);

            // LOW × 1 — small capped allowance (100 ether << 1e24 large threshold)
            token.approve(LIMITED, 100 ether);
        } else {
            console2.log("NOTE: TARGET_WALLET != deployer. Token minted only; no approvals.");
        }

        vm.stopBroadcast();

        console2.log("--- Seed complete ---");
        console2.log("MockERC20 mdDEMO:", address(token));
        console2.log("HIGH  unlimited unknown ->", UNKNOWN_1);
        console2.log("HIGH  unlimited unknown ->", UNKNOWN_2);
        console2.log("HIGH  unlimited unknown ->", UNKNOWN_3);
        console2.log("MED   unlimited known   -> Atlantis SwapRouter", KNOWN_1);
        console2.log("MED   unlimited known   -> Atlantis V2Router  ", KNOWN_2);
        console2.log("LOW   100 ether         ->", LIMITED);
        console2.log("Open MonDoc Scan with wallet:", wallet);
    }
}
