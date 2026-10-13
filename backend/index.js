import 'dotenv/config';
import { createServer } from 'http';
import { startOrchestrator } from './orchestrator.js';

// Health check server
const PORT = process.env.PORT || 3001;
createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(PORT, () => console.log(`Health check listening on port ${PORT}`));

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
