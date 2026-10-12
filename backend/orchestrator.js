import { publicClient, securityWallet, riskWallet, portfolioWallet } from './lib/viemClient.js';
import { HYDRA_GUARD_ABI, HYDRA_GUARD_ADDRESS } from './lib/contractABI.js';
import { analyzeTransaction as securityAnalyze } from './agents/securityAgent.js';
import { analyzeTransaction as riskAnalyze } from './agents/riskAgent.js';
import { analyzeTransaction as portfolioAnalyze } from './agents/portfolioAgent.js';

async function submitVote(txId, result, wallet, label) {
  const riskScore = BigInt(Math.min(100, Math.max(0, Math.round(result.risk_score ?? 50))));
  const reason = String(result.reason ?? 'No reason provided').slice(0, 200);

  try {
    const hash = await wallet.client.writeContract({
      address: HYDRA_GUARD_ADDRESS,
      abi: HYDRA_GUARD_ABI,
      functionName: 'agentVote',
      args: [BigInt(txId.toString()), result.approve === true, reason, riskScore],
      account: wallet.account,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 15000 });
    if (receipt.status === 'reverted') {
      console.log(`[${label}] ⏭️  Vote reverted (tx already resolved) | risk=${result.risk_score}`);
      return { hash, landed: false, resolved: true };
    }

    console.log(`[${label}] ${result.approve ? '✅ APPROVED' : '❌ REJECTED'} | risk=${result.risk_score} | block: ${receipt.blockNumber}`);
    return { hash, landed: true, resolved: false };
  } catch (err) {
    console.log(`[${label}] ⏭️  Skipped (${err.shortMessage || err.message}) | risk=${result.risk_score}`);
    return { hash: null, landed: false, resolved: true };
  }
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

        // ─── STEP 2: Submit votes ──────────────────────────────────────────
        const allResults = [securityResult, riskResult, portfolioResult];
        const rejectCount = allResults.filter(r => !r.approve).length;

        const allVotes = [
          { result: securityResult, wallet: securityWallet, label: 'Security' },
          { result: riskResult, wallet: riskWallet, label: 'Risk' },
          { result: portfolioResult, wallet: portfolioWallet, label: 'Portfolio' },
        ];

        const voteStart = Date.now();

        if (rejectCount >= 2) {
          // Sequential: rejections trigger _tryResolve which can close the tx mid-flight
          console.log('⚡ Submitting votes sequentially (rejection path)...');
          for (const { result: res, wallet, label } of allVotes) {
            const r = await submitVote(txId, res, wallet, label);
            if (r.resolved) {
              console.log(`   ⏭️  Remaining votes skipped (tx resolved)`);
              break;
            }
          }
        } else {
          // Parallel: approvals don't trigger _tryResolve, independent vote slots = zero contention
          console.log('⚡ Submitting votes in PARALLEL (approval path → same Monad block)...');
          await Promise.all(allVotes.map(({ result: res, wallet, label }) =>
            submitVote(txId, res, wallet, label)
          ));
        }

        console.log(`   Done in ${Date.now() - voteStart}ms`);

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
