import { publicClient, securityWallet, riskWallet, portfolioWallet } from './lib/viemClient.js';
import { HYDRA_GUARD_ABI, HYDRA_GUARD_ADDRESS } from './lib/contractABI.js';
import { analyzeTransaction as securityAnalyze } from './agents/securityAgent.js';
import { analyzeTransaction as riskAnalyze } from './agents/riskAgent.js';
import { analyzeTransaction as portfolioAnalyze } from './agents/portfolioAgent.js';

const AGENT_LABELS = {
  [securityWallet.account.address.toLowerCase()]: 'Security',
  [riskWallet.account.address.toLowerCase()]: 'Risk',
  [portfolioWallet.account.address.toLowerCase()]: 'Portfolio',
};

async function submitVote(txId, result, wallet, label) {
  const riskScore = BigInt(Math.min(100, Math.max(0, Math.round(result.risk_score ?? 50))));
  const reason = String(result.reason ?? 'No reason provided').slice(0, 200);

  const hash = await wallet.client.writeContract({
    address: HYDRA_GUARD_ADDRESS,
    abi: HYDRA_GUARD_ABI,
    functionName: 'agentVote',
    args: [BigInt(txId.toString()), result.approve === true, reason, riskScore],
    account: wallet.account,
  });

  console.log(`[${label}] ${result.approve ? '✅ APPROVED' : '❌ REJECTED'} | risk=${result.risk_score} | tx: ${hash}`);
  return hash;
}

export function startOrchestrator() {
  if (!HYDRA_GUARD_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not set in .env');
  }

  console.log('🐉 HYDRA Orchestrator started');
  console.log(`   Contract: ${HYDRA_GUARD_ADDRESS}`);
  console.log(`   Security Agent: ${securityWallet.account.address}`);
  console.log(`   Risk Agent:     ${riskWallet.account.address}`);
  console.log(`   Portfolio Agent:${portfolioWallet.account.address}`);
  console.log('   Watching for TransactionSubmitted events...\n');

  publicClient.watchContractEvent({
    address: HYDRA_GUARD_ADDRESS,
    abi: HYDRA_GUARD_ABI,
    eventName: 'TransactionSubmitted',
    pollingInterval: 2000,
    onLogs: async (logs) => {
      for (const log of logs) {
        const { txId, to, value } = log.args;
        const valueMON = (Number(value) / 1e18).toFixed(6);

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🆕 Transaction #${txId} submitted`);
        console.log(`   To:    ${to}`);
        console.log(`   Value: ${valueMON} MON`);
        console.log(`   Block: ${log.blockNumber}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        const data = log.args.data || '0x';

        // ─── STEP 1: Run 3 agents IN PARALLEL ───────────────────────────────
        console.log('⚡ Running parallel agent analysis...');
        const startTime = Date.now();

        const [securityResult, riskResult, portfolioResult] = await Promise.all([
          securityAnalyze({ to, value: value.toString(), data, txId }),
          riskAnalyze({ to, value: value.toString(), data, txId }),
          portfolioAnalyze({ to, value: value.toString(), txId }),
        ]);

        console.log(`   Analysis complete in ${Date.now() - startTime}ms`);

        // ─── STEP 2: Submit 3 votes IN PARALLEL → same Monad block ──────────
        console.log('⚡ Submitting parallel votes to Monad...');
        const voteStart = Date.now();

        const [h1, h2, h3] = await Promise.all([
          submitVote(txId, securityResult, securityWallet, 'Security'),
          submitVote(txId, riskResult, riskWallet, 'Risk'),
          submitVote(txId, portfolioResult, portfolioWallet, 'Portfolio'),
        ]);

        console.log(`   Votes submitted in ${Date.now() - voteStart}ms`);
        console.log('\n   Vote tx hashes (check these are same block on Monad Explorer!):');
        console.log(`   Security:  ${h1}`);
        console.log(`   Risk:      ${h2}`);
        console.log(`   Portfolio: ${h3}`);

        // ─── Tally ───────────────────────────────────────────────────────────
        const approvals = [securityResult, riskResult, portfolioResult].filter(r => r.approve).length;
        console.log(`\n   Result: ${approvals}/3 approved`);
        if (approvals >= 2) {
          console.log(`   ✅ HYDRA APPROVED — transaction can be executed`);
        } else {
          console.log(`   ❌ HYDRA REJECTED — transaction blocked`);
        }
        console.log('');
      }
    },
    onError: (err) => {
      console.error('Orchestrator event watch error:', err.message);
    },
  });
}
