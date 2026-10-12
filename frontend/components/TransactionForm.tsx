'use client';

import { useState } from 'react';
import { useHydraContract } from '../hooks/useHydraContract';
import { isAddress } from 'viem';

interface TransactionFormProps {
  onSubmitted: (txId: bigint | null) => void;
}

export function TransactionForm({ onSubmitted }: TransactionFormProps) {
  const [to, setTo]       = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const { submitTransaction, isPending, isConfirming, isSuccess, submitHash } = useHydraContract();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isAddress(to)) { setError('Invalid address'); return; }
    if (!value || isNaN(Number(value)) || Number(value) <= 0) { setError('Invalid amount'); return; }

    submitTransaction(to as `0x${string}`, value);
    onSubmitted(null); // signals analyzing state
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

      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

      <button
        type="submit"
        disabled={isPending || isConfirming}
        className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-800 disabled:text-gray-600 text-black font-bold py-3 rounded-lg text-sm transition-all duration-200"
      >
        {isPending ? 'Waiting for wallet...' : isConfirming ? 'Submitting...' : 'Submit Transaction'}
      </button>

      {submitHash && (
        <p className="text-xs text-gray-600 font-mono truncate text-center">
          tx: {submitHash}
        </p>
      )}
    </form>
  );
}
