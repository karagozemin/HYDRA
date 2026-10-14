'use client';

import { http } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { MONAD_TESTNET_EXPLORER_URL, MONAD_TESTNET_RPC_URL } from './network';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'https://hydra-1.vercel.app'
);

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: [MONAD_TESTNET_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: MONAD_TESTNET_EXPLORER_URL },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'HYDRA — Parallel AI Multisig',
  appDescription: 'Parallel AI-agent transaction security on Monad.',
  appUrl: APP_URL,
  appIcon: `${APP_URL}/hydra.png`,
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'hydra-monad-demo',
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(MONAD_TESTNET_RPC_URL, {
      retryCount: 3,
      retryDelay: 750,
      timeout: 15_000,
    }),
  },
  ssr: true,
});
