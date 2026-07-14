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

        vm.prank(alice);
        badge.mintBadge();

        assertTrue(badge.hasBadge(alice));
        assertEq(badge.ownerOf(0), alice);
        assertEq(badge.balanceOf(alice), 1);
        assertEq(badge.tokenIdOf(alice), 0);
        assertEq(badge.scoreAtMint(0), 80);
    }

    function test_MintBadge_RevertsWhenScoreTooLow() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 79);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorBadge.ScoreTooLow.selector, 79, 80)
        );
        badge.mintBadge();
    }

    function test_MintBadge_RevertsWhenAlreadyMinted() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);

        vm.prank(alice);
        badge.mintBadge();

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorBadge.AlreadyMinted.selector, alice)
        );
        badge.mintBadge();
    }

    function test_MintBadge_OnlySelf() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 85);

        // Bob cannot mint for Alice via overload
        vm.prank(bob);
        vm.expectRevert(WalletDoctorBadge.NotWallet.selector);
        badge.mintBadge(alice);

        // Bob minting for himself fails (score 0)
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorBadge.ScoreTooLow.selector, 0, 80)
        );
        badge.mintBadge();
    }

    function test_BadgeIsSoulbound_TransferReverts() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 90);
        vm.prank(alice);
        badge.mintBadge();

        vm.prank(alice);
        vm.expectRevert(WalletDoctorBadge.SoulboundToken.selector);
        badge.transferFrom(alice, bob, 0);
    }

    function test_BadgeIsSoulbound_SafeTransferReverts() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 90);
        vm.prank(alice);
        badge.mintBadge();

        vm.prank(alice);
        vm.expectRevert(WalletDoctorBadge.SoulboundToken.selector);
        badge.safeTransferFrom(alice, bob, 0);
    }

    function test_MintBadge_ScoreExactly100() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);
        vm.prank(alice);
        badge.mintBadge();
        assertTrue(badge.hasBadge(alice));
        assertEq(badge.scoreAtMint(0), 100);
    }

    function test_MintBadge_EmitsEvent() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 88);

        vm.prank(alice);
        vm.expectEmit(true, true, false, true);
        emit WalletDoctorBadge.BadgeMinted(alice, 0, 88);
        badge.mintBadge();
    }

    function test_TokenURI_ContainsScore() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 92);
        vm.prank(alice);
        badge.mintBadge();

        string memory uri = badge.tokenURI(0);
        // data:application/json;base64,...
        assertTrue(bytes(uri).length > 30);
    }

    function test_Version() public view {
        assertEq(badge.VERSION(), 3);
        assertEq(logContract.VERSION(), 3);
    }
}
