type HydraAction = 'submit' | 'execute';

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function formatHydraError(error: unknown, action: HydraAction): string {
  const message = errorText(error).toLowerCase();

  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Transaction rejected in the wallet.';
  }

  if (message.includes('insufficient funds')) {
    return 'The connected wallet needs MON to pay network gas.';
  }

  if (message.includes('hydraguard: not submitter')) {
    return 'Reconnect the wallet that submitted this transaction.';
  }

  if (message.includes('hydraguard: incorrect value')) {
    return 'The wallet must provide the exact approved MON amount.';
  }

  if (
    message.includes('rpc endpoint returned http') ||
    message.includes('http request failed') ||
    message.includes('failed to fetch') ||
    message.includes('network request failed')
  ) {
    return 'Your wallet cannot reach the Monad Testnet RPC. Re-add Monad Testnet in the wallet, then retry.';
  }

  if (message.includes('chain mismatch') || message.includes('chain not configured')) {
    return 'Switch the wallet to Monad Testnet before continuing.';
  }

  if (message.includes('hydraguard: insufficient approvals')) {
    return 'This transaction has not reached the 2-of-3 approval threshold.';
  }

  if (message.includes('hydraguard: execution failed')) {
    return 'Execution reverted. Check the HydraGuard balance and target call.';
  }

  return action === 'submit'
    ? 'Transaction submission failed. Check the wallet network and try again.'
    : 'Transaction execution failed. Check the wallet network and try again.';
}
