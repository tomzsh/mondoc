// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WalletDoctorLog (hackathon v2)
/// @notice Onchain **self-attested** cleanup log. Does not custody tokens.
/// @dev Score is reported by the wallet after a client-side revoke — not a
///      cryptographic proof of full wallet health. Suitable for demos / attestations.
contract WalletDoctorLog {
    struct CleanupEvent {
        address spender;
        address token;
        uint256 timestamp;
        uint256 scoreAfter;
    }

    uint256 public constant MAX_SCORE = 100;
    /// @dev Prevents accidental huge view pagination gas on RPC.
    uint256 public constant MAX_PAGE_LIMIT = 50;
    uint256 public constant VERSION = 2;

    mapping(address => CleanupEvent[]) private _history;
    mapping(address => uint256) public currentScore;
    /// @dev Number of cleanups logged (cheaper than reading array length off-chain repeatedly).
    mapping(address => uint256) public cleanupCount;

    error ScoreOutOfRange(uint256 given, uint256 max);
    error ZeroAddress();
    error PageLimitTooHigh(uint256 given, uint256 max);

    event CleanupLogged(
        address indexed wallet,
        address indexed spender,
        address indexed token,
        uint256 scoreAfter,
        uint256 timestamp
    );
    event ScoreUpdated(address indexed wallet, uint256 newScore);

    /// @notice Record a cleanup attestation for msg.sender only.
    /// @param spender Spender that was revoked (must be non-zero).
    /// @param token Token contract related to the approval (must be non-zero).
    /// @param newScore Client-computed health score after revoke (0–100).
    function logCleanup(address spender, address token, uint256 newScore) external {
        if (spender == address(0) || token == address(0)) revert ZeroAddress();
        if (newScore > MAX_SCORE) revert ScoreOutOfRange(newScore, MAX_SCORE);

        _history[msg.sender].push(
            CleanupEvent({
                spender: spender,
                token: token,
                timestamp: block.timestamp,
                scoreAfter: newScore
            })
        );
        unchecked {
            cleanupCount[msg.sender] += 1;
        }
        currentScore[msg.sender] = newScore;

        emit CleanupLogged(msg.sender, spender, token, newScore, block.timestamp);
        emit ScoreUpdated(msg.sender, newScore);
    }

    function historyLength(address wallet) external view returns (uint256) {
        return _history[wallet].length;
    }

    /// @notice Paginated history read. `limit` capped at MAX_PAGE_LIMIT.
    function getHistoryPage(
        address wallet,
        uint256 offset,
        uint256 limit
    ) external view returns (CleanupEvent[] memory page) {
        if (limit > MAX_PAGE_LIMIT) revert PageLimitTooHigh(limit, MAX_PAGE_LIMIT);

        CleanupEvent[] storage full = _history[wallet];
        uint256 total = full.length;
        if (offset >= total) return new CleanupEvent[](0);

        uint256 end = offset + limit > total ? total : offset + limit;
        page = new CleanupEvent[](end - offset);
        for (uint256 i = offset; i < end; ) {
            page[i - offset] = full[i];
            unchecked {
                ++i;
            }
        }
    }
}
