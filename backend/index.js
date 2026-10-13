import 'dotenv/config';
import { createServer } from 'http';
import { startOrchestrator, getActivity } from './orchestrator.js';

// API server
const PORT = process.env.PORT || 3001;
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname === '/health') {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
  } else if (url.pathname === '/status') {
    const activity = getActivity();
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      contract: process.env.CONTRACT_ADDRESS,
      totalProcessed: activity.length,
      recentActivity: activity.slice(-20),
    }));
  } else {
    res.writeHead(404, CORS_HEADERS);
    res.end(JSON.stringify({ error: 'not found' }));
  }
}).listen(PORT, () => console.log(`API listening on port ${PORT}`));

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
