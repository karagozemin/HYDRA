import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { monadTestnet } from '../config/monad.js';

const RPC_URL = process.env.RPC_URL || 'https://testnet-rpc.monad.xyz';

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(RPC_URL),
});

const makeWalletClient = (privateKey, label) => {
  if (!privateKey) throw new Error(`Missing private key for ${label}`);
  const account = privateKeyToAccount(privateKey);
  // Each agent gets its own http transport instance — critical for nonce isolation
  const client = createWalletClient({
    account,
    chain: monadTestnet,
    transport: http(RPC_URL),
  });
  return { client, account };
};

export const securityWallet = makeWalletClient(process.env.AGENT1_KEY, 'AGENT1 (Security)');
export const riskWallet = makeWalletClient(process.env.AGENT2_KEY, 'AGENT2 (Risk)');
export const portfolioWallet = makeWalletClient(process.env.AGENT3_KEY, 'AGENT3 (Portfolio)');
