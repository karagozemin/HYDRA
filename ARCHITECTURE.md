# HYDRA Architecture

> Honest, complete technical documentation of how HYDRA works.

---

## Overview

HYDRA is a multisig wallet where 3 AI agents replace human signers. When the wallet owner submits a transaction, 3 independent AI agents analyze it in parallel and vote on-chain. If 2-of-3 approve, the transaction can be executed. Otherwise, it's blocked.

The system has three layers:

1. **Smart Contract** (Solidity on Monad) — holds funds, records votes, enforces 2-of-3 threshold
2. **Backend Orchestrator** (Node.js) — listens for on-chain events, runs 3 AI agents, submits votes
3. **Frontend** (Next.js) — wallet connection, transaction submission, real-time vote display

---

## Transaction Lifecycle

```
1. Owner submits tx via frontend → calls submitTransaction(to, value, data) on contract
2. Contract emits TransactionSubmitted event
3. Backend orchestrator catches the event
4. Orchestrator runs 3 agents in parallel (Promise.all)
   - Each agent: hardcoded checks + GROQ Llama 3.3 70B prompt
   - Each returns: { approve: bool, reason: string, risk_score: 0-100 }
5. Orchestrator submits 3 agentVote() transactions to the contract
   - If 2+ rejections: votes submitted sequentially (early exit on resolve)
   - If majority approve: votes submitted in parallel (can land in same Monad block)
6. Contract counts votes, auto-rejects if 2+ rejections via _tryResolve()
7. Frontend polls contract state, displays votes with staggered animation
8. If 2/3 approved: owner can call executeTransaction() to transfer funds
```

---

## Smart Contract: HydraGuard.sol

**Language:** Solidity 0.8.24
**Framework:** Foundry
**Deployed on:** Monad Testnet (Chain ID: 10143)

### Storage Layout

```solidity
address public owner;                          // wallet owner, can submit + execute
address[3] public agents;                      // 3 agent wallet addresses
uint256 public txCount;                        // incremental transaction counter
uint256 public constant THRESHOLD = 2;         // 2-of-3 majority

mapping(uint256 => Transaction) public transactions;           // txId → tx data
mapping(uint256 => mapping(address => Vote)) public votes;     // txId → agent → vote
mapping(address => uint256) public agentReputation;            // agent → approval count
```

### Why the Storage Layout Matters for Monad

`votes[txId][agent1]`, `votes[txId][agent2]`, `votes[txId][agent3]` map to **different storage slots**. On Monad's parallel EVM, transactions that touch different storage slots execute simultaneously without contention. This means all 3 agent votes can theoretically land in the same block.

**Important caveat:** This parallelism depends on Monad's scheduler. The votes are submitted as 3 separate transactions from 3 different wallets — whether they actually land in the same block depends on network conditions, gas, and block timing. In practice during testing, they often do land in the same block, but it's not guaranteed by the application logic.

### Core Functions

| Function | Access | What it does |
|----------|--------|-------------|
| `submitTransaction(to, value, data)` | Owner only | Creates a new tx, increments txCount, emits event |
| `agentVote(txId, approve, reason, riskScore)` | Agent only | Records vote, increments approval/rejection count, calls `_tryResolve` |
| `executeTransaction(txId)` | Owner only | Transfers funds via low-level `call{value}(data)`, requires 2+ approvals |
| `_tryResolve(txId)` | Internal | If `rejectionCount > 1`, marks tx as rejected (early exit) |

### What the Contract Does NOT Do

- No timeouts — a transaction with <3 votes stays pending forever on-chain
- No gas refunds or compensation for agents
- No upgradeability — contract is immutable once deployed
- No token transfers — only native MON (via `msg.value`)
- `agentReputation` is just a counter that increments on approvals — it has no effect on voting power or behavior

### Tests

`contracts/test/HydraGuard.t.sol` — 197 lines covering:
- Submit/vote/execute happy path
- Double-vote prevention
- Auto-rejection at 2+ rejections
- Access control (onlyOwner, onlyAgent)
- Threshold enforcement

---

## Backend: Orchestrator + 3 Agents

**Runtime:** Node.js (ESM)
**Dependencies:** viem v2, groq-sdk, dotenv

### Orchestrator (`orchestrator.js`)

The orchestrator is a long-running Node.js process that:

1. Creates a viem `publicClient` and 3 `walletClient`s (one per agent, each with its own private key)
2. Watches for `TransactionSubmitted` events on the contract (polling every 2 seconds)
3. When an event fires, runs all 3 agent analysis functions via `Promise.all`
4. Submits votes to the contract

**Vote submission strategy:**
- If 2+ agents rejected → submits votes **sequentially**. This is because each rejection triggers `_tryResolve()` which can mark the tx as rejected, causing subsequent votes to revert. Sequential submission lets the orchestrator skip remaining votes after resolution.
- If majority approved → submits votes **in parallel**. Approval votes don't trigger resolution, so there's no revert risk. Parallel submission means all 3 vote transactions are broadcast at once, giving them the best chance of landing in the same Monad block.

### Agent Analysis Pipeline

Each agent follows the same pattern:

```
1. Check hardcoded scam blacklist (2 addresses: 0x...dead variants)
   → If match: return reject immediately, no LLM call

2. Agent-specific fast-path checks (varies per agent)
   → If triggered: return result immediately, no LLM call

3. If USE_MOCK_AGENTS=true: return hardcoded safe response
   → For demo reliability when GROQ is unavailable

4. Send prompt to GROQ Llama 3.3 70B (temperature=0.1, max_tokens=150)
   → Response format enforced as JSON
   → Parse response: { approve, reason, risk_score }

5. On GROQ error: fall back to hardcoded safe response (approve=true)
```

**The fallback behavior is worth noting:** if GROQ fails, all 3 agents default to **approving** the transaction. This is a design choice for demo reliability — in production, failing open like this would be a security concern.

### Security Agent (`securityAgent.js`)

**Hardcoded checks:**
- Scam address blacklist (2 addresses)

**No other fast-path checks.** Beyond the blacklist, everything goes to the LLM.

**LLM prompt asks about:**
- Known scam/phishing/exploit association
- Malicious calldata (e.g., `approve` to unknown spender)
- Suspicious bytecode patterns

**What it does NOT do:**
- Does not actually fetch or analyze contract bytecode
- Does not query any external scam databases or APIs
- Does not verify contracts on a block explorer
- The LLM is making judgments based only on the address string, value, and calldata provided in the prompt

### Risk Agent (`riskAgent.js`)

**Hardcoded checks:**
- Scam address blacklist (same 2 addresses)
- Value > 1000 MON → auto-reject
- Calldata starts with `0x095ea7b3` (approve) or `0x2e1a7d4d` (withdraw) → auto-reject

**LLM prompt asks about:**
- Whether the value is reasonable for DeFi operations
- Low-liquidity pool interaction
- MEV/sandwich attack risk

**What it does NOT do:**
- Does not check actual DEX liquidity or pool data
- Does not simulate the transaction
- Does not check mempool for sandwich attacks
- Value threshold (1000 MON) is a static number, not relative to anything

### Portfolio Agent (`portfolioAgent.js`)

**This is the only agent that reads real on-chain data beyond the event payload.**

**On-chain check:**
- Fetches the owner's wallet balance via `publicClient.getBalance()`
- Calculates `positionPct = (txValue / walletBalance) * 100`
- If positionPct > 50% → auto-reject

**LLM prompt includes:**
- Real wallet balance and position percentage
- Asks about concentration risk and diversification

**What it does NOT do:**
- Does not track token holdings, only native MON balance
- Does not know about tokens, NFTs, or DeFi positions
- "Portfolio" is just the native MON balance — not a full portfolio view

### Shared Scam Blacklist

All 3 agents check the same 2 hardcoded addresses:
```
0x000000000000000000000000000000000000dead
0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead
```

These exist primarily for deterministic demo scenarios. There is no external scam database integration.

---

## Frontend

**Framework:** Next.js 14 (App Router)
**Web3:** wagmi v2, viem v2, RainbowKit v2
**Styling:** Tailwind CSS
**State:** React hooks (no external state management)

### How the Frontend Reads Agent Votes

The frontend does NOT use WebSocket or event subscriptions directly. Instead:

1. `useGetVote(txId, agentAddress)` — calls `getVote()` view function on contract, polls every 1 second
2. When a vote is detected (hasVoted = true), it extracts: approve, reason, riskScore
3. Results are displayed with a staggered reveal animation (first card at 800ms, rest at 500-900ms intervals)

### Parallel Execution Proof (`ParallelProof.tsx`)

After all 3 agents vote, the frontend fetches `AgentVoted` event logs and extracts the block number from each vote transaction receipt. If all 3 share the same block number, a "Parallel Execution Proven" banner is displayed.

**This proves the votes landed in the same block, not that they were executed in parallel.** Same block ≠ parallel execution — Monad's scheduler determines actual parallelism. But same-block inclusion does demonstrate that the independent storage slot design works as intended.

### Key UI States

| State | What's shown |
|-------|-------------|
| Not connected | Landing page with project info |
| Idle | "Submit a transaction to activate the AI guardians" |
| Wallet | "Confirm in your wallet..." (waiting for MetaMask) |
| Confirming | "Confirming on Monad..." with progress bar |
| Analyzing | 3 agent cards cycling through analysis messages |
| Approved (2/3+) | Green banner + Execute button |
| Rejected | Red banner: "HYDRA protected your wallet" |
| Executed | Success banner with tx hash link |
| Timeout (30s) | Yellow banner: "Agents did not respond in time" |

### Transaction History

- Reads last 10 transactions from contract (only visible to contract owner)
- Polls every 5 seconds
- Shows: txId, recipient, amount, approval count, status

### Agent Reputation

- Reads `agentReputation(agentAddress)` for each agent
- Just a counter of how many times each agent has approved
- Displayed as progress bars, updated every 5 seconds

---

## What HYDRA Does Well

1. **Real on-chain voting** — votes are actual transactions on Monad, not off-chain signatures
2. **Parallel vote submission** — 3 separate wallets submit simultaneously, leveraging independent storage slots
3. **Deterministic demo path** — hardcoded scam addresses guarantee rejection for demos
4. **Real balance check** — Portfolio Agent fetches actual on-chain balance, not a mock
5. **Auto-resolution** — contract rejects at 2 rejections without waiting for all votes
6. **Clean separation** — contract knows nothing about AI; backend knows nothing about UI

## What HYDRA Does NOT Do (Honest Limitations)

1. **LLM analysis is prompt-based, not tool-based** — agents don't call external APIs, fetch bytecode, query scam databases, or simulate transactions. They send a text prompt to GROQ and trust the LLM's training data.
2. **Scam detection is a 2-address blacklist + LLM guessing** — there's no integration with GoPlus, Forta, or any real threat intelligence feed.
3. **"Portfolio analysis" is native balance only** — no ERC-20 tokens, no DeFi positions, no NFTs. Just `address.balance`.
4. **Fails open** — if GROQ is down, all agents approve by default. In production this would be dangerous.
5. **No real MEV protection** — the Risk Agent asks the LLM about MEV, but doesn't actually check mempool or simulate.
6. **Same-block ≠ proven parallelism** — the ParallelProof banner shows same block number, which is necessary but not sufficient proof of parallel EVM execution.
7. **No timeout on-chain** — if the backend goes down, pending transactions stay pending forever in the contract.
8. **Single owner** — only one address can submit and execute. Not a multi-user wallet.
9. **Reputation has no effect** — `agentReputation` is a counter for display. It doesn't influence voting weight or behavior.

---

## Environment Variables

### Backend (`.env`)
```
AGENT1_KEY=         # Private key for Security Agent wallet
AGENT2_KEY=         # Private key for Risk Agent wallet
AGENT3_KEY=         # Private key for Portfolio Agent wallet
CONTRACT_ADDRESS=   # Deployed HydraGuard address
OWNER_ADDRESS=      # Wallet owner address (for portfolio balance check)
GROQ_API_KEY=       # GROQ API key for Llama 3.3 70B
USE_MOCK_AGENTS=    # "true" to bypass GROQ (hardcoded responses)
RPC_URL=            # Monad Testnet RPC (default: https://testnet-rpc.monad.xyz)
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_WALLETCONNECT_ID=     # WalletConnect project ID
NEXT_PUBLIC_CONTRACT_ADDRESS=     # Same deployed HydraGuard address
NEXT_PUBLIC_AGENT1_ADDRESS=       # Security Agent public address
NEXT_PUBLIC_AGENT2_ADDRESS=       # Risk Agent public address
NEXT_PUBLIC_AGENT3_ADDRESS=       # Portfolio Agent public address
```

---

## Project Structure

```
HYDRA/
├── contracts/
│   ├── src/HydraGuard.sol              # Multisig contract (2-of-3 voting)
│   ├── test/HydraGuard.t.sol           # Foundry tests
│   ├── script/Deploy.s.sol             # Deployment script
│   └── foundry.toml                    # Solidity 0.8.24
├── backend/
│   ├── index.js                        # Entry point (env validation)
│   ├── orchestrator.js                 # Event watcher + vote coordinator
│   ├── agents/
│   │   ├── securityAgent.js            # Blacklist + LLM security check
│   │   ├── riskAgent.js                # Value/selector checks + LLM risk
│   │   └── portfolioAgent.js           # On-chain balance + LLM portfolio
│   ├── lib/
│   │   ├── viemClient.js               # 1 public + 3 wallet clients
│   │   └── contractABI.js              # Contract ABI + address
│   └── config/monad.js                 # Chain definition
└── frontend/
    ├── app/
    │   ├── page.tsx                     # Landing page + dashboard
    │   ├── layout.tsx                   # Root layout + metadata
    │   └── providers.tsx               # Wagmi + RainbowKit setup
    ├── components/
    │   ├── AgentPanel.tsx              # 3 agent cards + execute flow
    │   ├── AgentCard.tsx               # Individual agent (5 states)
    │   ├── TransactionForm.tsx         # Submit tx form + demo buttons
    │   ├── TransactionHistory.tsx      # Last 10 txs (owner-only)
    │   ├── AgentReputation.tsx         # Approval count bars
    │   ├── ParallelProof.tsx           # Same-block proof display
    │   ├── ConnectWallet.tsx           # RainbowKit wrapper
    │   └── WrongNetworkBanner.tsx      # Auto-switch to Monad
    ├── hooks/
    │   ├── useHydraContract.ts         # Submit/execute/read hooks
    │   └── useAgentStatus.ts           # Event-based vote watcher
    └── lib/
        ├── constants.ts                # Addresses + ABI + agent metadata
        └── wagmiConfig.ts              # Monad chain config
```

---

## Tech Stack (Actual Versions)

| Component | Technology | Version |
|-----------|-----------|---------|
| Smart Contract | Solidity + Foundry | 0.8.24 |
| Backend Runtime | Node.js (ESM) | 18+ |
| Blockchain Client | viem | 2.21.0 |
| AI Inference | GROQ (Llama 3.3 70B Versatile) | groq-sdk 0.7.0 |
| Frontend Framework | Next.js (App Router) | 14.2.35 |
| Web3 Hooks | wagmi | 2.12.0 |
| Wallet UI | RainbowKit | 2.1.6 |
| Styling | Tailwind CSS | 3.4.1 |
| Network | Monad Testnet | Chain ID 10143 |
