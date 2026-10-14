'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBalance } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACT_ADDRESS, HYDRA_ABI } from '../lib/constants';
import { monadTestnet } from '../lib/wagmiConfig';

export function useHydraContract() {
  const { writeContract, data: submitHash, isPending, error, reset } = useWriteContract();

  const submitTransaction = (to: `0x${string}`, valueEther: string, data: `0x${string}` = '0x') => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HYDRA_ABI,
      functionName: 'submitTransaction',
      args: [to, parseEther(valueEther || '0'), data],
    });
  };

  const executeTransaction = (txId: bigint, value: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HYDRA_ABI,
      functionName: 'executeTransaction',
      args: [txId],
      value,
    });
  };

  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: submitHash,
  });

  return {
    submitTransaction,
    executeTransaction,
    isPending,
    isConfirming,
    isSuccess,
    receipt,
    submitHash,
    error,
    reset,
  };
}

export function useHydraAccess() {
  const { address, chainId, isConnected } = useAccount();
  const balanceQuery = useBalance({
    address,
    chainId: monadTestnet.id,
    query: {
      enabled: Boolean(address) && chainId === monadTestnet.id,
      refetchInterval: 15_000,
    },
  });

  const hasGas = balanceQuery.data ? balanceQuery.data.value > 0n : undefined;

  return {
    address,
    isConnected,
    hasGas,
    isWrongNetwork: isConnected && chainId !== monadTestnet.id,
    isLoading: balanceQuery.isLoading,
    readError: balanceQuery.error,
  };
}

export function useTxCount() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'txCount',
    query: { refetchInterval: 1000 },
  });
}

export function useCanExecute(txId: bigint | null) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'canExecute',
    args: txId !== null ? [txId] : undefined,
    query: { enabled: txId !== null, refetchInterval: 1000 },
  });
}

export function useGetVote(txId: bigint | null, agentAddress: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'getVote',
    args: txId !== null ? [txId, agentAddress] : undefined,
    query: {
      enabled: txId !== null && !!agentAddress,
      refetchInterval: 1000,
    },
  });
}
