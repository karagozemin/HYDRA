// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HydraGuard
 * @notice Parallel AI Agent Multisig Wallet on Monad
 * @dev 3 independent AI agents vote on transactions. All 3 votes land in the same Monad block
 *      because votes[txId][agent1], votes[txId][agent2], votes[txId][agent3] are independent
 *      storage slots — zero slot-level contention, true parallel execution.
 */
contract HydraGuard {
    // ─────────────────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────────────────

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        bool rejected;
        uint256 approvalCount;
        uint256 rejectionCount;
        uint256 submittedAt;
        address submittedBy;
    }

    struct Vote {
        bool hasVoted;
        bool approve;
        string reason;
        uint256 riskScore;
        uint256 timestamp;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // State
    // ─────────────────────────────────────────────────────────────────────────

    address public owner;
    address[3] public agents;
    uint256 public txCount;
    uint256 public constant THRESHOLD = 2; // 2-of-3 majority

    /// @dev txId → Transaction
    mapping(uint256 => Transaction) public transactions;

    /// @dev txId → agentAddress → Vote
    /// These are INDEPENDENT storage slots — Monad parallel execution has zero contention
    mapping(uint256 => mapping(address => Vote)) public votes;

    /// @dev agent → reputation score (incremented on correct votes)
    mapping(address => uint256) public agentReputation;

    mapping(address => bool) public isAgent;

    // ─────────────────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────────────────

    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value, address indexed submittedBy);
    event AgentVoted(uint256 indexed txId, address indexed agent, bool approved, string reason, uint256 riskScore);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionRejected(uint256 indexed txId);

    // ─────────────────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "HydraGuard: not owner");
        _;
    }

    modifier onlyAgent() {
        require(isAgent[msg.sender], "HydraGuard: not agent");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "HydraGuard: already executed");
        require(!transactions[txId].rejected, "HydraGuard: already rejected");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId > 0 && txId <= txCount, "HydraGuard: tx does not exist");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────────────────

    constructor(address _owner, address _agent1, address _agent2, address _agent3) {
        require(_owner != address(0), "HydraGuard: zero owner");
        require(_agent1 != address(0) && _agent2 != address(0) && _agent3 != address(0), "HydraGuard: zero agent");

        owner = _owner;
        agents[0] = _agent1;
        agents[1] = _agent2;
        agents[2] = _agent3;

        isAgent[_agent1] = true;
        isAgent[_agent2] = true;
        isAgent[_agent3] = true;
    }

    /// @dev Contract must be able to receive MON to forward in executeTransaction
    receive() external payable {}

    // ─────────────────────────────────────────────────────────────────────────
    // Core Functions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Owner submits a transaction for agent review
     * @param to Target address
     * @param value MON value to send
     * @param data Calldata (0x for simple transfers)
     * @return txId The new transaction ID
     */
    function submitTransaction(address to, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (uint256 txId)
    {
        require(to != address(0), "HydraGuard: zero target");

        txCount++;
        txId = txCount;

        transactions[txId] = Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            rejected: false,
            approvalCount: 0,
            rejectionCount: 0,
            submittedAt: block.timestamp,
            submittedBy: msg.sender
        });

        emit TransactionSubmitted(txId, to, value, msg.sender);
    }

    /**
     * @notice Agent casts their vote on a transaction
     * @dev Each agent writes to votes[txId][agentAddress] — independent slots.
     *      On Monad, all 3 agents can vote in the SAME BLOCK with zero contention.
     * @param txId Transaction ID to vote on
     * @param approve True to approve, false to reject
     * @param reason Human-readable reason from AI analysis
     * @param riskScore Risk score 0-100 from AI analysis
     */
    function agentVote(uint256 txId, bool approve, string calldata reason, uint256 riskScore)
        external
        onlyAgent
        txExists(txId)
        notExecuted(txId)
    {
        require(!votes[txId][msg.sender].hasVoted, "HydraGuard: already voted");
        require(riskScore <= 100, "HydraGuard: invalid risk score");

        votes[txId][msg.sender] = Vote({
            hasVoted: true,
            approve: approve,
            reason: reason,
            riskScore: riskScore,
            timestamp: block.timestamp
        });

        if (approve) {
            transactions[txId].approvalCount++;
            agentReputation[msg.sender]++;
        } else {
            transactions[txId].rejectionCount++;
        }

        emit AgentVoted(txId, msg.sender, approve, reason, riskScore);

        _tryResolve(txId);
    }

    /**
     * @notice Execute a transaction that has reached approval threshold
     * @dev Owner calls this after sufficient agent approvals
     */
    function executeTransaction(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage txn = transactions[txId];
        require(txn.approvalCount >= THRESHOLD, "HydraGuard: insufficient approvals");

        txn.executed = true;

        (bool success,) = txn.to.call{value: txn.value}(txn.data);
        require(success, "HydraGuard: execution failed");

        emit TransactionExecuted(txId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // View Functions
    // ─────────────────────────────────────────────────────────────────────────

    function getTransaction(uint256 txId)
        external
        view
        returns (
            address to,
            uint256 value,
            bool executed,
            bool rejected,
            uint256 approvalCount,
            uint256 rejectionCount
        )
    {
        Transaction storage txn = transactions[txId];
        return (txn.to, txn.value, txn.executed, txn.rejected, txn.approvalCount, txn.rejectionCount);
    }

    function getVote(uint256 txId, address agent)
        external
        view
        returns (bool hasVoted, bool approve, string memory reason, uint256 riskScore)
    {
        Vote storage v = votes[txId][agent];
        return (v.hasVoted, v.approve, v.reason, v.riskScore);
    }

    function getAgents() external view returns (address[3] memory) {
        return agents;
    }

    function canExecute(uint256 txId) external view returns (bool) {
        Transaction storage txn = transactions[txId];
        return !txn.executed && !txn.rejected && txn.approvalCount >= THRESHOLD;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal
    // ─────────────────────────────────────────────────────────────────────────

    function _tryResolve(uint256 txId) internal {
        Transaction storage txn = transactions[txId];
        // If more than 1 rejection (i.e. 2+ agents rejected), it can never reach threshold
        if (txn.rejectionCount > (agents.length - THRESHOLD)) {
            txn.rejected = true;
            emit TransactionRejected(txId);
        }
    }
}
