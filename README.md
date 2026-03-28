<p align="center">
  <img src="hydra.png" alt="HYDRA Logo" width="120" />
</p>

<h1 align="center">HYDRA</h1>
<p align="center"><strong>Parallel AI Agent Multisig Wallet on Monad</strong></p>

> **Cut one head. Three more protect your wallet.**

---

## What is HYDRA?

HYDRA is a smart wallet where **3 AI agents** replace human multisig signers. When you submit a transaction, each agent independently analyzes it and casts an on-chain vote. **2-of-3 must approve** before funds can move.

On Monad's parallel EVM, all 3 votes can land in the **same block** — each agent writes to an independent storage slot, so there's zero contention.

## How It Works

```
User submits tx → Contract emits event → 3 AI agents analyze in parallel
                                          ├── Security Agent (scam detection)
                                          ├── Risk Agent (value & risk analysis)
                                          └── Portfolio Agent (balance impact)

3 votes submitted to contract → 2/3 approve? → Owner executes transfer
                               → 2/3 reject?  → Transaction blocked
```

1. **Owner** calls `submitTransaction(to, value, data)` on the HydraGuard contract
2. **Backend orchestrator** catches the `TransactionSubmitted` event
3. **Three agents** run in parallel (`Promise.all`), each combining hardcoded safety checks with a GROQ Llama 3.3 70B prompt
4. **Votes** are submitted as on-chain transactions via `agentVote()`
5. **Contract** auto-rejects at 2+ rejections, or waits for owner to execute after 2+ approvals

## The Three Agents

| Agent | What It Actually Does |
|-------|----------------------|
| **Security Agent** | Checks a hardcoded scam blacklist (2 addresses). If not blacklisted, sends tx details to Llama 3.3 70B asking about scam patterns, malicious calldata, and suspicious bytecode. Does NOT query external threat databases or fetch contract bytecode. |
| **Risk Agent** | Checks scam blacklist. Auto-rejects transfers >1000 MON. Flags risky function selectors (`approve()`, `withdraw()`). Sends remaining txs to LLM for DeFi risk assessment. Does NOT check actual liquidity pools or mempool. |
| **Portfolio Agent** | Checks scam blacklist. **Fetches real on-chain wallet balance** via `getBalance()`. Auto-rejects if tx is >50% of portfolio. Sends balance context to LLM. "Portfolio" means native MON balance only — no tokens or DeFi positions. |

Each agent returns: `{ approve: bool, reason: string, risk_score: 0-100 }`

## Why Monad?

The contract stores votes in `mapping(uint256 => mapping(address => Vote))`. Each agent writes to a different key (`votes[txId][agent1]` vs `votes[txId][agent2]` vs `votes[txId][agent3]`), which maps to independent storage slots. Monad's parallel EVM can execute these without contention — all 3 votes can land in a single block.

| | Sequential EVM | Monad (Parallel EVM) |
|---|---|---|
| 3 agent votes | 3 separate blocks | Can fit in **1 block** |
| Storage access | Sequential | Parallel (independent slots) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contract | Solidity 0.8.24, Foundry |
| Backend | Node.js (ESM), viem v2, groq-sdk |
| Frontend | Next.js 14, wagmi v2, RainbowKit, Tailwind CSS |
| AI Model | GROQ Llama 3.3 70B Versatile |
| Network | Monad Testnet (Chain ID: 10143) |

## Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- MetaMask with Monad Testnet

### 1. Clone & Install

```bash
git clone <repo-url>
cd HYDRA

cd contracts && forge install && cd ..
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Deploy Contract

```bash
cd contracts
forge create src/HydraGuard.sol:HydraGuard \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key <DEPLOYER_KEY> \
  --broadcast \
  --constructor-args <OWNER_ADDR> <AGENT1_ADDR> <AGENT2_ADDR> <AGENT3_ADDR>
```

### 3. Configure

**Backend** (`backend/.env`):
```
AGENT1_KEY=<security-agent-private-key>
AGENT2_KEY=<risk-agent-private-key>
AGENT3_KEY=<portfolio-agent-private-key>
CONTRACT_ADDRESS=<deployed-address>
OWNER_ADDRESS=<owner-address>
GROQ_API_KEY=<groq-api-key>
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_WALLETCONNECT_ID=<walletconnect-project-id>
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed-address>
NEXT_PUBLIC_AGENT1_ADDRESS=<agent1-public-address>
NEXT_PUBLIC_AGENT2_ADDRESS=<agent2-public-address>
NEXT_PUBLIC_AGENT3_ADDRESS=<agent3-public-address>
```

### 4. Run

```bash
# Fund contract with MON (for transfers) and each agent wallet with ~0.5 MON (for gas)

# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

Open `http://localhost:3000`, connect wallet, submit a transaction.

## Demo Scenarios

| Scenario | How to trigger | Expected result |
|----------|---------------|-----------------|
| Safe transfer | Any valid address, small amount | 2-3/3 approved, execute button appears |
| Scam address | Send to `0x000...dEaD` | 3/3 rejected, "HYDRA protected your wallet" |
| Large transfer | Any address, >1000 MON | Risk Agent rejects |
| Portfolio drain | Any address, >50% of balance | Portfolio Agent rejects |

## Architecture

For a complete technical deep-dive — how each agent works, what the contract does and doesn't do, honest limitations, and the full project structure — see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## Project Structure

```
HYDRA/
├── contracts/          # Solidity contract + Foundry tests
├── backend/            # Event orchestrator + 3 AI agents
├── frontend/           # Next.js dashboard + landing page
└── ARCHITECTURE.md     # Full technical documentation
```

## Contract Tests

```bash
cd contracts && forge test
```

---

**Powered by [OverBlock](https://x.com/OverBlock_) | Created by [Kaptan](https://x.com/kaptan_web3)**

## License

MIT
