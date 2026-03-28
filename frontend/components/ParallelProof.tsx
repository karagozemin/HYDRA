'use client';

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { parseAbiItem } from 'viem';
import { CONTRACT_ADDRESS, AGENT_NAMES } from '../lib/constants';

interface VoteLog {
  agent: string;
  blockNumber: bigint;
  txHash: string;
}

interface ParallelProofProps {
  txId: bigint;
}

export function ParallelProof({ txId }: ParallelProofProps) {
  const publicClient = usePublicClient();
  const [voteLogs, setVoteLogs] = useState<VoteLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicClient || !txId) return;

    const fetchLogs = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem('event AgentVoted(uint256 indexed txId, address indexed agent, bool approved, string reason, uint256 riskScore)'),
          args: { txId },
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        setVoteLogs(
          logs.map(log => ({
            agent: log.args.agent as string,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
          }))
        );
      } catch {
        setVoteLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [publicClient, txId]);

  if (loading || voteLogs.length === 0) return null;

  const blocks = voteLogs.map(v => v.blockNumber);
  const allSameBlock = blocks.every(b => b === blocks[0]);

  return (
    <div className={`rounded-xl border p-4 animate-fade-in space-y-3 ${
      allSameBlock
        ? 'bg-purple-900/10 border-purple-800'
        : 'bg-gray-900/50 border-gray-800'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-sm">⚡</span>
        <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
          {allSameBlock ? 'Parallel Execution Proven' : 'Vote Blocks'}
        </span>
      </div>

      {allSameBlock && (
        <div className="text-xs text-gray-500 font-mono">
          All 3 votes landed in block #{blocks[0].toString()} — Monad parallel EVM
        </div>
      )}

      <div className="space-y-1.5">
        {voteLogs.map((log, i) => {
          const name = AGENT_NAMES[log.agent.toLowerCase()] || `Agent ${i + 1}`;
          return (
            <div key={i} className="flex items-center justify-between text-xs font-mono">
              <span className="text-gray-400">{name}</span>
              <div className="flex items-center gap-3">
                <span className={`${allSameBlock ? 'text-purple-400' : 'text-gray-500'}`}>
                  block #{log.blockNumber.toString()}
                </span>
                <a
                  href={`https://testnet.monadexplorer.com/tx/${log.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 transition"
                >
                  tx ↗
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
