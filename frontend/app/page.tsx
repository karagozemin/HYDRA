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
    // Aggressively poll for the new txCount
    const interval = setInterval(() => refetchTxCount(), 500);
    setTimeout(() => clearInterval(interval), 30000);
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
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6 px-4 text-center">
          <div className="text-6xl">🐉</div>
          <h2 className="text-3xl font-bold">Cut one head.</h2>
          <p className="text-xl text-green-400 font-bold">Three more protect your wallet.</p>
          <p className="text-gray-500 max-w-md text-sm">
            Three independent AI agents analyze every transaction in parallel before it executes.
            Security. Risk. Portfolio. All in one block.
          </p>
          <ConnectWallet />
        </div>
      ) : (
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                New Transaction
              </h2>
              <TransactionForm onSubmitted={handleSubmitted} onConfirmed={handleConfirmed} />
            </section>

            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                History
              </h2>
              <TransactionHistory txCount={txCount ?? 0n} />
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
