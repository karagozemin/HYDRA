# 🐉 HYDRA — Parallel AI Agent Multisig Wallet on Monad

## Full Project Prompt & Blueprint

---

## 🎯 Proje Özeti (Elevator Pitch)

**"HYDRA is a consumer-grade smart wallet where three independent AI agents act as parallel multisig guardians. Before any transaction executes, a Security Agent, Risk Agent, and Portfolio Agent analyze it simultaneously — powered by Monad's parallel EVM — and cast their on-chain votes in the same block. Cut one head, three more protect your wallet."**

---

## 🧠 Problem

Crypto kullanıcıları her gün:
- Scam token'lara basıyor
- Phishing kontratlarına approve veriyor
- Kötü zamanlarda kötü trade'ler yapıyor
- Rug pull'lara yakalanıyor

Mevcut çözümler ya çok teknik (manuel kontrat okuma) ya da çok yavaş (tek ajan sırayla analiz). Kullanıcı "hızlı karar vermek" ile "güvenli karar vermek" arasında seçim yapmak zorunda kalıyor.

## 💡 Çözüm: HYDRA

Kullanıcının cüzdanına 3 AI ajan "guardian" olarak ekleniyor. Her işlem başlatıldığında:

1. **Security Agent (Güvenlik Başı)** → Hedef kontratı analiz eder. Scam mi? Verified mi? Proxy pattern var mı?
2. **Risk Agent (Risk Başı)** → Token likiditesini, fiyat volatilitesini, whale hareketlerini kontrol eder.
3. **Portfolio Agent (Portföy Başı)** → Bu işlem kullanıcının toplam portföyüne uygun mu? Aşırı yoğunlaşma var mı?

3 ajan **paralel** çalışır → **aynı blokta** oylarını on-chain yazar → Çoğunluk onaylarsa (2/3 veya 3/3) işlem execute edilir.

---

## 🏗️ Teknik Mimari

### Akıllı Kontrat Katmanı (Solidity + Foundry)

```
HydraGuard.sol
├── submitTransaction(to, value, data) → Kullanıcı işlem başlatır
├── agentVote(txId, approve, reason) → Her ajan oyunu verir
├── executeTransaction(txId) → Yeterli onay varsa execute
├── getTransactionStatus(txId) → İşlem durumu
├── getAgentVotes(txId) → Ajan oyları ve gerekçeleri
│
├── Mappings:
│   ├── transactions[txId] → Transaction struct
│   ├── votes[txId][agentAddress] → Vote struct (approve, reason, timestamp)
│   └── agentReputation[agentAddress] → uint256 score
│
├── Events:
│   ├── TransactionSubmitted(txId, to, value)
│   ├── AgentVoted(txId, agent, approved, reason)
│   ├── TransactionExecuted(txId)
│   └── TransactionRejected(txId)
│
└── Modifiers:
    ├── onlyOwner
    ├── onlyAgent
    └── notExecuted
```

**Neden Safe Multisig pattern?**
- Endüstri standardı, jüri (özellikle Safe/viem uzmanı hakem) bunu anında tanır
- 3 ajan = 3 signer, threshold = 2 (2/3 çoğunluk yeterli)
- Battle-tested pattern, güvenilirlik yüksek

**Paralel Execution Neden Kritik?**
- Ethereum'da: 3 ajanın vote tx'i sırayla işlenir → nonce yönetimi, 3 blok bekleme
- Monad'da: 3 ajanın vote tx'i AYNI BLOKTA paralel işlenir → farklı storage slot'lara yazıyor (votes[txId][agent1], votes[txId][agent2], votes[txId][agent3]) → slot-level contention yok → gerçek paralel execution

### Backend / Ajan Katmanı (Node.js + viem)

```
hydra-backend/
├── agents/
│   ├── securityAgent.js    → Kontrat analizi (verified?, proxy?, scam DB)
│   ├── riskAgent.js         → Likidite, volatilite, whale analizi
│   └── portfolioAgent.js   → Portföy uyumu, yoğunlaşma riski
├── orchestrator.js          → Event dinler, 3 ajanı PARALEL tetikler
├── config/
│   ├── monad.js             → Chain config (chainId: 10143, RPC)
│   └── wallets.js           → 3 ajan wallet private key'leri
├── lib/
│   ├── viemClient.js        → Viem public + wallet client setup
│   └── contractABI.js       → HydraGuard ABI
└── index.js                 → Entry point
```

**Orchestrator Akışı:**

```javascript
// Event listener: Yeni işlem geldi
contract.on('TransactionSubmitted', async (txId, to, value) => {

  // 3 ajanı PARALEL çalıştır — bu Monad'ın gücü
  const [securityResult, riskResult, portfolioResult] = await Promise.all([
    securityAgent.analyze(to, value, data),
    riskAgent.analyze(to, value, data),
    portfolioAgent.analyze(to, value, data)
  ]);

  // 3 ajan oyunu AYNI ANDA on-chain'e yaz
  await Promise.all([
    submitVote(txId, securityResult, securityWallet),
    submitVote(txId, riskResult, riskWallet),
    submitVote(txId, portfolioResult, portfolioWallet)
  ]);

  // Sonuç: Aynı blokta 3 oy → anında karar
});
```

### Frontend (Next.js + wagmi + Tailwind)

```
hydra-frontend/
├── app/
│   ├── page.tsx              → Ana dashboard
│   ├── layout.tsx            → Layout + providers
│   └── globals.css
├── components/
│   ├── ConnectWallet.tsx     → Wallet bağlantısı
│   ├── TransactionForm.tsx   → İşlem başlatma formu
│   ├── AgentPanel.tsx        → 3 ajanın durumunu gösteren panel
│   ├── AgentCard.tsx         → Tek ajan kartı (ikon, durum, gerekçe)
│   ├── TransactionHistory.tsx→ Geçmiş işlemler
│   └── HydraLogo.tsx        → Logo/branding
├── hooks/
│   ├── useHydraContract.ts  → Contract interaction hook
│   └── useAgentStatus.ts    → Ajan oylarını dinleyen hook
├── lib/
│   ├── wagmiConfig.ts       → Monad testnet chain config
│   └── constants.ts         → Contract address, ABI
└── public/
    └── hydra-logo.svg
```

**UI Akışı:**
1. Kullanıcı cüzdanı bağlar
2. "New Transaction" → to address, amount, data girer
3. Submit → Ekranda 3 ajan kartı belirir:
   - 🔴 Security Agent: "Analyzing contract..." → ✅ "Verified, no proxy" / ❌ "Scam detected"
   - 🟡 Risk Agent: "Checking liquidity..." → ✅ "Sufficient liquidity" / ❌ "Low liquidity warning"
   - 🔵 Portfolio Agent: "Evaluating fit..." → ✅ "Within risk tolerance" / ❌ "Over-concentrated"
4. 2/3 veya 3/3 onay → İşlem execute → Yeşil başarı ekranı
5. Çoğunluk red → İşlem bloklanır → Kırmızı uyarı + gerekçeler

---

## 📋 1 Günlük MVP Planı (Saat Saat)

### Saat 0-1: Setup & Deploy
- [ ] Foundry projesi oluştur
- [ ] HydraGuard.sol yaz (submit, vote, execute)
- [ ] Monad Testnet'e deploy et (chainId: 10143)
- [ ] Contract verify et
- [ ] 3 ajan wallet oluştur, fund'la

### Saat 1-3: Backend Ajanlar
- [ ] viem client setup (Monad RPC)
- [ ] Security Agent: Basit kontrat kontrolü (isContract, bytecode length, basit blacklist)
- [ ] Risk Agent: Basit token analizi (balance check, basit heuristic)
- [ ] Portfolio Agent: Cüzdan bakiyesine göre oran kontrolü
- [ ] Orchestrator: Event listener + Promise.all paralel execution
- [ ] Test: Manuel tx submit → 3 ajan paralel vote

### Saat 3-6: Frontend
- [ ] Next.js + wagmi + Tailwind setup
- [ ] Monad testnet chain config
- [ ] Wallet connect
- [ ] Transaction form
- [ ] Agent panel (3 kart, real-time status)
- [ ] Event listener: AgentVoted event → UI update
- [ ] Transaction history

### Saat 6-8: Polish & Demo Prep
- [ ] UI animasyonları (ajan kartları pulse, onay/red animasyonu)
- [ ] Dark theme (siyah/yeşil/kırmızı — hacker aesthetic)
- [ ] Demo senaryosu hazırla:
  1. Güvenli bir swap → 3 ajan onay → execute
  2. Scam adrese transfer → Security Agent red → bloklanır
  3. Aşırı büyük trade → Portfolio Agent uyarı → bloklanır
- [ ] Pitch deck (3-5 slide)
- [ ] README yaz

---

## 🎤 Demo Senaryosu (Sahne)

### Demo 1: "Güvenli İşlem" (30 saniye)
"Bu cüzdandan 10 MON'u verified bir DEX kontratına swap edelim."
→ 3 ajan aynı anda analiz eder
→ Ekranda 3 yeşil tik belirir
→ İşlem execute edilir
→ "3 heads approved. Transaction executed in one block."

### Demo 2: "Scam Koruması" (30 saniye)
"Şimdi aynı cüzdandan bilinen bir scam adrese transfer deneyelim."
→ Security Agent: ❌ "Known scam address"
→ Risk Agent: ❌ "No liquidity, suspicious"
→ Portfolio Agent: ✅ "Amount within range"
→ 2/3 red → İşlem bloklanır
→ "HYDRA just saved you from losing your funds."

### Demo 3: "Paralel Hız" (20 saniye)
"Dikkat edin: 3 ajan aynı blokta oy verdi. Ethereum'da bu 3 ayrı blok sürerdi. Monad'ın parallel execution'ı sayesinde HYDRA milisaniyelerde karar veriyor."
→ Block explorer'da aynı block number'da 3 vote tx göster

---

## 🎯 Pitch Script (2 Dakika)

**[Slide 1: Problem]**
"Her gün crypto kullanıcıları scam'lere, rug pull'lara ve kötü trade'lere milyonlar kaybediyor. Mevcut çözümler ya çok yavaş ya da çok teknik."

**[Slide 2: Solution]**
"HYDRA, cüzdanınıza 3 bağımsız AI ajan ekler. Her işlem önce bu üç baştan geçer: Güvenlik, Risk ve Portföy. Çoğunluk onaylamazsa, işlem asla execute olmaz."

**[Slide 3: Why Monad]**
"Ethereum'da 3 ajanın oyu 3 ayrı blokta işlenir — kullanıcı bekler. Monad'ın parallel EVM'i sayesinde 3 ajan AYNI BLOKTA, AYNI MİLİSANİYEDE oy verir. Sıfır gecikme, maksimum güvenlik."

**[Slide 4: Demo]**
→ Canlı demo

**[Slide 5: Vision]**
"HYDRA, kurumsal seviyedeki AI güvenlik kurulunu, sıradan kullanıcının cebine getiriyor. Cut one head — three more protect your wallet."

---

## 🔧 Teknik Detaylar & Config

### Monad Testnet Config
```javascript
// wagmi config
const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://testnet-rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
};
```

### Foundry Deploy
```bash
# Install & setup
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Init project
forge init hydra-contracts
cd hydra-contracts

# Deploy to Monad Testnet
forge create --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $DEPLOYER_KEY \
  src/HydraGuard.sol:HydraGuard \
  --constructor-args $OWNER $AGENT1 $AGENT2 $AGENT3

# Verify
forge verify-contract $CONTRACT_ADDRESS \
  src/HydraGuard.sol:HydraGuard \
  --chain-id 10143 \
  --verifier-url https://testnet.monadexplorer.com/api \
  --etherscan-api-key $API_KEY
```

### Viem Client Setup
```javascript
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
};

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
});

// 3 ajan wallet
const securityAgent = privateKeyToAccount('0x...');
const riskAgent = privateKeyToAccount('0x...');
const portfolioAgent = privateKeyToAccount('0x...');

const securityWallet = createWalletClient({
  account: securityAgent,
  chain: monadTestnet,
  transport: http(),
});
// ... riskWallet, portfolioWallet aynı şekilde
```

### Ajan Prompt Örnekleri

**Security Agent:**
```
You are a blockchain security analyst. Given a target contract address and transaction data:
1. Check if the address is a known scam
2. Check if it's a proxy contract (potential rug)
3. Check bytecode size (empty = suspicious)
Return JSON: { "approve": true/false, "reason": "brief explanation", "risk_score": 0-100 }
```

**Risk Agent:**
```
You are a DeFi risk analyst. Given a token/contract and transaction value:
1. Evaluate liquidity depth
2. Check price volatility indicators
3. Assess whale concentration
Return JSON: { "approve": true/false, "reason": "brief explanation", "risk_score": 0-100 }
```

**Portfolio Agent:**
```
You are a portfolio manager. Given the user's current wallet balance and the proposed transaction:
1. Calculate position size as % of portfolio
2. Check concentration risk
3. Evaluate if amount is reasonable
Return JSON: { "approve": true/false, "reason": "brief explanation", "risk_score": 0-100 }
```

---

## 📁 Tam Dosya Yapısı

```
hydra/
├── contracts/                    # Foundry project
│   ├── src/
│   │   └── HydraGuard.sol
│   ├── test/
│   │   └── HydraGuard.t.sol
│   ├── script/
│   │   └── Deploy.s.sol
│   └── foundry.toml
│
├── backend/                      # Node.js ajan sistemi
│   ├── agents/
│   │   ├── securityAgent.js
│   │   ├── riskAgent.js
│   │   └── portfolioAgent.js
│   ├── orchestrator.js
│   ├── lib/
│   │   ├── viemClient.js
│   │   └── contractABI.js
│   ├── config/
│   │   └── monad.js
│   ├── package.json
│   └── index.js
│
├── frontend/                     # Next.js app
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ConnectWallet.tsx
│   │   ├── TransactionForm.tsx
│   │   ├── AgentPanel.tsx
│   │   ├── AgentCard.tsx
│   │   ├── TransactionHistory.tsx
│   │   └── HydraLogo.tsx
│   ├── hooks/
│   │   ├── useHydraContract.ts
│   │   └── useAgentStatus.ts
│   ├── lib/
│   │   ├── wagmiConfig.ts
│   │   └── constants.ts
│   ├── public/
│   │   └── hydra-logo.svg
│   ├── package.json
│   ├── tailwind.config.js
│   └── next.config.js
│
├── pitch/
│   └── slides.md                 # Pitch deck outline
│
└── README.md
```

---

## 🏆 Jüriyi Vuracak Noktalar

1. **Safe Multisig Pattern** → Hakem bunu görünce "bu çocuklar ne yaptığını biliyor" der
2. **viem kullanımı** → Hakemlin uzmanlık alanı, kodda görsün
3. **Paralel Vote = Paralel Execution kanıtı** → Block explorer'da aynı block'ta 3 tx
4. **Consumer-grade UI** → "Bu gerçek bir ürün" hissi
5. **Gerçek problem** → "Scam koruması" herkesin anlayacağı şey
6. **İsim + Branding** → HYDRA = akılda kalıcı, mitolojik, güçlü

---

## ⚠️ Dikkat Edilecekler

- **Ajan wallet'larını önceden fund'la** → Demo'da gas problemi yaşama
- **Fallback senaryosu hazırla** → RPC yavaşlarsa, ajanlardan biri timeout'a düşerse
- **Block explorer linkini hazır tut** → "Aynı blokta 3 tx" kanıtını göstermek için
- **Basit tut** → Gerçek AI analiz yerine, demo için hardcoded scam listesi + basit heuristic yeterli. Önemli olan mimari ve paralel execution
- **README'yi güzel yaz** → Jüriler koda bakacak, README ilk izlenim

---

## 🚀 Hemen Başla

Bu prompt'u kullanarak:

1. Önce `HydraGuard.sol` kontratını yaz ve Monad Testnet'e deploy et
2. Sonra 3 ajan backend'ini kur, `Promise.all` ile paralel çalıştır
3. Frontend'i Next.js + wagmi ile kur
4. Demo senaryolarını test et
5. Pitch'i hazırla

**"Cut one head — three more protect your wallet."** 🐉
