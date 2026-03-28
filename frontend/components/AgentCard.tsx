'use client';

export type AgentStatus = 'idle' | 'analyzing' | 'approved' | 'rejected';

interface AgentCardProps {
  name: string;
  icon: string;
  status: AgentStatus;
  reason?: string;
  riskScore?: number;
  color: string;
}

export function AgentCard({ name, icon, status, reason, riskScore, color }: AgentCardProps) {
  const statusConfig = {
    idle:      { label: 'Waiting...',  ring: 'ring-gray-700',   bg: 'bg-gray-900',   dot: 'bg-gray-600' },
    analyzing: { label: 'Analyzing...', ring: 'ring-yellow-500', bg: 'bg-gray-900',   dot: 'bg-yellow-400 animate-pulse' },
    approved:  { label: 'APPROVED',    ring: 'ring-green-500',  bg: 'bg-gray-900',   dot: 'bg-green-400' },
    rejected:  { label: 'REJECTED',    ring: 'ring-red-500',    bg: 'bg-gray-900',   dot: 'bg-red-400' },
  }[status];

  return (
    <div className={`rounded-xl p-5 ring-2 ${statusConfig.ring} ${statusConfig.bg} transition-all duration-500`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="text-sm font-bold text-white">{name}</div>
          <div className={`text-xs font-mono mt-0.5 ${
            status === 'approved' ? 'text-green-400' :
            status === 'rejected' ? 'text-red-400' :
            status === 'analyzing' ? 'text-yellow-400' : 'text-gray-500'
          }`}>
            {statusConfig.label}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full ${statusConfig.dot}`} />
      </div>

      {reason && (
        <p className="text-xs text-gray-400 font-mono border-t border-gray-800 pt-3 mt-1">
          {reason}
        </p>
      )}

      {riskScore !== undefined && status !== 'idle' && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Risk Score</span>
            <span className={riskScore > 70 ? 'text-red-400' : riskScore > 40 ? 'text-yellow-400' : 'text-green-400'}>
              {riskScore}/100
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-700 ${
                riskScore > 70 ? 'bg-red-500' : riskScore > 40 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
