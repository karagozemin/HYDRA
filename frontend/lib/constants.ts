export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const AGENT1_ADDRESS = (process.env.NEXT_PUBLIC_AGENT1_ADDRESS || '') as `0x${string}`;
export const AGENT2_ADDRESS = (process.env.NEXT_PUBLIC_AGENT2_ADDRESS || '') as `0x${string}`;
export const AGENT3_ADDRESS = (process.env.NEXT_PUBLIC_AGENT3_ADDRESS || '') as `0x${string}`;

export const AGENT_NAMES: Record<string, string> = {
  [AGENT1_ADDRESS.toLowerCase()]: 'Security Agent',
  [AGENT2_ADDRESS.toLowerCase()]: 'Risk Agent',
  [AGENT3_ADDRESS.toLowerCase()]: 'Portfolio Agent',
};

export const AGENT_ICONS: Record<string, string> = {
  [AGENT1_ADDRESS.toLowerCase()]: '🛡️',
  [AGENT2_ADDRESS.toLowerCase()]: '📊',
  [AGENT3_ADDRESS.toLowerCase()]: '💼',
};

export const HYDRA_ABI = [
  {
    "type": "function",
    "name": "submitTransaction",
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "data", "type": "bytes" }
    ],
    "outputs": [{ "name": "txId", "type": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeTransaction",
    "inputs": [{ "name": "txId", "type": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTransaction",
    "inputs": [{ "name": "txId", "type": "uint256" }],
    "outputs": [
      { "name": "to", "type": "address" },
      { "name": "value", "type": "uint256" },
      { "name": "executed", "type": "bool" },
      { "name": "rejected", "type": "bool" },
      { "name": "approvalCount", "type": "uint256" },
      { "name": "rejectionCount", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVote",
    "inputs": [
      { "name": "txId", "type": "uint256" },
      { "name": "agent", "type": "address" }
    ],
    "outputs": [
      { "name": "hasVoted", "type": "bool" },
      { "name": "approve", "type": "bool" },
      { "name": "reason", "type": "string" },
      { "name": "riskScore", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canExecute",
    "inputs": [{ "name": "txId", "type": "uint256" }],
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "txCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgents",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[3]" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TransactionSubmitted",
    "inputs": [
      { "name": "txId", "type": "uint256", "indexed": true },
      { "name": "to", "type": "address", "indexed": true },
      { "name": "value", "type": "uint256", "indexed": false },
      { "name": "submittedBy", "type": "address", "indexed": true }
    ]
  },
  {
    "type": "event",
    "name": "AgentVoted",
    "inputs": [
      { "name": "txId", "type": "uint256", "indexed": true },
      { "name": "agent", "type": "address", "indexed": true },
      { "name": "approved", "type": "bool", "indexed": false },
      { "name": "reason", "type": "string", "indexed": false },
      { "name": "riskScore", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "TransactionExecuted",
    "inputs": [{ "name": "txId", "type": "uint256", "indexed": true }]
  },
  {
    "type": "event",
    "name": "TransactionRejected",
    "inputs": [{ "name": "txId", "type": "uint256", "indexed": true }]
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  }
] as const;
