// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IWalletDoctorLog {
    function currentScore(address wallet) external view returns (uint256);
}

/// @title WalletDoctorBadge
/// @notice Mint badge ERC-721 non-transferable sebagai bukti onchain
///         bahwa sebuah wallet pernah mencapai skor kesehatan minimum.
contract WalletDoctorBadge is ERC721, Ownable {
    IWalletDoctorLog public immutable logContract;
    uint256 public constant SCORE_THRESHOLD = 80;

    uint256 private _nextTokenId;
    mapping(address => bool) public hasBadge;

    error ScoreTooLow(uint256 current, uint256 required);
    error AlreadyMinted(address wallet);
    error SoulboundToken();

    event BadgeMinted(address indexed wallet, uint256 indexed tokenId, uint256 scoreAtMint);

    constructor(address logContractAddress)
        ERC721("Wallet Doctor Cleanup Badge", "WDCB")
        Ownable(msg.sender)
    {
        logContract = IWalletDoctorLog(logContractAddress);
    }

    /// @notice Mint badge untuk `wallet` jika skornya sudah memenuhi threshold.
    ///         Siapa pun boleh memicu (misal frontend user sendiri), karena
    ///         hasil mint selalu ke `wallet` — tidak bisa disalahgunakan ke alamat lain.
    function mintBadge(address wallet) external {
        uint256 score = logContract.currentScore(wallet);
        if (score < SCORE_THRESHOLD) revert ScoreTooLow(score, SCORE_THRESHOLD);
        if (hasBadge[wallet]) revert AlreadyMinted(wallet);

        hasBadge[wallet] = true;
        uint256 tokenId = _nextTokenId++;
        _safeMint(wallet, tokenId);

        emit BadgeMinted(wallet, tokenId, score);
    }

    /// @dev Badge dibuat soulbound (non-transferable) supaya benar-benar
    ///      merepresentasikan riwayat wallet itu sendiri, bukan bisa diperjualbelikan.
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
