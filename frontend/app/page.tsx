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
import { OrchestratorStatus } from '../components/OrchestratorStatus';
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
            <OrchestratorStatus />
          </div>
        </div>
        <ConnectWallet />
      </header>

      {!isConnected ? (
        <div className="relative overflow-hidden">
          {/* DarkVeil Background */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            <DarkVeil
              hueShift={0}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={3}
              scanlineFrequency={0}
              warpAmount={5}
            />
          </div>

          {/* ── HERO ── */}
          <section className="relative flex flex-col items-center justify-center min-h-[92vh] px-4 text-center">
            <div className="space-y-10 max-w-4xl">
              <div className="animate-slide-up flex justify-center">
                <div className="animate-float relative">
                  <div className="absolute inset-0 bg-green-500/20 blur-[60px] rounded-full scale-150" />
                  <HydraLogo size={200} />
                </div>
              </div>

              <div className="animate-slide-up-d1 space-y-3">
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
                  Cut one head.
                </h2>
                <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-r from-green-400 via-emerald-300 to-green-500 bg-clip-text text-transparent animate-gradient-x">
                  Three more protect your wallet.
                </h2>
              </div>

              <p className="animate-slide-up-d2 text-gray-400 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed font-light">
                Three independent AI agents analyze every transaction in parallel —
                all voting in a single Monad block.{' '}
                <span className="text-green-400 font-medium">2-of-3 consensus</span> before any funds move.
              </p>

              {/* Scroll hint */}
              <div className="animate-slide-up-d3 pt-8">
                <div className="scroll-hint mx-auto w-5 h-9 border-2 border-gray-700 rounded-full flex items-start justify-center p-1.5">
                  <div className="w-1 h-2 bg-gray-500 rounded-full animate-scroll-dot" />
                </div>
              </div>
            </div>
          </section>

          {/* ── STATS BAR ── */}
          <section className="relative border-y border-gray-800/50 bg-gray-950/40 backdrop-blur-md">
            <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '3', label: 'AI Agents', sub: 'Independent guardians' },
                { value: '1', label: 'Block', sub: 'Parallel voting' },
                { value: '2/3', label: 'Consensus', sub: 'Required to execute' },
                { value: '<1s', label: 'Latency', sub: 'GROQ inference' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{s.value}</div>
                  <div className="text-sm font-semibold text-green-400 mt-1">{s.label}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── FLOW VISUALIZATION ── */}
          <section className="relative px-4 py-28">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-500/60 mb-3">How It Works</p>
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Parallel protection in one block
                </h3>
                <p className="text-gray-500 mt-4 max-w-lg mx-auto text-base">
                  Unlike sequential multisigs, HYDRA agents vote simultaneously — enabled by Monad&apos;s parallel EVM.
                </p>
              </div>

              {/* Animated flow */}
              <div className="relative flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
                {/* Step 1: Submit */}
                <div className="flow-step w-56 border border-gray-800 bg-gray-950/80 backdrop-blur rounded-2xl p-5 text-center z-10">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </div>
                  <div className="text-sm font-bold text-white">Submit TX</div>
                  <div className="text-xs text-gray-500 mt-1">User sends intent</div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center">
                  <div className="w-12 h-px bg-gradient-to-r from-green-500/40 to-green-500/10 flow-line" />
                  <div className="w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-green-500/30" />
                </div>
                <div className="md:hidden h-6 w-px bg-gradient-to-b from-green-500/40 to-green-500/10" />

                {/* Step 2: Parallel Analysis */}
                <div className="relative z-10">
                  <div className="absolute -inset-3 bg-green-500/5 rounded-3xl blur-xl" />
                  <div className="relative border border-green-500/20 bg-gray-950/90 backdrop-blur rounded-2xl p-5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-500/50 text-center mb-4">
                      Parallel Analysis
                    </div>
                    <div className="flex gap-3">
                      {[
                        { icon: '🛡️', name: 'Security', color: 'border-red-500/40 shadow-red-500/10' },
                        { icon: '📊', name: 'Risk', color: 'border-yellow-500/40 shadow-yellow-500/10' },
                        { icon: '💼', name: 'Portfolio', color: 'border-blue-500/40 shadow-blue-500/10' },
                      ].map((a, i) => (
                        <div key={a.name} className={`border ${a.color} bg-gray-900/80 rounded-xl p-3 w-20 text-center shadow-lg agent-pulse`} style={{ animationDelay: `${i * 200}ms` }}>
                          <div className="text-lg">{a.icon}</div>
                          <div className="text-[9px] font-bold text-gray-400 mt-1">{a.name}</div>
                          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500/60 rounded-full animate-analyzing-bar" style={{ animationDelay: `${i * 300}ms` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center mt-3">
                      <span className="text-[10px] font-mono text-gray-600">Block #4,291,337</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center">
                  <div className="w-12 h-px bg-gradient-to-r from-green-500/10 to-green-500/40 flow-line" />
                  <div className="w-0 h-0 border-y-4 border-y-transparent border-l-4 border-l-green-500/30" />
                </div>
                <div className="md:hidden h-6 w-px bg-gradient-to-b from-green-500/10 to-green-500/40" />

                {/* Step 3: Execute */}
                <div className="flow-step w-56 border border-gray-800 bg-gray-950/80 backdrop-blur rounded-2xl p-5 text-center z-10">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-sm font-bold text-white">Execute</div>
                  <div className="text-xs text-gray-500 mt-1">2-of-3 approved</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── AGENT DEEP DIVE ── */}
          <section className="relative px-4 py-28">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-500/60 mb-3">AI Guardians</p>
                <h3 className="text-3xl md:text-4xl font-bold text-white">
                  Three layers of protection
                </h3>
                <p className="text-gray-500 mt-4 max-w-lg mx-auto text-base">
                  Each agent specializes in a different dimension of transaction safety, powered by Llama 3.3 70B on GROQ.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: '🛡️',
                    name: 'Security Agent',
                    desc: 'Screens for known scam addresses, phishing contracts, and malicious patterns.',
                    checks: ['Address blacklist screening', 'Contract verification', 'Phishing detection', 'Social engineering flags'],
                    gradient: 'from-red-500/20 via-red-500/5 to-transparent',
                    border: 'hover:border-red-500/40',
                    accent: 'text-red-400',
                    dotColor: 'bg-red-500',
                  },
                  {
                    icon: '📊',
                    name: 'Risk Agent',
                    desc: 'Evaluates transaction value relative to wallet balance and scores overall risk.',
                    checks: ['Value-to-balance ratio', 'Gas cost analysis', 'Historical pattern check', 'Anomaly detection'],
                    gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent',
                    border: 'hover:border-yellow-500/40',
                    accent: 'text-yellow-400',
                    dotColor: 'bg-yellow-500',
                  },
                  {
                    icon: '💼',
                    name: 'Portfolio Agent',
                    desc: 'Monitors portfolio concentration and prevents dangerous over-exposure.',
                    checks: ['Balance impact analysis', 'Concentration limits', 'Diversification rules', 'Liquidity assessment'],
                    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
                    border: 'hover:border-blue-500/40',
                    accent: 'text-blue-400',
                    dotColor: 'bg-blue-500',
                  },
                ].map(a => (
                  <div key={a.name} className={`group relative border border-gray-800/60 ${a.border} bg-gray-950/80 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1`}>
                    <div className={`absolute inset-0 bg-gradient-to-b ${a.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                    <div className="relative p-8">
                      <div className="text-5xl mb-5">{a.icon}</div>
                      <h4 className="text-xl font-bold text-white mb-3">{a.name}</h4>
                      <p className="text-base text-gray-400 leading-relaxed mb-6">{a.desc}</p>
                      <div className="space-y-3">
                        {a.checks.map(c => (
                          <div key={c} className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${a.dotColor} opacity-60`} />
                            <span className="text-sm text-gray-400">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── WHY HYDRA ── */}
          <section className="relative px-4 py-28 border-t border-gray-800/30">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-500/60 mb-3">Why HYDRA</p>
                <h3 className="text-3xl md:text-5xl font-bold text-white">
                  Traditional multisig is broken
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Old way */}
                <div className="border border-gray-800/40 bg-gray-950/50 rounded-2xl p-8">
                  <div className="text-sm font-bold uppercase tracking-wider text-gray-600 mb-6">Traditional Multisig</div>
                  <div className="space-y-5">
                    {[
                      'Human signers can be compromised',
                      'Sequential approval is slow',
                      'No intelligent risk analysis',
                      'Single dimension of verification',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="text-red-500/70 mt-0.5 text-lg">&#10005;</span>
                        <span className="text-lg text-gray-500">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* HYDRA way */}
                <div className="border border-green-500/20 bg-green-500/[0.03] rounded-2xl p-8">
                  <div className="text-sm font-bold uppercase tracking-wider text-green-500/70 mb-6">HYDRA Multisig</div>
                  <div className="space-y-5">
                    {[
                      'AI agents can\'t be socially engineered',
                      'Parallel voting in one block',
                      'Multi-dimensional threat analysis',
                      'Three specialized perspectives',
                    ].map(item => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="text-green-500/80 mt-0.5 text-lg">&#10003;</span>
                        <span className="text-lg text-gray-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── TECH STACK ── */}
          <section className="relative px-4 py-20 border-t border-gray-800/30">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-500/60 mb-3">Built With</p>
              </div>

              <div className="grid grid-cols-3 gap-10">
                {[
                  { name: 'Monad', desc: 'Parallel EVM L1 blockchain', detail: '10,000 TPS' },
                  { name: 'GROQ', desc: 'Ultra-fast LLM inference', detail: 'Llama 3.3 70B' },
                  { name: 'Solidity', desc: 'On-chain multisig contract', detail: '2-of-3 voting' },
                ].map(t => (
                  <div key={t.name} className="text-center group">
                    <div className="text-3xl font-bold text-white group-hover:text-green-400 transition-colors">{t.name}</div>
                    <div className="text-base text-gray-500 mt-2">{t.desc}</div>
                    <div className="text-sm text-gray-700 font-mono mt-2">{t.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── FINAL CTA ── */}
          <section className="relative px-4 py-28 border-t border-gray-800/30">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <h3 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight">
                Ready to protect<br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-300 bg-clip-text text-transparent">your transactions?</span>
              </h3>
              <p className="text-gray-400 text-base md:text-lg max-w-lg mx-auto leading-relaxed">
                Connect your wallet and experience AI-powered transaction security on Monad Testnet.
              </p>
              <div className="pt-4 flex justify-center">
                <ConnectWallet />
              </div>
            </div>
          </section>

          {/* ── FOOTER ── */}
          <footer className="relative border-t border-gray-800/40 px-4 py-8">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <HydraLogo size={24} />
                <span className="text-sm font-bold text-gray-500">HYDRA</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>
                  Powered by{' '}
                  <a href="https://x.com/OverBlock_" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                    OverBlock
                  </a>
                </span>
                <span className="text-gray-800">|</span>
                <span>
                  Created by{' '}
                  <a href="https://x.com/kaptan_web3" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 transition-colors font-medium">
                    Kaptan
                  </a>
                </span>
              </div>
            </div>
          </footer>
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
              <AgentPanel txId={activeTxId} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}
