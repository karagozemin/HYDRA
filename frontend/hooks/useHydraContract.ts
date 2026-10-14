'use client';

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount, useBalance } from 'wagmi';
import { isAddressEqual, parseEther } from 'viem';
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

  const executeTransaction = (txId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: HYDRA_ABI,
      functionName: 'executeTransaction',
      args: [txId],
    });
  };

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: submitHash,
  });

  return {
    submitTransaction,
    executeTransaction,
    isPending,
    isConfirming,
    isSuccess,
    submitHash,
    error,
    reset,
  };
}

export function useHydraAccess() {
  const { address, chainId, isConnected } = useAccount();
  const ownerQuery = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: HYDRA_ABI,
    functionName: 'owner',
    query: { retry: 2 },
  });
  const balanceQuery = useBalance({
    address,
    chainId: monadTestnet.id,
    query: {
      enabled: Boolean(address) && chainId === monadTestnet.id,
      refetchInterval: 15_000,
    },
  });

  const owner = ownerQuery.data as `0x${string}` | undefined;
  const isOwner = address && owner ? isAddressEqual(address, owner) : undefined;
  const hasGas = balanceQuery.data ? balanceQuery.data.value > 0n : undefined;

  return {
    address,
    owner,
    isConnected,
    isOwner,
    hasGas,
    isWrongNetwork: isConnected && chainId !== monadTestnet.id,
    isLoading: ownerQuery.isLoading || balanceQuery.isLoading,
    readError: ownerQuery.error || balanceQuery.error,
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
