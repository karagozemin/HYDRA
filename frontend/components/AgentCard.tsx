'use client';

import { useEffect, useState } from 'react';

export type AgentStatus = 'idle' | 'analyzing' | 'approved' | 'rejected' | 'error';

interface AgentCardProps {
  name: string;
  icon: string;
  status: AgentStatus;
  reason?: string;
  riskScore?: number;
  color: string;
}

const ANALYZING_STEPS = [
  'Scanning transaction...',
  'Evaluating risk vectors...',
  'Cross-referencing patterns...',
  'Computing risk score...',
  'Finalizing analysis...',
];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AgentCard({ name, icon, status, reason, riskScore, color }: AgentCardProps) {
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  // Cycle through analyzing messages
  useEffect(() => {
    if (status === 'analyzing') {
      setRevealed(false);
      const interval = setInterval(() => {
        setAnalyzeStep(prev => (prev + 1) % ANALYZING_STEPS.length);
      }, 600);
      return () => clearInterval(interval);
    }
    if (status === 'approved' || status === 'rejected' || status === 'error') {
      const timer = setTimeout(() => setRevealed(true), 100);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const statusConfig = {
    idle:      { label: 'Standby',              ring: 'ring-gray-800',          dot: 'bg-gray-700' },
    analyzing: { label: ANALYZING_STEPS[analyzeStep], ring: 'ring-yellow-500/50 animate-pulse', dot: 'bg-yellow-400 animate-pulse' },
    approved:  { label: 'APPROVED',             ring: 'ring-green-500',         dot: 'bg-green-400' },
    rejected:  { label: 'REJECTED',             ring: 'ring-red-500',           dot: 'bg-red-400' },
    error:     { label: 'ERROR',                ring: 'ring-orange-500',        dot: 'bg-orange-400' },
  }[status];

  return (
    <div className={`rounded-xl p-5 ring-2 ${statusConfig.ring} bg-gray-900 transition-all duration-700`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">{name}</div>
          <div className={`text-xs font-mono mt-0.5 transition-all duration-300 ${
            status === 'approved' ? 'text-green-400' :
            status === 'rejected' ? 'text-red-400' :
            status === 'error' ? 'text-orange-400' :
            status === 'analyzing' ? 'text-yellow-400' : 'text-gray-600'
          }`}>
            {statusConfig.label}
          </div>
        </div>
        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${statusConfig.dot}`} />
      </div>

      {/* Result — slides in after reveal */}
      <div className={`overflow-hidden transition-all duration-500 ${
        revealed && reason ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'
      }`}>
        <p className="text-xs text-gray-400 font-mono border-t border-gray-800 pt-3">
          {reason}
        </p>
      </div>

      {/* Risk bar — animates width from 0 */}
      <div className={`overflow-hidden transition-all duration-500 ${
        revealed && riskScore !== undefined ? 'max-h-12 opacity-100 mt-3' : 'max-h-0 opacity-0'
      }`}>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Risk Score</span>
          <span className={
            (riskScore ?? 0) > 70 ? 'text-red-400' :
            (riskScore ?? 0) > 40 ? 'text-yellow-400' : 'text-green-400'
          }>
            {riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
              (riskScore ?? 0) > 70 ? 'bg-red-500' :
              (riskScore ?? 0) > 40 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: revealed ? `${riskScore}%` : '0%' }}
          />
        </div>
      </div>

      {/* Analyzing progress bar */}
      {status === 'analyzing' && (
        <div className="mt-3">
          <div className="w-full bg-gray-800 rounded-full h-1">
            <div className="h-1 rounded-full bg-yellow-500/60 animate-analyzing-bar" />
          </div>
        </div>
      )}
    </div>
  );
}
