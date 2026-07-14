// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockERC721} from "../src/mocks/MockERC721.sol";

/// @notice Deploy mock tokens + seed approvals so MonDoc Scan/Revoke can be demoed.
/// @dev Uses PRIVATE_KEY from env. Optional TARGET_WALLET (defaults to deployer).
contract SeedTestApprovals is Script {
    // Known router (medium risk when unlimited)
    address constant KNOWN_SPENDER = 0x3012E9049d05B4B5369D690114D5A5861EbB85cb; // Atlantis · SwapRouter
    // Fake phishing contract (high risk when unlimited)
    address constant UNKNOWN_SPENDER = 0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF;
    // Another unknown operator for NFT
    address constant UNKNOWN_OPERATOR = 0xb0B0000000000000000000000000000000000001;
    // Limited allowance target
    address constant LIMITED_SPENDER = 0x1111111111111111111111111111111111111111;

    function run() external {
        uint256 key = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(key);
        address wallet = vm.envOr("TARGET_WALLET", deployer);

        console2.log("Deployer:", deployer);
        console2.log("Test wallet (owner of approvals):", wallet);

        vm.startBroadcast(key);

        MockERC20 tokenA = new MockERC20("MonDoc USD", "mdUSD");
        MockERC20 tokenB = new MockERC20("MonDoc ETH", "mdETH");
        MockERC721 nft = new MockERC721("MonDoc NFT", "mdNFT");

        // Fund the test wallet with balances (not required for revoke, but realistic)
        tokenA.mint(wallet, 1_000_000 ether);
        tokenB.mint(wallet, 500 ether);
        nft.mint(wallet);
        nft.mint(wallet);

        // Approvals must be signed by the owner. If TARGET_WALLET != deployer,
        // we only mint; approvals are created when wallet == deployer.
        if (wallet == deployer) {
            // 1) Unlimited + unknown spender → HIGH risk
            tokenA.approve(UNKNOWN_SPENDER, type(uint256).max);

            // 2) Unlimited + known DEX router → MEDIUM risk
            tokenA.approve(KNOWN_SPENDER, type(uint256).max);
            tokenB.approve(KNOWN_SPENDER, type(uint256).max);

            // 3) Limited amount → LOW risk
            tokenB.approve(LIMITED_SPENDER, 100 ether);

            // 4) NFT ApprovalForAll → HIGH (unknown operator)
            nft.setApprovalForAll(UNKNOWN_OPERATOR, true);

            // 5) NFT ApprovalForAll → MEDIUM-ish (known marketplace-like)
            nft.setApprovalForAll(KNOWN_SPENDER, true);
        } else {
            console2.log("NOTE: TARGET_WALLET != deployer. Tokens minted only.");
            console2.log("Connect TARGET_WALLET and call approve manually, or set TARGET_WALLET=deployer.");
        }

        vm.stopBroadcast();

        console2.log("--- Seed complete ---");
        console2.log("MockERC20 wdUSD:", address(tokenA));
        console2.log("MockERC20 wdETH:", address(tokenB));
        console2.log("MockERC721 wdNFT:", address(nft));
        console2.log("Open MonDoc Scan (All history) with wallet:", wallet);
    }
}
