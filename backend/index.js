import 'dotenv/config';
import { startOrchestrator } from './orchestrator.js';

// Validate required env vars
const required = ['AGENT1_KEY', 'AGENT2_KEY', 'AGENT3_KEY', 'CONTRACT_ADDRESS', 'OWNER_ADDRESS'];
const missing = required.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Create a .env file based on .env.example');
  process.exit(1);
}

if (!process.env.GROQ_API_KEY && process.env.USE_MOCK_AGENTS !== 'true') {
  console.warn('⚠️  GROQ_API_KEY not set — set USE_MOCK_AGENTS=true for demo mode');
}

startOrchestrator();
