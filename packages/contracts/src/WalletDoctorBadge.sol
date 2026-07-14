// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

interface IWalletDoctorLog {
    function currentScore(address wallet) external view returns (uint256);
}

/// @title WalletDoctorBadge (hackathon v2)
/// @notice Soulbound ERC-721 minted when self-attested score ≥ threshold.
/// @dev Mint only by the wallet itself. Stores scoreAtMint for dashboard reads.
contract WalletDoctorBadge is ERC721 {
    using Strings for uint256;

    IWalletDoctorLog public immutable logContract;
    uint256 public constant SCORE_THRESHOLD = 80;
    uint256 public constant VERSION = 2;

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

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        uint256 score = scoreAtMint[tokenId];
        string memory name = string.concat("MonDoc Badge #", tokenId.toString());
        string memory description =
            "Soulbound MonDoc cleanup badge on Monad. Score is self-attested via MonDoc Log (hackathon demo).";
        string memory json = string.concat(
            '{"name":"',
            name,
            '","description":"',
            description,
            '","attributes":[{"trait_type":"scoreAtMint","value":',
            score.toString(),
            '},{"trait_type":"soulbound","value":"true"},{"trait_type":"version","value":2}]}'
        );
        return string.concat("data:application/json;base64,", Base64.encode(bytes(json)));
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
