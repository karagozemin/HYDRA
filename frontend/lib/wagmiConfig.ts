'use client';

import { http } from 'wagmi';
import { defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: 'HYDRA — Parallel AI Multisig',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID || 'hydra-monad-demo',
  chains: [monadTestnet],
  transports: { [monadTestnet.id]: http() },
  ssr: true,
});
