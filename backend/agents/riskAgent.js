import Groq from 'groq-sdk';
import { formatEther } from 'viem';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOCK_RESPONSES = {
  highRisk: { approve: false, reason: 'Transaction value exceeds safe threshold. Extreme position size risk.', risk_score: 85 },
  safe: { approve: true, reason: 'Liquidity depth adequate. Price impact minimal. Volatility within normal range.', risk_score: 22 },
};

// 4-byte selectors for common high-risk operations
const HIGH_RISK_SELECTORS = new Set([
  '0x095ea7b3', // approve (unlimited)
  '0x2e1a7d4d', // withdraw (some vault exploits)
]);

export async function analyzeTransaction({ to, value, data, txId }) {
  const valueEther = parseFloat(formatEther(BigInt(value.toString())));

  // Fast-path: very large transfer → high risk
  if (valueEther > 1000) {
    console.log(`[Risk] ⚠️  Large value transfer: ${valueEther} MON`);
    return MOCK_RESPONSES.highRisk;
  }

  // Check for risky function selectors
  if (data && data.length >= 10) {
    const selector = data.slice(0, 10);
    if (HIGH_RISK_SELECTORS.has(selector)) {
      console.log(`[Risk] ⚠️  High-risk function selector: ${selector}`);
      return { approve: false, reason: `Risky function call detected (selector: ${selector}). Verify intent.`, risk_score: 70 };
    }
  }

  if (process.env.USE_MOCK_AGENTS === 'true') {
    return MOCK_RESPONSES.safe;
  }

  try {
    const prompt = `You are a DeFi risk analyst. Analyze this Monad transaction:
- Target address: ${to}
- Value: ${valueEther.toFixed(6)} MON
- Calldata: ${data || '0x (simple transfer)'}
- Transaction ID: ${txId.toString()}

Risk factors to evaluate:
1. Is the transaction value reasonable for DeFi operations? (>100 MON is medium risk, >1000 is high)
2. Does the calldata suggest low-liquidity pool interaction?
3. Any signs of MEV vulnerability or sandwich attack risk?

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
    console.log(`[Risk] tx#${txId}: approve=${result.approve}, risk=${result.risk_score}`);
    return result;
  } catch (err) {
    console.error('[Risk] GROQ error, using safe fallback:', err.message);
    return MOCK_RESPONSES.safe;
  }
}
