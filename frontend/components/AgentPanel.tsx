'use client';

import { useState, useEffect } from 'react';
import { AgentCard, AgentStatus } from './AgentCard';
import { useGetVote, useCanExecute, useHydraContract } from '../hooks/useHydraContract';
import { useReadContract } from 'wagmi';
import { AGENT1_ADDRESS, AGENT2_ADDRESS, AGENT3_ADDRESS, CONTRACT_ADDRESS, HYDRA_ABI } from '../lib/constants';

interface AgentPanelProps {
  txId: bigint | null;
  isSubmitting: boolean;
}

interface AgentResult {
  status: AgentStatus;
  reason?: string;
  riskScore?: number;
}

function useAgentVote(txId: bigint | null, address: `0x${string}`, txResolved: boolean): AgentResult {
  const { data } = useGetVote(txId, address);
  if (!txId) return { status: 'idle' };
  if (!data || !data[0]) {
    // If tx is already resolved (rejected/executed) but this agent didn't vote, it was skipped
    if (txResolved) return { status: 'rejected', reason: 'Vote skipped — transaction already resolved.', riskScore: 0 };
    return { status: 'analyzing' };
  }
  return {
    status: data[1] ? 'approved' : 'rejected',
    reason: data[2] as string,
    riskScore: Number(data[3]),
  };
}

export function AgentPanel({ txId, isSubmitting }: AgentPanelProps) {
  const { data: txData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'getTransaction',
    args: txId !== null ? [txId] : undefined,
    query: { enabled: txId !== null, refetchInterval: 3000 },
  });

  const { executeTransaction, isPending: execPending, isConfirming: execConfirming, isSuccess: execSuccess } = useHydraContract();

  const isExecuted = txData ? (txData as any)[2] : false;
  const isRejected = txData ? (txData as any)[3] : false;
  const txResolved = isExecuted || isRejected;

  const security  = useAgentVote(txId, AGENT1_ADDRESS, txResolved);
  const risk      = useAgentVote(txId, AGENT2_ADDRESS, txResolved);
  const portfolio = useAgentVote(txId, AGENT3_ADDRESS, txResolved);

  // Staggered reveal
  const [revealCount, setRevealCount] = useState(0);
  const [prevTxId, setPrevTxId] = useState<bigint | null>(null);

  const realResults = [security, risk, portfolio];
  const readyCount = realResults.filter(v => v.status !== 'idle' && v.status !== 'analyzing').length;

  useEffect(() => {
    if (txId !== prevTxId) {
      setRevealCount(0);
      setPrevTxId(txId);
    }
  }, [txId, prevTxId]);

  useEffect(() => {
    if (readyCount > revealCount) {
      const delay = revealCount === 0 ? 800 : 500 + Math.random() * 400;
      const timer = setTimeout(() => setRevealCount(prev => prev + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [readyCount, revealCount]);

  const displayed: AgentResult[] = realResults.map((result, i) => {
    if (txId === null) return { status: 'idle' as AgentStatus };
    if (i < revealCount && result.status !== 'analyzing' && result.status !== 'idle') {
      return result;
    }
    return { status: 'analyzing' as AgentStatus };
  });

  const allRevealed = revealCount >= 3 && readyCount >= 3;
  const approvals = allRevealed ? realResults.filter(v => v.status === 'approved').length : 0;

  const handleExecute = () => {
    if (txId !== null) executeTransaction(txId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Guardians</h2>
        {allRevealed && (
          <span className={`text-xs font-mono px-2 py-1 rounded transition-all duration-500 ${
            approvals >= 2 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {approvals}/3 {approvals >= 2 ? 'APPROVED' : 'REJECTED'}
          </span>
        )}
      </div>

      <AgentCard name="Security Agent" icon="🛡️" color="red"    {...displayed[0]} />
      <AgentCard name="Risk Agent"     icon="📊" color="yellow" {...displayed[1]} />
      <AgentCard name="Portfolio Agent" icon="💼" color="blue"   {...displayed[2]} />

      {/* Approved → Execute Button */}
      {allRevealed && approvals >= 2 && !isExecuted && !isRejected && (
        <div className="rounded-xl bg-green-900/20 border border-green-800 p-5 text-center animate-fade-in space-y-3">
          <div className="text-green-400 font-bold text-sm">Transaction Approved</div>
          <div className="text-gray-500 text-xs">{approvals} heads approved. Ready to execute.</div>
          <button
            onClick={handleExecute}
            disabled={execPending || execConfirming}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-3 rounded-lg text-sm transition-all duration-200"
          >
            {execPending ? 'Confirm in wallet...' : execConfirming ? 'Executing...' : 'Execute Transfer'}
          </button>
        </div>
      )}

      {/* Executed success */}
      {isExecuted && (
        <div className="rounded-xl bg-green-900/30 border border-green-700 p-5 text-center animate-fade-in">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-green-400 font-bold text-sm">Transaction Executed</div>
          <div className="text-gray-500 text-xs mt-1">Funds transferred successfully.</div>
        </div>
      )}

      {/* Rejected */}
      {allRevealed && approvals < 2 && !isExecuted && (
        <div className="rounded-xl bg-red-900/20 border border-red-800 p-5 text-center animate-fade-in">
          <div className="text-2xl mb-2">🛡️</div>
          <div className="text-red-400 font-bold text-sm">Transaction Blocked</div>
          <div className="text-gray-500 text-xs mt-1">HYDRA protected your wallet.</div>
        </div>
      )}
    </div>
  );
}
