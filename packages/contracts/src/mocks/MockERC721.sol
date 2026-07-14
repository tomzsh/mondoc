// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Minimal ERC-721 for MonDoc revoke demos (testnet only).
contract MockERC721 {
    string public name;
    string public symbol;

    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) public balanceOf;
    mapping(uint256 => address) public getApproved;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    uint256 public nextTokenId = 1;

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;
    }

    function mint(address to) external returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _ownerOf[tokenId] = to;
        balanceOf[to] += 1;
        emit Transfer(address(0), to, tokenId);
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address o = _ownerOf[tokenId];
        require(o != address(0), "none");
        return o;
    }

    function approve(address spender, uint256 tokenId) external {
        address o = ownerOf(tokenId);
        require(msg.sender == o || isApprovedForAll[o][msg.sender], "auth");
        getApproved[tokenId] = spender;
        emit Approval(o, spender, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(ownerOf(tokenId) == from, "owner");
        require(
            msg.sender == from || getApproved[tokenId] == msg.sender || isApprovedForAll[from][msg.sender],
            "auth"
        );
        delete getApproved[tokenId];
        unchecked {
            balanceOf[from] -= 1;
            balanceOf[to] += 1;
        }
        _ownerOf[tokenId] = to;
        emit Transfer(from, to, tokenId);
    }
}
