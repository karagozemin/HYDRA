// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {HydraGuard} from "../src/HydraGuard.sol";

contract HydraGuardTest is Test {
    HydraGuard public guard;

    address owner = makeAddr("owner");
    address agent1 = makeAddr("agent1"); // Security
    address agent2 = makeAddr("agent2"); // Risk
    address agent3 = makeAddr("agent3"); // Portfolio
    address target = makeAddr("target");
    address attacker = makeAddr("attacker");

    event TransactionSubmitted(uint256 indexed txId, address indexed to, uint256 value, address indexed submittedBy);
    event AgentVoted(uint256 indexed txId, address indexed agent, bool approved, string reason, uint256 riskScore);
    event TransactionExecuted(uint256 indexed txId);
    event TransactionRejected(uint256 indexed txId);

    function setUp() public {
        guard = new HydraGuard(owner, agent1, agent2, agent3);
        // Fund contract with MON for execute tests
        vm.deal(address(guard), 10 ether);
        vm.deal(owner, 10 ether);
    }

    // ─── Submit Tests ───────────────────────────────────────────────────────

    function testSubmitTransaction() public {
        vm.prank(owner);
        vm.expectEmit(true, true, false, true);
        emit TransactionSubmitted(1, target, 1 ether, owner);
        uint256 txId = guard.submitTransaction(target, 1 ether, "");
        assertEq(txId, 1);
        assertEq(guard.txCount(), 1);
    }

    function testSubmitIncrementsCounter() public {
        vm.startPrank(owner);
        guard.submitTransaction(target, 0, "");
        guard.submitTransaction(target, 0, "");
        guard.submitTransaction(target, 0, "");
        vm.stopPrank();
        assertEq(guard.txCount(), 3);
    }

    function testOnlyOwnerCanSubmit() public {
        vm.prank(attacker);
        vm.expectRevert("HydraGuard: not owner");
        guard.submitTransaction(target, 0, "");
    }

    // ─── Vote Tests ─────────────────────────────────────────────────────────

    function testAgentVote() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        vm.prank(agent1);
        vm.expectEmit(true, true, false, true);
        emit AgentVoted(txId, agent1, true, "Verified contract", 20);
        guard.agentVote(txId, true, "Verified contract", 20);

        (bool hasVoted, bool approve, string memory reason, uint256 riskScore) = guard.getVote(txId, agent1);
        assertTrue(hasVoted);
        assertTrue(approve);
        assertEq(reason, "Verified contract");
        assertEq(riskScore, 20);
    }

    function testOnlyAgentCanVote() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        vm.prank(attacker);
        vm.expectRevert("HydraGuard: not agent");
        guard.agentVote(txId, true, "hack", 0);
    }

    function testDoubleVoteReverts() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        vm.startPrank(agent1);
        guard.agentVote(txId, true, "first", 10);
        vm.expectRevert("HydraGuard: already voted");
        guard.agentVote(txId, true, "second", 10);
        vm.stopPrank();
    }

    // ─── Threshold Tests ────────────────────────────────────────────────────

    function testThresholdExecution() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 1 ether, "");

        // 2 approve, 1 reject
        vm.prank(agent1);
        guard.agentVote(txId, true, "looks good", 15);
        vm.prank(agent2);
        guard.agentVote(txId, true, "liquidity ok", 25);
        vm.prank(agent3);
        guard.agentVote(txId, false, "over-concentrated", 60);

        assertTrue(guard.canExecute(txId));

        uint256 targetBefore = target.balance;
        vm.prank(owner);
        vm.expectEmit(true, false, false, false);
        emit TransactionExecuted(txId);
        guard.executeTransaction(txId);

        assertEq(target.balance, targetBefore + 1 ether);
        (,, bool executed,,, ) = guard.getTransaction(txId);
        assertTrue(executed);
    }

    function testParallelVotes() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        // All 3 vote (simulating parallel — in Monad these land in the same block)
        vm.prank(agent1);
        guard.agentVote(txId, true, "Security: clean contract", 10);
        vm.prank(agent2);
        guard.agentVote(txId, true, "Risk: liquidity sufficient", 20);
        vm.prank(agent3);
        guard.agentVote(txId, true, "Portfolio: within tolerance", 15);

        (,,, , uint256 approvalCount,) = guard.getTransaction(txId);
        assertEq(approvalCount, 3);
    }

    // ─── Rejection Tests ────────────────────────────────────────────────────

    function testRejectionBlock() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        // 2 reject → auto-rejected
        vm.prank(agent1);
        guard.agentVote(txId, false, "Scam detected", 95);

        vm.prank(agent2);
        vm.expectEmit(true, false, false, false);
        emit TransactionRejected(txId);
        guard.agentVote(txId, false, "No liquidity", 85);

        (,, , bool rejected,,) = guard.getTransaction(txId);
        assertTrue(rejected);

        // Cannot execute
        vm.prank(owner);
        vm.expectRevert("HydraGuard: already rejected");
        guard.executeTransaction(txId);
    }

    function testCannotExecuteWithoutThreshold() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        vm.prank(agent1);
        guard.agentVote(txId, true, "approved", 20);
        // Only 1 approval, need 2

        vm.prank(owner);
        vm.expectRevert("HydraGuard: insufficient approvals");
        guard.executeTransaction(txId);
    }

    // ─── Edge Cases ─────────────────────────────────────────────────────────

    function testAgentReputation() public {
        vm.prank(owner);
        uint256 txId = guard.submitTransaction(target, 0, "");

        vm.prank(agent1);
        guard.agentVote(txId, true, "approved", 20);

        assertEq(guard.agentReputation(agent1), 1);
        assertEq(guard.agentReputation(agent2), 0);
    }

    function testGetAgents() public view {
        address[3] memory agentList = guard.getAgents();
        assertEq(agentList[0], agent1);
        assertEq(agentList[1], agent2);
        assertEq(agentList[2], agent3);
    }

    function testContractReceivesEther() public {
        (bool ok,) = address(guard).call{value: 1 ether}("");
        assertTrue(ok);
    }
}
