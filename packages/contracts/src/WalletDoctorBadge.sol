// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

interface IWalletDoctorLog {
    function currentScore(address wallet) external view returns (uint256);
}

/// @title WalletDoctorBadge — MonDoc Cleanup Badge (soulbound ERC-721)
/// @notice Optional explicit mint when self-attested score ≥ threshold.
/// @dev Never called by WalletDoctorLog. Frontend must NOT auto-mint after each revoke.
contract WalletDoctorBadge is ERC721 {
    using Strings for uint256;

    IWalletDoctorLog public immutable logContract;
    uint256 public constant SCORE_THRESHOLD = 80;
    uint256 public constant VERSION = 3;

    uint256 private _nextTokenId;
    mapping(address => bool) public hasBadge;
    mapping(address => uint256) public tokenIdOf;
    mapping(uint256 => uint256) public scoreAtMint;

    error ScoreTooLow(uint256 current, uint256 required);
    error AlreadyMinted(address wallet);
    error SoulboundToken();
    error NotWallet();

    event BadgeMinted(address indexed wallet, uint256 indexed tokenId, uint256 scoreAtMint);

    constructor(address logContractAddress) ERC721("MonDoc Cleanup Badge", "MDOC") {
        logContract = IWalletDoctorLog(logContractAddress);
    }

    /// @notice Mint soulbound badge for msg.sender if score ≥ SCORE_THRESHOLD.
    function mintBadge() external {
        _mintFor(msg.sender);
    }

    /// @notice Back-compat: only allows minting for self (`wallet == msg.sender`).
    function mintBadge(address wallet) external {
        if (wallet != msg.sender) revert NotWallet();
        _mintFor(wallet);
    }

    function _mintFor(address wallet) internal {
        uint256 score = logContract.currentScore(wallet);
        if (score < SCORE_THRESHOLD) revert ScoreTooLow(score, SCORE_THRESHOLD);
        if (hasBadge[wallet]) revert AlreadyMinted(wallet);

        hasBadge[wallet] = true;
        uint256 tokenId = _nextTokenId++;
        tokenIdOf[wallet] = tokenId;
        scoreAtMint[tokenId] = score;

        _safeMint(wallet, tokenId);
        emit BadgeMinted(wallet, tokenId, score);
    }

    /// @notice ERC-721 metadata (JSON + embedded SVG) as data URI.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 score = scoreAtMint[tokenId];
        string memory scoreStr = score.toString();
        string memory idStr = tokenId.toString();

        string memory image = Base64.encode(bytes(_buildSvg(scoreStr, idStr)));

        string memory json = string.concat(
            '{"name":"MonDoc Badge #',
            idStr,
            '","description":"Soulbound MonDoc cleanup badge on Monad. Score is self-attested via MonDoc Log after the owner revokes risky approvals. Non-transferable.",',
            '"image":"data:image/svg+xml;base64,',
            image,
            '",',
            '"attributes":[',
            '{"trait_type":"scoreAtMint","value":',
            scoreStr,
            "},",
            '{"trait_type":"soulbound","value":"true"},',
            '{"trait_type":"version","value":',
            VERSION.toString(),
            "},",
            '{"trait_type":"network","value":"Monad"},',
            '{"trait_type":"project","value":"MonDoc"}',
            "]}"
        );

        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
    }

    function _buildSvg(string memory scoreStr, string memory idStr) internal pure returns (string memory) {
        // Minimal monochrome clinical badge (research-lab aesthetic)
        return string.concat(
            '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">',
            '<rect width="512" height="512" fill="#0a0a0a"/>',
            '<rect x="24" y="24" width="464" height="464" fill="none" stroke="#f2f2f2" stroke-width="2" opacity="0.35"/>',
            '<circle cx="256" cy="220" r="88" fill="none" stroke="#f2f2f2" stroke-width="3"/>',
            '<path d="M244 172h24v36h36v24h-36v36h-24v-36h-36v-24h36z" fill="#f2f2f2"/>',
            '<text x="256" y="360" text-anchor="middle" fill="#f2f2f2" font-family="ui-monospace,monospace" font-size="28" letter-spacing="6">MONDOC</text>',
            '<text x="256" y="400" text-anchor="middle" fill="#8a8a8a" font-family="ui-monospace,monospace" font-size="18" letter-spacing="3">SCORE ',
            scoreStr,
            "</text>",
            '<text x="256" y="440" text-anchor="middle" fill="#6e6e6e" font-family="ui-monospace,monospace" font-size="14" letter-spacing="2">#',
            idStr,
            " / SOULBOUND</text>",
            "</svg>"
        );
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert SoulboundToken();
        return super._update(to, tokenId, auth);
    }
}
