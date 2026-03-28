'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { ConnectWallet } from '../components/ConnectWallet';
import { TransactionForm } from '../components/TransactionForm';
import { AgentPanel } from '../components/AgentPanel';
import { TransactionHistory } from '../components/TransactionHistory';
import { HydraLogo } from '../components/HydraLogo';
import { WrongNetworkBanner } from '../components/WrongNetworkBanner';
import { useTxCount } from '../hooks/useHydraContract';
import { AgentReputation } from '../components/AgentReputation';

export default function Home() {
  const { isConnected } = useAccount();
  const [activeTxId, setActiveTxId] = useState<bigint | null>(null);
  const [phase, setPhase] = useState<'idle' | 'wallet' | 'confirming' | 'analyzing'>('idle');
  const { data: txCount, refetch: refetchTxCount } = useTxCount();
  const txCountAtSubmit = useRef<bigint>(BigInt(0));

  // When txCount increases past snapshot → we have the new txId
  useEffect(() => {
    if (phase === 'confirming' && txCount !== undefined && txCount > txCountAtSubmit.current) {
      setActiveTxId(txCount);
      setPhase('analyzing');
    }
  }, [txCount, phase]);

  const handleSubmitted = () => {
    txCountAtSubmit.current = txCount ?? 0n;
    setActiveTxId(null);
    setPhase('wallet');
  };

  const handleConfirmed = () => {
    setPhase('confirming');
    const interval = setInterval(() => refetchTxCount(), 500);
    setTimeout(() => clearInterval(interval), 30000);
  };

  const handleError = () => {
    setPhase('idle');
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <WrongNetworkBanner />
      <header className="border-b border-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <HydraLogo />
          <div>
            <h1 className="text-lg font-bold tracking-tight">HYDRA</h1>
            <p className="text-xs text-gray-600 font-mono">Parallel AI Multisig · Monad</p>
          </div>
        </div>
        <ConnectWallet />
      </header>

      {!isConnected ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
          {/* Hero */}
          <div className="animate-fade-in space-y-6 max-w-2xl">
            <HydraLogo size={80} />
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Cut one head.<br />
              <span className="text-green-400">Three more protect your wallet.</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
              Three independent AI agents analyze every transaction in parallel — Security, Risk, and Portfolio —
              all voting in a single Monad block. 2-of-3 consensus before any funds move.
            </p>

            {/* Agent preview cards */}
            <div className="flex justify-center gap-4 pt-4">
              {[
                { icon: '🛡️', name: 'Security', desc: 'Scam detection & address screening', color: 'border-red-500/30' },
                { icon: '📊', name: 'Risk',     desc: 'Value analysis & risk scoring',       color: 'border-yellow-500/30' },
                { icon: '💼', name: 'Portfolio', desc: 'Balance impact & concentration',     color: 'border-blue-500/30' },
              ].map(a => (
                <div key={a.name} className={`border ${a.color} bg-gray-900/50 rounded-xl px-4 py-3 w-40 text-left`}>
                  <div className="text-xl mb-1">{a.icon}</div>
                  <div className="text-xs font-bold text-white">{a.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{a.desc}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div className="flex justify-center gap-6 pt-2 text-xs text-gray-600 font-mono">
              <span>Parallel EVM</span>
              <span className="text-gray-800">|</span>
              <span>GROQ Llama 3.3 70B</span>
              <span className="text-gray-800">|</span>
              <span>Monad Testnet</span>
            </div>

            <div className="pt-4">
              <ConnectWallet />
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                New Transaction
              </h2>
              <TransactionForm onSubmitted={handleSubmitted} onConfirmed={handleConfirmed} onError={handleError} />
            </section>

            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                History
              </h2>
              <TransactionHistory txCount={txCount ?? 0n} />
            </section>

            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                Agent Reputation
              </h2>
              <AgentReputation />
            </section>
          </div>

          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-6 h-fit">
            {phase === 'idle' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="text-4xl opacity-30">🛡️📊💼</div>
                <p className="text-gray-700 text-sm font-mono">Submit a transaction to activate the AI guardians.</p>
              </div>
            )}
            {phase === 'wallet' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="text-4xl">🦊</div>
                <p className="text-yellow-400 text-sm font-mono">Confirm in your wallet...</p>
              </div>
            )}
            {phase === 'confirming' && (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="text-4xl">⛓️</div>
                <p className="text-green-400 text-sm font-mono">Confirming on Monad...</p>
                <div className="w-32 bg-gray-800 rounded-full h-1 mt-2">
                  <div className="h-1 rounded-full bg-green-500/60 animate-analyzing-bar" />
                </div>
              </div>
            )}
            {phase === 'analyzing' && activeTxId !== null && (
              <AgentPanel txId={activeTxId} isSubmitting={false} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
