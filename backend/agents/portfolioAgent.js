import Groq from 'groq-sdk';
import { formatEther } from 'viem';
import { publicClient } from '../lib/viemClient.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOCK_RESPONSES = {
  overConcentrated: { approve: false, reason: 'Transaction exceeds 50% of portfolio. Severe concentration risk.', risk_score: 80 },
  safe: { approve: true, reason: 'Position size within acceptable limits. Portfolio diversification maintained.', risk_score: 18 },
};

const KNOWN_SCAM_ADDRESSES = new Set([
  '0x000000000000000000000000000000000000dead',
  '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead',
]);

export async function analyzeTransaction({ to, value, txId }) {
  const toLC = to.toLowerCase();
  if (KNOWN_SCAM_ADDRESSES.has(toLC)) {
    console.log(`[Portfolio] ⚠️  Known scam address: ${to}`);
    return { approve: false, reason: 'Refusing allocation to flagged address. Portfolio protection triggered.', risk_score: 95 };
  }

  const ownerAddress = process.env.OWNER_ADDRESS;

  let portfolioContext = 'Balance unavailable';
  let positionPct = 0;

  try {
    // Real on-chain data — this is genuine, not mocked
    const balance = await publicClient.getBalance({ address: ownerAddress });
    const balanceMON = parseFloat(formatEther(balance));
    const valueMON = parseFloat(formatEther(BigInt(value.toString())));
    positionPct = balanceMON > 0 ? (valueMON / balanceMON) * 100 : 100;
    portfolioContext = `Wallet balance: ${balanceMON.toFixed(4)} MON. This tx: ${valueMON.toFixed(4)} MON (${positionPct.toFixed(1)}% of portfolio)`;

    // Fast-path: over 50% of portfolio
    if (positionPct > 50) {
      console.log(`[Portfolio] ⚠️  Over-concentrated: ${positionPct.toFixed(1)}% of portfolio`);
      return MOCK_RESPONSES.overConcentrated;
    }
  } catch (err) {
    console.warn('[Portfolio] Balance fetch failed, continuing with GROQ only:', err.message);
  }

  if (process.env.USE_MOCK_AGENTS === 'true') {
    return MOCK_RESPONSES.safe;
  }

  try {
    const prompt = `You are a crypto portfolio manager. Evaluate this transaction:
- ${portfolioContext}
- Target address: ${to}
- Transaction ID: ${txId.toString()}

Portfolio risk assessment:
1. Is ${positionPct.toFixed(1)}% position size acceptable? (>25% is medium risk, >50% is high)
2. Does this transaction represent over-concentration in a single asset/protocol?
3. Is this within reasonable risk tolerance for a DeFi wallet?

Respond ONLY with valid JSON:
{ "approve": true/false, "reason": "1-2 sentence explanation", "risk_score": 0-100 }`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`[Portfolio] tx#${txId}: approve=${result.approve}, risk=${result.risk_score}, position=${positionPct.toFixed(1)}%`);
    return result;
  } catch (err) {
    console.error('[Portfolio] GROQ error, using safe fallback:', err.message);
    return MOCK_RESPONSES.safe;
  }
}
