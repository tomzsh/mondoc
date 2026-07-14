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
        assertEq(logContract.cleanupCount(alice), 1);

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

    function test_LogCleanup_RevertsZeroAddress() public {
        vm.prank(alice);
        vm.expectRevert(WalletDoctorLog.ZeroAddress.selector);
        logContract.logCleanup(address(0), token, 50);

        vm.prank(alice);
        vm.expectRevert(WalletDoctorLog.ZeroAddress.selector);
        logContract.logCleanup(spender, address(0), 50);
    }

    function test_LogCleanup_AcceptsBoundaryScores() public {
        vm.prank(alice);
        logContract.logCleanup(spender, token, 0);
        assertEq(logContract.currentScore(alice), 0);

        vm.prank(alice);
        logContract.logCleanup(spender, token, 100);
        assertEq(logContract.currentScore(alice), 100);
        assertEq(logContract.historyLength(alice), 2);
        assertEq(logContract.cleanupCount(alice), 2);
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

    function test_GetHistoryPage_RevertsOnHugeLimit() public {
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorLog.PageLimitTooHigh.selector, 51, 50)
        );
        logContract.getHistoryPage(alice, 0, 51);
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

    function test_Version() public view {
        assertEq(logContract.VERSION(), 3);
    }

    function test_BatchLogCleanup_RecordsAllAndSingleScore() public {
        address spender2 = makeAddr("spender2");
        address token2 = makeAddr("token2");

        address[] memory spenders = new address[](3);
        address[] memory tokens = new address[](3);
        spenders[0] = spender;
        spenders[1] = spender2;
        spenders[2] = spender;
        tokens[0] = token;
        tokens[1] = token2;
        tokens[2] = token2;

        vm.prank(alice);
        logContract.batchLogCleanup(spenders, tokens, 88);

        assertEq(logContract.currentScore(alice), 88);
        assertEq(logContract.historyLength(alice), 3);
        assertEq(logContract.cleanupCount(alice), 3);

        WalletDoctorLog.CleanupEvent[] memory page = logContract.getHistoryPage(alice, 0, 10);
        assertEq(page.length, 3);
        assertEq(page[0].scoreAfter, 88);
        assertEq(page[2].token, token2);
    }

    function test_BatchLogCleanup_RevertsEmpty() public {
        address[] memory spenders = new address[](0);
        address[] memory tokens = new address[](0);
        vm.prank(alice);
        vm.expectRevert(WalletDoctorLog.EmptyBatch.selector);
        logContract.batchLogCleanup(spenders, tokens, 50);
    }

    function test_BatchLogCleanup_RevertsLengthMismatch() public {
        address[] memory spenders = new address[](2);
        address[] memory tokens = new address[](1);
        spenders[0] = spender;
        spenders[1] = spender;
        tokens[0] = token;
        vm.prank(alice);
        vm.expectRevert(WalletDoctorLog.LengthMismatch.selector);
        logContract.batchLogCleanup(spenders, tokens, 50);
    }

    function test_BatchLogCleanup_RevertsTooLarge() public {
        uint256 n = logContract.MAX_BATCH() + 1;
        address[] memory spenders = new address[](n);
        address[] memory tokens = new address[](n);
        for (uint256 i = 0; i < n; i++) {
            spenders[i] = spender;
            tokens[i] = token;
        }
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(WalletDoctorLog.BatchTooLarge.selector, n, 25)
        );
        logContract.batchLogCleanup(spenders, tokens, 50);
    }

    function test_BatchLogCleanup_EmitsBatchEvent() public {
        address[] memory spenders = new address[](2);
        address[] memory tokens = new address[](2);
        spenders[0] = spender;
        spenders[1] = spender;
        tokens[0] = token;
        tokens[1] = token;

        vm.expectEmit(true, false, false, true);
        emit WalletDoctorLog.BatchCleanupLogged(alice, 2, 91, block.timestamp);
        vm.expectEmit(true, false, false, true);
        emit WalletDoctorLog.ScoreUpdated(alice, 91);

        vm.prank(alice);
        logContract.batchLogCleanup(spenders, tokens, 91);
    }
}
