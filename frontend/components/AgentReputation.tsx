'use client';

import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, HYDRA_ABI, AGENT1_ADDRESS, AGENT2_ADDRESS, AGENT3_ADDRESS } from '../lib/constants';

function useReputation(agent: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'agentReputation',
    args: [agent],
    query: { refetchInterval: 5000 },
  });
}

const AGENTS = [
  { address: AGENT1_ADDRESS, name: 'Security Agent', icon: '🛡️', color: 'red' },
  { address: AGENT2_ADDRESS, name: 'Risk Agent',     icon: '📊', color: 'yellow' },
  { address: AGENT3_ADDRESS, name: 'Portfolio Agent', icon: '💼', color: 'blue' },
] as const;

export function AgentReputation() {
  const rep1 = useReputation(AGENT1_ADDRESS);
  const rep2 = useReputation(AGENT2_ADDRESS);
  const rep3 = useReputation(AGENT3_ADDRESS);

  const reps = [rep1, rep2, rep3];
  const maxRep = Math.max(...reps.map(r => Number(r.data ?? 0)), 1);

  return (
    <div className="space-y-3">
      {AGENTS.map((agent, i) => {
        const rep = Number(reps[i].data ?? 0);
        const pct = Math.round((rep / maxRep) * 100);
        const barColor = agent.color === 'red' ? 'bg-red-500' : agent.color === 'yellow' ? 'bg-yellow-500' : 'bg-blue-500';

        return (
          <div key={agent.address} className="flex items-center gap-3">
            <span className="text-lg w-7 text-center">{agent.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-bold text-gray-300">{agent.name}</span>
                <span className="text-xs font-mono text-gray-500">{rep} approvals</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${barColor} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
