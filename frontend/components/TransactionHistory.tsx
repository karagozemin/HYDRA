'use client';

import { useReadContract, useAccount } from 'wagmi';
import { CONTRACT_ADDRESS, HYDRA_ABI } from '../lib/constants';

interface TxRowProps {
  txId: bigint;
}

function TxRow({ txId }: TxRowProps) {
  const { data } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'getTransaction',
    args: [txId],
    query: { refetchInterval: 5000 },
  });

  if (!data) return null;
  const [to, value, executed, rejected, approvals, rejections] = data as [string, bigint, boolean, boolean, bigint, bigint];

  const status = executed ? 'executed' : rejected ? 'rejected' : 'pending';

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-900 last:border-0">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        status === 'executed' ? 'bg-green-500' :
        status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
      }`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-mono text-gray-400 truncate">
          #{txId.toString()} → {to.slice(0, 6)}...{to.slice(-4)}
        </div>
        <div className="text-xs text-gray-600">
          {(Number(value) / 1e18).toFixed(4)} MON · {approvals.toString()}/3 approved
        </div>
      </div>
      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
        status === 'executed' ? 'bg-green-900/40 text-green-400' :
        status === 'rejected' ? 'bg-red-900/40 text-red-400' :
        'bg-yellow-900/40 text-yellow-400'
      }`}>
        {status}
      </span>
    </div>
  );
}

interface TransactionHistoryProps {
  txCount: bigint;
}

export function TransactionHistory({ txCount }: TransactionHistoryProps) {
  const { address } = useAccount();

  // Read contract owner
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'owner',
  });

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  if (!isOwner) {
    return <p className="text-xs text-gray-700 text-center py-4 font-mono">No transactions yet.</p>;
  }

  const count = Number(txCount);
  const ids = Array.from({ length: Math.min(count, 10) }, (_, i) => BigInt(count - i)).filter(id => id >= 1n);

  if (ids.length === 0) {
    return <p className="text-xs text-gray-700 text-center py-4 font-mono">No transactions yet.</p>;
  }

  return (
    <div>
      {ids.map(id => <TxRow key={id.toString()} txId={id} />)}
    </div>
  );
}
