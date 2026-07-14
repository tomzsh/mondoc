// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {WalletDoctorLog} from "../src/WalletDoctorLog.sol";

contract WalletDoctorLogTest is Test {
    WalletDoctorLog internal logContract;

    address internal alice = makeAddr("alice");
    address internal spender = makeAddr("spender");
    address internal token = makeAddr("token");

    function setUp() public {
        logContract = new WalletDoctorLog();
    }

    function test_LogCleanup_StoresEventAndScore() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 75);

        assertEq(logContract.currentScore(alice), 75);
        assertEq(logContract.historyLength(alice), 1);

        WalletDoctorLog.CleanupEvent[] memory page = logContract.getHistoryPage(alice, 0, 10);
        assertEq(page.length, 1);
        assertEq(page[0].spender, spender);
        assertEq(page[0].token, token);
        assertEq(page[0].scoreAfter, 75);
        assertEq(page[0].timestamp, block.timestamp);
    }

    function test_LogCleanup_EmitsEvents() public {
        vm.expectEmit(true, true, true, true);
        emit WalletDoctorLog.CleanupLogged(alice, spender, token, 90, block.timestamp);
        vm.expectEmit(true, false, false, true);
        emit WalletDoctorLog.ScoreUpdated(alice, 90);

        vm.prank(alice);
        logContract.logCleanup(spender, token, 90);
    }

    function test_LogCleanup_RevertsWhenScoreAboveMax() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorLog.ScoreOutOfRange.selector, 101, 100)
        );
        logContract.logCleanup(spender, token, 101);
    }

    function test_LogCleanup_AcceptsBoundaryScores() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 0);
        assertEq(logContract.currentScore(alice), 0);

        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);
        assertEq(logContract.currentScore(alice), 100);
        assertEq(logContract.historyLength(alice), 2);
    }

    function test_GetHistoryPage_Pagination() public {
        vm.startPrank(alice);
        for (uint256 i = 0; i < 5; i++) {
            logContract.logCleanup(spender, token, i * 10);
        }
        vm.stopPrank();

        WalletDoctorLog.CleanupEvent[] memory page = logContract.getHistoryPage(alice, 1, 2);
        assertEq(page.length, 2);
        assertEq(page[0].scoreAfter, 10);
        assertEq(page[1].scoreAfter, 20);

        WalletDoctorLog.CleanupEvent[] memory empty = logContract.getHistoryPage(alice, 99, 5);
        assertEq(empty.length, 0);

        WalletDoctorLog.CleanupEvent[] memory tail = logContract.getHistoryPage(alice, 3, 10);
        assertEq(tail.length, 2);
        assertEq(tail[0].scoreAfter, 30);
        assertEq(tail[1].scoreAfter, 40);
    }

    function test_HistoryIsPerWallet() public {
        address bob = makeAddr("bob");

        vm.prank(alice);
        logContract.logCleanup(spender, token, 50);

        vm.prank(bob);
        logContract.logCleanup(spender, token, 80);

        assertEq(logContract.currentScore(alice), 50);
        assertEq(logContract.currentScore(bob), 80);
        assertEq(logContract.historyLength(alice), 1);
        assertEq(logContract.historyLength(bob), 1);
    }
}
