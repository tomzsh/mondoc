// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WalletDoctorLog (v3)
/// @notice Onchain **self-attested** cleanup log. Does not custody tokens.
/// @dev Score is reported by the wallet after client-side revoke(s).
///      Never mints badges — badge is a separate optional mint.
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
    /// @dev Cap batch size (Monad gas_limit billing — keep batches tight).
    uint256 public constant MAX_BATCH = 25;
    uint256 public constant VERSION = 3;

    mapping(address => CleanupEvent[]) private _history;
    mapping(address => uint256) public currentScore;
    /// @dev Number of cleanups logged (cheaper than reading array length off-chain repeatedly).
    mapping(address => uint256) public cleanupCount;

    error ScoreOutOfRange(uint256 given, uint256 max);
    error ZeroAddress();
    error PageLimitTooHigh(uint256 given, uint256 max);
    error EmptyBatch();
    error BatchTooLarge(uint256 given, uint256 max);
    error LengthMismatch();

    event CleanupLogged(
        address indexed wallet,
        address indexed spender,
        address indexed token,
        uint256 scoreAfter,
        uint256 timestamp
    );
    event ScoreUpdated(address indexed wallet, uint256 newScore);
    /// @notice Emitted once per batchLogCleanup with how many pairs were recorded.
    event BatchCleanupLogged(
        address indexed wallet,
        uint256 count,
        uint256 scoreAfter,
        uint256 timestamp
    );

    /// @notice Record a single cleanup attestation for msg.sender only.
    /// @dev Does **not** mint a badge. Optional badge mint is on WalletDoctorBadge.
    function logCleanup(address spender, address token, uint256 newScore) external {
        if (spender == address(0) || token == address(0)) revert ZeroAddress();
        if (newScore > MAX_SCORE) revert ScoreOutOfRange(newScore, MAX_SCORE);

        _push(msg.sender, spender, token, newScore);
        currentScore[msg.sender] = newScore;

        emit CleanupLogged(msg.sender, spender, token, newScore, block.timestamp);
        emit ScoreUpdated(msg.sender, newScore);
    }

    /// @notice Batch-record multiple revokes in **one** tx (one score write).
    /// @dev Use after multi-revoke so users do not pay N× logCleanup.
    ///      Does **not** mint a badge.
    /// @param spenders Spenders that were revoked (parallel to tokens).
    /// @param tokens Token contracts related to each approval.
    /// @param finalScore Client-computed health score after all revokes (0–100).
    function batchLogCleanup(
        address[] calldata spenders,
        address[] calldata tokens,
        uint256 finalScore
    ) external {
        uint256 n = spenders.length;
        if (n == 0) revert EmptyBatch();
        if (n != tokens.length) revert LengthMismatch();
        if (n > MAX_BATCH) revert BatchTooLarge(n, MAX_BATCH);
        if (finalScore > MAX_SCORE) revert ScoreOutOfRange(finalScore, MAX_SCORE);

        address wallet = msg.sender;
        uint256 ts = block.timestamp;

        for (uint256 i = 0; i < n; ) {
            address spender = spenders[i];
            address token = tokens[i];
            if (spender == address(0) || token == address(0)) revert ZeroAddress();

            _history[wallet].push(
                CleanupEvent({
                    spender: spender,
                    token: token,
                    timestamp: ts,
                    scoreAfter: finalScore
                })
            );
            emit CleanupLogged(wallet, spender, token, finalScore, ts);

            unchecked {
                ++i;
            }
        }

        unchecked {
            cleanupCount[wallet] += n;
        }
        currentScore[wallet] = finalScore;

        emit BatchCleanupLogged(wallet, n, finalScore, ts);
        emit ScoreUpdated(wallet, finalScore);
    }

    function _push(address wallet, address spender, address token, uint256 newScore) internal {
        _history[wallet].push(
            CleanupEvent({
                spender: spender,
                token: token,
                timestamp: block.timestamp,
                scoreAfter: newScore
            })
        );
        unchecked {
            cleanupCount[wallet] += 1;
        }
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
