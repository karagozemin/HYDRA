'use client';

import { AgentCard, AgentStatus } from './AgentCard';
import { useGetVote } from '../hooks/useHydraContract';
import { AGENT1_ADDRESS, AGENT2_ADDRESS, AGENT3_ADDRESS } from '../lib/constants';

interface AgentPanelProps {
  txId: bigint | null;
  isSubmitting: boolean;
}

function useAgentVote(txId: bigint | null, address: `0x${string}`) {
  const { data } = useGetVote(txId, address);
  if (!txId) return { status: 'idle' as AgentStatus, reason: undefined, riskScore: undefined };
  if (!data || !data[0]) return { status: 'analyzing' as AgentStatus, reason: undefined, riskScore: undefined };
  return {
    status: (data[1] ? 'approved' : 'rejected') as AgentStatus,
    reason: data[2] as string,
    riskScore: Number(data[3]),
  };
}

export function AgentPanel({ txId, isSubmitting }: AgentPanelProps) {
  const security  = useAgentVote(txId, AGENT1_ADDRESS);
  const risk      = useAgentVote(txId, AGENT2_ADDRESS);
  const portfolio = useAgentVote(txId, AGENT3_ADDRESS);

  const votes = [security, risk, portfolio];
  const allVoted  = txId !== null && votes.every(v => v.status !== 'analyzing');
  const approvals = votes.filter(v => v.status === 'approved').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Guardians</h2>
        {allVoted && (
          <span className={`text-xs font-mono px-2 py-1 rounded ${
            approvals >= 2 ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {approvals}/3 {approvals >= 2 ? 'APPROVED' : 'REJECTED'}
          </span>
        )}
      </div>

      <AgentCard name="Security Agent" icon="🛡️" color="red"    {...security}  />
      <AgentCard name="Risk Agent"     icon="📊" color="yellow" {...risk}      />
      <AgentCard name="Portfolio Agent" icon="💼" color="blue"  {...portfolio} />

      {allVoted && approvals >= 2 && (
        <div className="rounded-xl bg-green-900/20 border border-green-800 p-4 text-center">
          <div className="text-green-400 font-bold text-sm">Transaction Approved</div>
          <div className="text-gray-500 text-xs mt-1">{approvals} heads approved. Execute when ready.</div>
        </div>
      )}

      {allVoted && approvals < 2 && (
        <div className="rounded-xl bg-red-900/20 border border-red-800 p-4 text-center">
          <div className="text-red-400 font-bold text-sm">Transaction Blocked</div>
          <div className="text-gray-500 text-xs mt-1">HYDRA protected your wallet.</div>
        </div>
      )}
    </div>
  );
}
