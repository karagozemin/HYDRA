'use client';

import { useState, useEffect } from 'react';
import { useHydraAccess, useHydraContract } from '../hooks/useHydraContract';
import { isAddress, parseEventLogs } from 'viem';
import { formatHydraError } from '../lib/contractError';
import { MONAD_TESTNET_EXPLORER_URL, MONAD_TESTNET_FAUCET_URL } from '../lib/network';
import { HYDRA_ABI } from '../lib/constants';

interface TransactionFormProps {
  onSubmitted: () => void;
  onConfirmed: (txId: bigint) => void;
  onError: () => void;
}

export function TransactionForm({ onSubmitted, onConfirmed, onError }: TransactionFormProps) {
  const [to, setTo]       = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const { submitTransaction, isPending, isConfirming, isSuccess, receipt, submitHash, error: contractError, reset } = useHydraContract();
  const { hasGas, isWrongNetwork, isLoading: isAccessLoading, readError } = useHydraAccess();

  const accessIssue = isWrongNetwork
    ? 'Switch to Monad Testnet before submitting.'
    : readError
      ? 'Unable to verify the wallet against Monad Testnet. Check the RPC connection.'
      : hasGas === false
        ? 'The connected wallet needs MON to pay network gas.'
        : '';

  // When tx is confirmed on-chain, notify parent
  useEffect(() => {
    if (isSuccess && receipt) {
      const [submitted] = parseEventLogs({
        abi: HYDRA_ABI,
        eventName: 'TransactionSubmitted',
        logs: receipt.logs,
        strict: true,
      });

      if (submitted) {
        onConfirmed(submitted.args.txId);
      } else {
        setError('Transaction confirmed, but its submission ID could not be decoded.');
        onError();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess, receipt]);

  // Show contract/wallet errors and reset phase
  useEffect(() => {
    if (contractError) {
      setError(formatHydraError(contractError, 'submit'));
      onError();
      reset();
    }
  }, [contractError, onError, reset]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    reset();

    if (accessIssue) { setError(accessIssue); return; }
    if (isAccessLoading || hasGas !== true) {
      setError('Wallet balance is still being verified. Please wait a moment.');
      return;
    }
    if (!isAddress(to)) { setError('Invalid address'); return; }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) { setError('Invalid amount'); return; }

    submitTransaction(to as `0x${string}`, value);
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">To Address</label>
        <input
          type="text"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="0x..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-green-600 transition"
        />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => { setTo('0x8aeA55E869eab02A0a68D3172e85C5aeCEe8534D'); setValue('0.01'); }}
            className="text-xs text-gray-600 hover:text-green-400 font-mono transition">
            Demo: Safe tx
          </button>
          <button type="button" onClick={() => { setTo('0x000000000000000000000000000000000000dEaD'); setValue('0.5'); }}
            className="text-xs text-gray-600 hover:text-red-400 font-mono transition">
            Demo: Scam tx
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Amount (MON)</label>
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="0.1"
          step="0.001"
          min="0"
          className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-green-600 transition"
        />
      </div>

      {accessIssue && (
        <div className="rounded-lg border border-yellow-800/60 bg-yellow-950/30 px-3 py-2.5 text-xs font-mono text-yellow-300">
          <p>{accessIssue}</p>
          {hasGas === false && (
            <a
              href={MONAD_TESTNET_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-green-400 hover:text-green-300"
            >
              Get testnet MON ↗
            </a>
          )}
        </div>
      )}

      {error && error !== accessIssue && <p className="text-red-400 text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={isPending || isConfirming || isAccessLoading || Boolean(accessIssue) || hasGas !== true}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-3 rounded-lg text-sm transition-all duration-200"
      >
        {isPending
          ? 'Waiting for wallet...'
          : isConfirming
            ? 'Confirming...'
            : isAccessLoading
              ? 'Checking wallet...'
              : hasGas === false
                ? 'MON Required for Gas'
                : 'Submit Transaction'}
      </button>

      {submitHash && (
        <a
          href={`${MONAD_TESTNET_EXPLORER_URL}/tx/${submitHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-purple-400 hover:text-purple-300 font-mono truncate text-center transition"
        >
          tx: {submitHash.slice(0, 10)}...{submitHash.slice(-8)} ↗
        </a>
      )}
    </form>
  );
}
