// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title WalletDoctorLog
/// @notice Mencatat riwayat cleanup approval sebuah wallet secara onchain.
///         Kontrak ini tidak pernah menerima/mentransfer token — read & log only.
contract WalletDoctorLog {
    struct CleanupEvent {
        address spender;
        address token;
        uint256 timestamp;
        uint256 scoreAfter;
    }

    /// @dev Batas atas skor untuk mencegah input di luar rentang wajar.
    uint256 public constant MAX_SCORE = 100;

    mapping(address => CleanupEvent[]) private _history;
    mapping(address => uint256) public currentScore;

    error ScoreOutOfRange(uint256 given, uint256 max);

    event CleanupLogged(
        address indexed wallet,
        address indexed spender,
        address indexed token,
        uint256 scoreAfter,
        uint256 timestamp
    );
    event ScoreUpdated(address indexed wallet, uint256 newScore);

    /// @notice Dipanggil frontend setelah tx revoke sukses, untuk mencatat hasilnya.
    /// @param spender  Alamat kontrak yang allowance-nya baru saja dicabut.
    /// @param token    Alamat token (ERC-20/721/1155) terkait.
    /// @param newScore Skor kesehatan wallet setelah revoke, dihitung di frontend (0–100).
    function logCleanup(address spender, address token, uint256 newScore) external {
        if (newScore > MAX_SCORE) revert ScoreOutOfRange(newScore, MAX_SCORE);

        _history[msg.sender].push(
            CleanupEvent({
                spender: spender,
                token: token,
                timestamp: block.timestamp,
                scoreAfter: newScore
            })
        );
        currentScore[msg.sender] = newScore;

        emit CleanupLogged(msg.sender, spender, token, newScore, block.timestamp);
        emit ScoreUpdated(msg.sender, newScore);
    }

    /// @notice Jumlah cleanup event yang tercatat untuk sebuah wallet.
    function historyLength(address wallet) external view returns (uint256) {
        return _history[wallet].length;
    }

    /// @notice Ambil sebagian riwayat dengan pagination, hindari gas/limit issue
    ///         kalau riwayat sudah panjang.
    function getHistoryPage(
        address wallet,
        uint256 offset,
        uint256 limit
    ) external view returns (CleanupEvent[] memory page) {
        CleanupEvent[] storage full = _history[wallet];
        uint256 total = full.length;
        if (offset >= total) return new CleanupEvent[](0);

        uint256 end = offset + limit > total ? total : offset + limit;
        page = new CleanupEvent[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            page[i - offset] = full[i];
        }
    }
}
