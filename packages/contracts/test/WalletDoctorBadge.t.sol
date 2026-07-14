// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WalletDoctorLog} from "../src/WalletDoctorLog.sol";
import {WalletDoctorBadge} from "../src/WalletDoctorBadge.sol";

contract WalletDoctorBadgeTest is Test {
    WalletDoctorLog internal logContract;
    WalletDoctorBadge internal badge;

    address internal alice = makeAddr("alice");
    address internal bob = makeAddr("bob");
    address internal spender = makeAddr("spender");
    address internal token = makeAddr("token");

    function setUp() public {
        logContract = new WalletDoctorLog();
        badge = new WalletDoctorBadge(address(logContract));
    }

    function test_MintBadge_WhenScoreMeetsThreshold() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 80);

        badge.mintBadge(alice);

        assertTrue(badge.hasBadge(alice));
        assertEq(badge.ownerOf(0), alice);
        assertEq(badge.balanceOf(alice), 1);
    }

    function test_MintBadge_RevertsWhenScoreTooLow() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 79);

        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorBadge.ScoreTooLow.selector, 79, 80)
        );
        badge.mintBadge(alice);
    }

    function test_MintBadge_RevertsWhenAlreadyMinted() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);

        badge.mintBadge(alice);

        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorBadge.AlreadyMinted.selector, alice)
        );
        badge.mintBadge(alice);
    }

    function test_MintBadge_AnyoneCanTriggerForWallet() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 85);

        // Bob triggers mint for Alice — badge still goes to Alice
        vm.prank(bob);
        badge.mintBadge(alice);

        assertEq(badge.ownerOf(0), alice);
        assertTrue(badge.hasBadge(alice));
    }

    function test_BadgeIsSoulbound_TransferReverts() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 90);
        badge.mintBadge(alice);

        vm.prank(alice);
        vm.expectRevert(WalletDoctorBadge.SoulboundToken.selector);
        badge.transferFrom(alice, bob, 0);
    }

    function test_BadgeIsSoulbound_SafeTransferReverts() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 90);
        badge.mintBadge(alice);

        vm.prank(alice);
        vm.expectRevert(WalletDoctorBadge.SoulboundToken.selector);
        badge.safeTransferFrom(alice, bob, 0);
    }

    function test_MintBadge_ScoreExactly100() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);
        badge.mintBadge(alice);
        assertTrue(badge.hasBadge(alice));
    }

    function test_MintBadge_EmitsEvent() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 88);

        vm.expectEmit(true, true, false, true);
        emit WalletDoctorBadge.BadgeMinted(alice, 0, 88);
        badge.mintBadge(alice);
    }
}
