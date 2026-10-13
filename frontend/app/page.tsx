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
import dynamic from 'next/dynamic';

const DarkVeil = dynamic(() => import('../components/DarkVeil'), { ssr: false });

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
          <HydraLogo size={66} />
          <div>
            <h1 className="text-lg font-bold tracking-tight">HYDRA</h1>
            <p className="text-xs text-gray-600 font-mono">Parallel AI Multisig · Monad</p>
          </div>
        </div>
        <ConnectWallet />
      </header>

      {!isConnected ? (
        <div className="relative overflow-hidden">
          {/* DarkVeil Background */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <DarkVeil
              hueShift={0}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={3}
              scanlineFrequency={0}
              warpAmount={5}
            />
          </div>

          {/* Hero Section */}
          <section className="relative flex flex-col items-center justify-center min-h-[90vh] px-4 text-center">
            <div className="space-y-8 max-w-3xl">
              {/* Logo */}
              <div className="animate-slide-up flex justify-center">
                <div className="animate-float">
                  <HydraLogo size={200} />
                </div>
              </div>

              {/* Headline */}
              <div className="animate-slide-up-d1">
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  Cut one head.
                </h2>
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mt-2 bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                  Three more protect your wallet.
                </h2>
              </div>

              {/* Subheading */}
              <p className="animate-slide-up-d2 text-gray-400 max-w-xl mx-auto text-base md:text-lg leading-relaxed">
                Three independent AI agents analyze every transaction in parallel — Security, Risk, and Portfolio —
                all voting in a single Monad block. <span className="text-green-400/80 font-medium">2-of-3 consensus</span> before any funds move.
              </p>
            </div>
          </section>

          {/* How It Works */}
          <section className="relative px-4 pb-24">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gray-600 mb-12">
                How It Works
              </h3>

              {/* Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
                {[
                  { step: '01', title: 'Submit', desc: 'Send a transaction through the HYDRA multisig. Your intent is broadcast to all three AI agents simultaneously.' },
                  { step: '02', title: 'Analyze', desc: 'Each agent independently evaluates the transaction in parallel — security threats, risk levels, and portfolio impact.' },
                  { step: '03', title: 'Consensus', desc: 'If 2-of-3 agents approve within the same block, the transaction executes. Otherwise, it\'s rejected.' },
                ].map((s, i) => (
                  <div key={s.step} className="group relative border border-gray-800/50 hover:border-green-500/20 bg-gray-950/50 backdrop-blur-sm rounded-2xl p-6 transition-all duration-500 hover:bg-gray-900/30">
                    <div className="text-green-500/40 text-xs font-mono font-bold mb-4">{s.step}</div>
                    <h4 className="text-lg font-bold text-white mb-2">{s.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                    {i < 2 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 text-gray-800 text-lg">&#8594;</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Agent Cards */}
              <h3 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gray-600 mb-12">
                AI Guardians
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: '🛡️',
                    name: 'Security Agent',
                    desc: 'Screens for known scam addresses, phishing contracts, and malicious patterns. Protects against social engineering and fraudulent transactions.',
                    color: 'from-red-500/10 to-transparent',
                    border: 'hover:border-red-500/30',
                    tag: 'Threat Detection',
                    tagColor: 'text-red-400 bg-red-500/10',
                  },
                  {
                    icon: '📊',
                    name: 'Risk Agent',
                    desc: 'Evaluates transaction value against wallet balance, analyzes gas costs, and scores overall risk. Flags abnormally large or suspicious transfers.',
                    color: 'from-yellow-500/10 to-transparent',
                    border: 'hover:border-yellow-500/30',
                    tag: 'Risk Analysis',
                    tagColor: 'text-yellow-400 bg-yellow-500/10',
                  },
                  {
                    icon: '💼',
                    name: 'Portfolio Agent',
                    desc: 'Monitors portfolio concentration and balance impact. Prevents over-exposure and ensures diversification rules are maintained.',
                    color: 'from-blue-500/10 to-transparent',
                    border: 'hover:border-blue-500/30',
                    tag: 'Balance Guard',
                    tagColor: 'text-blue-400 bg-blue-500/10',
                  },
                ].map(a => (
                  <div key={a.name} className={`group relative border border-gray-800/50 ${a.border} bg-gray-950/80 backdrop-blur-sm rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02]`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${a.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative">
                      <div className="text-3xl mb-4">{a.icon}</div>
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider ${a.tagColor} px-2 py-0.5 rounded-full mb-3`}>
                        {a.tag}
                      </span>
                      <h4 className="text-base font-bold text-white mb-2">{a.name}</h4>
                      <p className="text-sm text-gray-500 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack */}
              <div className="mt-20 flex flex-col items-center gap-6">
                <div className="flex items-center gap-8 text-xs text-gray-600 font-mono">
                  {[
                    { label: 'Parallel EVM', sub: 'Monad' },
                    { label: 'Llama 3.3 70B', sub: 'GROQ' },
                    { label: 'Testnet', sub: 'Live' },
                  ].map((f, i) => (
                    <div key={f.label} className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-gray-400 font-semibold">{f.label}</div>
                        <div className="text-gray-700 text-[10px] mt-0.5">{f.sub}</div>
                      </div>
                      {i < 2 && <div className="w-px h-6 bg-gray-800" />}
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <ConnectWallet />
                </div>
              </div>
            </div>
          </section>
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
