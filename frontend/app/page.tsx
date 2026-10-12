'use client';

import { useState } from 'react';
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
  const [analyzing, setAnalyzing] = useState(false);
  const { data: txCount } = useTxCount();

  const handleSubmitted = (txId: bigint | null) => {
    setActiveTxId(txId);
    setAnalyzing(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <WrongNetworkBanner />
      {/* Header */}
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
        /* Hero / Not connected */
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
        /* Dashboard */
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Submit + History */}
          <div className="space-y-6">
            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-5">
                New Transaction
              </h2>
              <TransactionForm onSubmitted={handleSubmitted} />
            </section>

            <section className="bg-gray-950 border border-gray-900 rounded-2xl p-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                History
              </h2>
              <TransactionHistory txCount={txCount ?? 0n} />
            </section>
          </div>

          {/* Right: Agent Panel */}
          <div className="bg-gray-950 border border-gray-900 rounded-2xl p-6 h-fit">
            {!analyzing ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                <div className="text-4xl opacity-30">🛡️📊💼</div>
                <p className="text-gray-700 text-sm font-mono">
                  Submit a transaction to activate the AI guardians.
                </p>
              </div>
            ) : (
              <AgentPanel txId={activeTxId} isSubmitting={analyzing} />
            )}
          </div>

        </div>
      )}
    </main>
  );
}
