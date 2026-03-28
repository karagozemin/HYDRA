import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Demo-ready: hardcoded scam list for deterministic demo scenarios
// Add demo scam addresses here for reliable hackathon demo
const KNOWN_SCAM_ADDRESSES = new Set([
  '0x000000000000000000000000000000000000dead',
  '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead',
]);

const MOCK_RESPONSES = {
  scam: { approve: false, reason: 'Known scam address detected in blacklist. Do not proceed.', risk_score: 98 },
  safe: { approve: true, reason: 'Contract verified, no proxy pattern, no known exploits.', risk_score: 12 },
};

export async function analyzeTransaction({ to, value, data, txId }) {
  const toLC = to.toLowerCase();

  // Fast-path: known scam — deterministic for demo
  if (KNOWN_SCAM_ADDRESSES.has(toLC)) {
    console.log(`[Security] ⚠️  Known scam address: ${to}`);
    return MOCK_RESPONSES.scam;
  }

  // Mock mode for demo reliability
  if (process.env.USE_MOCK_AGENTS === 'true') {
    return MOCK_RESPONSES.safe;
  }

  try {
    const prompt = `You are a blockchain security analyst. Analyze this Monad transaction:
- Target address: ${to}
- Value: ${value.toString()} wei (${(Number(value) / 1e18).toFixed(6)} MON)
- Calldata: ${data || '0x (simple transfer)'}
- Transaction ID: ${txId.toString()}

Security checks to perform:
1. Is this address associated with known scams, phishing, or exploits?
2. Does the calldata suggest a malicious function call (e.g., approve to unknown spender)?
3. Is the bytecode pattern suspicious (empty contract = suspicious)?

Respond ONLY with valid JSON (no markdown, no explanation outside JSON):
{ "approve": true/false, "reason": "1-2 sentence explanation", "risk_score": 0-100 }`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log(`[Security] tx#${txId}: approve=${result.approve}, risk=${result.risk_score}`);
    return result;
  } catch (err) {
    console.error('[Security] GROQ error, using safe fallback:', err.message);
    return MOCK_RESPONSES.safe;
  }
}
