'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { monadTestnet } from '../lib/wagmiConfig';

const MONAD_CHAIN_ID = monadTestnet.id;
const CHAIN_HEX = `0x${MONAD_CHAIN_ID.toString(16)}`;

export function WrongNetworkBanner() {
  const { isConnected, chainId, connector } = useAccount();
  const [isPending, setIsPending] = useState(false);

  const isWrongNetwork = isConnected && chainId !== undefined && chainId !== MONAD_CHAIN_ID;

  const doSwitch = async () => {
    if (!connector) return;
    setIsPending(true);
    try {
      const provider = await connector.getProvider() as any;
      if (!provider?.request) return;

      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: CHAIN_HEX }],
        });
      } catch (err: any) {
        if (err?.code === 4902 || err?.code === -32603) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: CHAIN_HEX,
              chainName: 'Monad Testnet',
              nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
              rpcUrls: ['https://testnet-rpc.monad.xyz'],
              blockExplorerUrls: ['https://testnet.monadexplorer.com'],
            }],
          });
        }
      }
    } finally {
      setIsPending(false);
    }
  };

  // Auto-trigger switch when wrong network detected
  useEffect(() => {
    if (isWrongNetwork && !isPending) {
      doSwitch();
    }
  }, [isWrongNetwork]);

  if (!isWrongNetwork) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 px-4 py-2.5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-yellow-400 text-sm">
        <span>⚠</span>
        <span className="font-mono">
          {isPending ? 'Switching to Monad Testnet...' : 'Wrong network — confirm switch in your wallet.'}
        </span>
      </div>
      {!isPending && (
        <button
          onClick={doSwitch}
          className="text-xs bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-1.5 rounded-lg transition whitespace-nowrap"
        >
          Switch to Monad
        </button>
      )}
    </div>
  );
}
