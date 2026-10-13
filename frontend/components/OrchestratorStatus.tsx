'use client';

import { useState, useEffect } from 'react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface StatusData {
  status: string;
  uptime: number;
  totalProcessed: number;
}

export function OrchestratorStatus() {
  const [data, setData] = useState<StatusData | null>(null);
  const [online, setOnline] = useState(false);

  useEffect(() => {
    if (!BACKEND_URL) return;

    const check = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/status`, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          setData(await res.json());
          setOnline(true);
        } else {
          setOnline(false);
        }
      } catch {
        setOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!BACKEND_URL) return null;

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className={online ? 'text-gray-500' : 'text-red-400'}>
        {online ? `Orchestrator` : 'Orchestrator offline'}
      </span>
      {online && data && (
        <span className="text-gray-700">
          {formatUptime(data.uptime)} · {data.totalProcessed} tx
        </span>
      )}
    </div>
  );
}
