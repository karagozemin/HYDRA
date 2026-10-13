<p align="center">
  <img src="hydra.png" alt="HYDRA Logo" width="120" />
</p>

<h1 align="center">HYDRA</h1>
<p align="center"><strong>Parallel AI Agent Multisig Wallet on Monad</strong></p>

> **Cut one head. Three more protect your wallet.**

Three independent AI agents analyze every transaction in parallel before it executes. Security. Risk. Portfolio. All in one block.

---

## What is HYDRA?

HYDRA is an AI-powered smart wallet where **3 independent AI agents** act as multisig guardians. Before any transaction executes, each agent analyzes it from a different perspective and casts an on-chain vote. **2 out of 3** must approve — otherwise the transaction is blocked.

On Monad, all 3 votes land in the **same block** thanks to parallel EVM execution — zero slot-level contention, instant results.

### The Problem

You send funds to a scam address. It's gone forever. Traditional multisigs rely on humans — slow, not 24/7, vulnerable to social engineering.

### The Solution

Replace human signers with 3 AI agents that never sleep, can't be bribed, and analyze in milliseconds:

| Agent | Role | What It Checks |
|-------|------|----------------|
| **Security Agent** | Threat Detection | Scam addresses, malicious calldata, exploit patterns |
| **Risk Agent** | Financial Risk | Transaction size, MEV vulnerability, liquidity depth |
| **Portfolio Agent** | Portfolio Health | On-chain balance, concentration risk, position sizing |

---

## Architecture

```
User (Frontend)              Smart Contract (Monad)           Backend (3 AI Agents)
     |                              |                               |
     |-- submitTransaction() ------>|                               |
     |                              |-- TransactionSubmitted ------>|
     |                              |     (event)                   |
     |                              |                               |
     |                              |      +-- Security Agent --+   |
     |                              |      |   GROQ LLM         |   |
     |                              |      +-- Risk Agent ------+   |  PARALLEL
     |                              |      |   GROQ LLM         |   |  ANALYSIS
     |                              |      +-- Portfolio Agent -+   |
     |                              |      |   GROQ + on-chain  |   |
     |                              |      +--------------------+   |
     |                              |                               |
     |                              |<-- agentVote() x3 -----------|
     |                              |    (same Monad block)         |
     |                              |                               |
     |                              |-- _tryResolve()               |
     |                              |   2/3 approve -> executable   |
     |                              |   2/3 reject  -> blocked      |
     |                              |                               |
     |<-- UI updates (polling) -----|                               |
     |                              |                               |
     |-- executeTransaction() ----->|  (only if 2/3 approved)       |
     |                              |-- funds transfer -->          |
```

---

## Why Monad?

The core insight: `votes[txId][agent1]`, `votes[txId][agent2]`, `votes[txId][agent3]` are **independent storage slots**. On Monad's parallel EVM, these have zero contention — all 3 votes execute simultaneously in the same block.

| | Ethereum | Monad |
|---|---|---|
| 3 agent votes | 3 blocks (~36s) | **1 block (~1s)** |
| Storage access | Sequential | **Parallel** (independent slots) |
| User experience | Wait, wait, wait | **Instant results** |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24, Foundry |
| Backend | Node.js (ESM), viem v2, groq-sdk |
| Frontend | Next.js 14, wagmi v2, RainbowKit, Tailwind CSS |
| AI Model | Groq Llama 3.3 70B (~1200 tok/s) |
| Network | Monad Testnet (chainId: 10143) |

---

## Smart Contract: HydraGuard.sol

```solidity
// Independent storage slots — zero contention on Monad
mapping(uint256 => mapping(address => Vote)) public votes;

// Core functions
submitTransaction(to, value, data) -> txId    // Owner proposes tx
agentVote(txId, approve, reason, riskScore)   // Agent casts vote
executeTransaction(txId)                       // Execute after 2/3 approval
_tryResolve(txId)                              // Auto-reject at 2+ rejections
```

**Threshold:** 2-of-3 majority. One agent can be wrong — system still works.

**Deployed:** `0x561DFd6cf2Dd2fA86fC187093a35164F9fF0944c` (Monad Testnet)

---

## AI Agents — How They Analyze

### Security Agent
- Checks target address against known scam blacklists
- Analyzes calldata for malicious function signatures (approve to unknown spender, etc.)
- Sends transaction context to **GROQ Llama 3.3 70B** for security assessment
- Returns: `{ approve, reason, risk_score: 0-100 }`

### Risk Agent
- Flags high-value transfers (>1000 MON = auto-reject)
- Detects risky 4-byte selectors (`approve()`, `withdraw()`)
- LLM evaluates: DeFi risk, MEV/sandwich attack exposure, liquidity depth
- Returns: `{ approve, reason, risk_score: 0-100 }`

### Portfolio Agent
- **Fetches real on-chain wallet balance** via `publicClient.getBalance()`
- Calculates position size as percentage of portfolio
- Auto-rejects if tx > 50% of portfolio (over-concentration)
- LLM evaluates: diversification impact, risk tolerance
- Returns: `{ approve, reason, risk_score: 0-100 }`

---

## Frontend Features

- **Wallet Connection** — RainbowKit with auto-switch to Monad Testnet
- **Transaction Form** — Submit address + amount, demo buttons for safe/scam scenarios
- **Live Agent Panel** — Animated cards showing each agent's analysis in real-time
  - Staggered reveal with analyzing animation
  - Risk score bars with color coding (green/yellow/red)
  - Reason text from AI analysis
- **Execute Button** — Appears only after 2/3 approval
- **Transaction History** — Last 10 transactions with status badges (owner-only)
- **Clickable tx hashes** — Links to Monad Explorer
- **Parallel Execution Proof** — After all 3 agents vote, a proof banner shows each vote's block number. If all land in the same block, it displays "Parallel Execution Proven" with direct Monad Explorer links per vote tx.
- **Agent Reputation Dashboard** — Reads on-chain `agentReputation` mapping and displays each agent's approval count with progress bars. Updated every 5s.
- **Error Handling** — Wallet rejections, contract reverts, and read failures are caught and displayed inline. Agent cards show orange `ERROR` state on contract read failures. Failed executions show error below the button. Wallet rejection resets the UI phase back to idle.
- **Agent Timeout** — If agents don't respond within 30 seconds, a yellow "Agent Timeout" banner appears instead of staying stuck on "Analyzing..." forever.

---

## Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- MetaMask with Monad Testnet

### 1. Clone & Install

```bash
git clone <repo-url>
cd HYDRA

# Install all dependencies
cd contracts && forge install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Deploy Contract

```bash
cd contracts
forge create src/HydraGuard.sol:HydraGuard \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key <YOUR_KEY> \
  --broadcast \
  --constructor-args <OWNER_ADDR> <AGENT1_ADDR> <AGENT2_ADDR> <AGENT3_ADDR>
```

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
# Fill in: AGENT1_KEY, AGENT2_KEY, AGENT3_KEY, CONTRACT_ADDRESS, GROQ_API_KEY
```

### 4. Configure Frontend

```bash
cd frontend
# Create .env.local with:
NEXT_PUBLIC_WALLETCONNECT_ID=<your-project-id>
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-address>
NEXT_PUBLIC_AGENT1_ADDRESS=<agent1-address>
NEXT_PUBLIC_AGENT2_ADDRESS=<agent2-address>
NEXT_PUBLIC_AGENT3_ADDRESS=<agent3-address>
```

### 5. Fund & Run

```bash
# Fund contract with MON (for execute transfers)
# Fund each agent wallet with ~0.5 MON (for gas)

# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev
```

Open `http://localhost:3000`, connect wallet, submit a transaction.

---

## Parallel Execution Proof

After agents vote, the frontend fetches `AgentVoted` event logs and extracts the block number from each vote transaction. If all 3 votes share the same block number, a purple proof banner is rendered:

```
  Parallel Execution Proven
  All 3 votes landed in block #4821037 — Monad parallel EVM

  Security Agent    block #4821037   tx ->
  Risk Agent        block #4821037   tx ->
  Portfolio Agent   block #4821037   tx ->
```

Each vote tx links directly to Monad Explorer. No contract changes required — proof is derived from on-chain event logs.

---

## Demo Scenarios

| Scenario | Address | Expected Result |
|----------|---------|-----------------|
| **Safe Transfer** | Any valid address, small amount | 2-3/3 APPROVED, Execute button appears |
| **Scam Address** | `0x000...dEaD` | 3/3 REJECTED, "HYDRA protected your wallet" |
| **Large Transfer** | Any address, >1000 MON | Risk Agent rejects, possible block |
| **Portfolio Drain** | Any address, >50% of balance | Portfolio Agent rejects |

---

## Project Structure

```
HYDRA/
  contracts/
    src/HydraGuard.sol          # Main smart contract
    test/HydraGuard.t.sol       # 18 test cases
    script/Deploy.s.sol         # Deployment script
    foundry.toml
  backend/
    index.js                    # Entry point
    orchestrator.js             # Event listener + vote coordinator
    agents/
      securityAgent.js          # Scam detection + LLM
      riskAgent.js              # Financial risk + LLM
      portfolioAgent.js         # Portfolio health + on-chain + LLM
    lib/
      viemClient.js             # Blockchain clients
      contractABI.js            # Contract ABI
    config/monad.js             # Chain config
  frontend/
    app/
      page.tsx                  # Main dashboard
      layout.tsx                # Root layout
      providers.tsx             # Wagmi/RainbowKit setup
    components/
      TransactionForm.tsx       # Submit tx form
      AgentPanel.tsx            # Live agent voting display
      AgentCard.tsx             # Individual agent card (5 states: idle/analyzing/approved/rejected/error)
      TransactionHistory.tsx    # Tx history list (owner-only)
      AgentReputation.tsx       # On-chain reputation dashboard
      ParallelProof.tsx         # Same-block proof via event logs
      ConnectWallet.tsx         # Wallet connector
      WrongNetworkBanner.tsx    # Network switch
      HydraLogo.tsx             # Logo component
    hooks/useHydraContract.ts   # Contract interaction hooks
    lib/
      constants.ts              # Addresses + ABI
      wagmiConfig.ts            # Chain + wallet config
```

---

## Contract Tests

```bash
cd contracts && forge test
```

18 test cases covering:
- Transaction submission & access control
- Agent voting & double-vote prevention
- 2/3 threshold enforcement
- Auto-rejection on 2+ rejections
- Execution after approval
- Agent reputation tracking
- ETH receive capability

---

## License

MIT
