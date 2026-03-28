export const HYDRA_GUARD_ADDRESS = process.env.CONTRACT_ADDRESS;

export const HYDRA_GUARD_ABI = [
  {
    "type": "constructor",
    "inputs": [
      { "name": "_owner", "type": "address", "internalType": "address" },
      { "name": "_agent1", "type": "address", "internalType": "address" },
      { "name": "_agent2", "type": "address", "internalType": "address" },
      { "name": "_agent3", "type": "address", "internalType": "address" }
    ],
    "stateMutability": "nonpayable"
  },
  { "type": "receive", "stateMutability": "payable" },
  {
    "type": "function",
    "name": "agentVote",
    "inputs": [
      { "name": "txId", "type": "uint256", "internalType": "uint256" },
      { "name": "approve", "type": "bool", "internalType": "bool" },
      { "name": "reason", "type": "string", "internalType": "string" },
      { "name": "riskScore", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "submitTransaction",
    "inputs": [
      { "name": "to", "type": "address", "internalType": "address" },
      { "name": "value", "type": "uint256", "internalType": "uint256" },
      { "name": "data", "type": "bytes", "internalType": "bytes" }
    ],
    "outputs": [{ "name": "txId", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeTransaction",
    "inputs": [{ "name": "txId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getTransaction",
    "inputs": [{ "name": "txId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [
      { "name": "to", "type": "address", "internalType": "address" },
      { "name": "value", "type": "uint256", "internalType": "uint256" },
      { "name": "executed", "type": "bool", "internalType": "bool" },
      { "name": "rejected", "type": "bool", "internalType": "bool" },
      { "name": "approvalCount", "type": "uint256", "internalType": "uint256" },
      { "name": "rejectionCount", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVote",
    "inputs": [
      { "name": "txId", "type": "uint256", "internalType": "uint256" },
      { "name": "agent", "type": "address", "internalType": "address" }
    ],
    "outputs": [
      { "name": "hasVoted", "type": "bool", "internalType": "bool" },
      { "name": "approve", "type": "bool", "internalType": "bool" },
      { "name": "reason", "type": "string", "internalType": "string" },
      { "name": "riskScore", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "canExecute",
    "inputs": [{ "name": "txId", "type": "uint256", "internalType": "uint256" }],
    "outputs": [{ "name": "", "type": "bool", "internalType": "bool" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "txCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256", "internalType": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getAgents",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address[3]", "internalType": "address[3]" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "TransactionSubmitted",
    "inputs": [
      { "name": "txId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "to", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "value", "type": "uint256", "indexed": false, "internalType": "uint256" },
      { "name": "submittedBy", "type": "address", "indexed": true, "internalType": "address" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "AgentVoted",
    "inputs": [
      { "name": "txId", "type": "uint256", "indexed": true, "internalType": "uint256" },
      { "name": "agent", "type": "address", "indexed": true, "internalType": "address" },
      { "name": "approved", "type": "bool", "indexed": false, "internalType": "bool" },
      { "name": "reason", "type": "string", "indexed": false, "internalType": "string" },
      { "name": "riskScore", "type": "uint256", "indexed": false, "internalType": "uint256" }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TransactionExecuted",
    "inputs": [{ "name": "txId", "type": "uint256", "indexed": true, "internalType": "uint256" }],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "TransactionRejected",
    "inputs": [{ "name": "txId", "type": "uint256", "indexed": true, "internalType": "uint256" }],
    "anonymous": false
  }
];
