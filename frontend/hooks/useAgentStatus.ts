'use client';

import { useWatchContractEvent } from 'wagmi';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, HYDRA_ABI, AGENT_NAMES, AGENT_ICONS } from '../lib/constants';

export type AgentStatus = 'idle' | 'analyzing' | 'approved' | 'rejected';

export type AgentVote = {
  agentAddress: string;
  agentName: string;
  agentIcon: string;
  status: AgentStatus;
  reason: string;
  riskScore: number;
  blockNumber?: bigint;
};

export function useAgentStatus(txId: bigint | null) {
  const [votes, setVotes] = useState<Record<string, AgentVote>>({});

  // Reset votes when txId changes
  useEffect(() => {
    setVotes({});
  }, [txId?.toString()]);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    eventName: 'AgentVoted',
    pollingInterval: 1500,
    onLogs(logs) {
      logs.forEach((log) => {
        if (log.args.txId !== txId) return;
        const addr = (log.args.agent as string).toLowerCase();
        setVotes((prev) => ({
          ...prev,
          [addr]: {
            agentAddress: addr,
            agentName: AGENT_NAMES[addr] || `Agent ${addr.slice(0, 6)}...`,
            agentIcon: AGENT_ICONS[addr] || '🤖',
            status: log.args.approved ? 'approved' : 'rejected',
            reason: (log.args.reason as string) || '',
            riskScore: Number(log.args.riskScore ?? 0),
            blockNumber: log.blockNumber ?? undefined,
          },
        }));
      });
    },
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    eventName: 'TransactionExecuted',
    pollingInterval: 1500,
    onLogs() {}, // just triggers re-render via parent
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    eventName: 'TransactionRejected',
    pollingInterval: 1500,
    onLogs() {},
  });

  return Object.values(votes);
}
