# 🗳️ Solana DAO Voting DApp

A decentralized governance application allowing users to create proposals and vote using SPL governance tokens. Built with **Anchor**, **Next.js**, **TailwindCSS**, **Radix UI**, and **TanStack React Query**. 

This project is ideal for demonstrating on-chain decision-making, token-based voting, and community governance.

---

## 🧱 Tech Stack

- **Solana** (devnet)
- **Anchor**
- **Next.js** (App Router)
- **TailwindCSS**
- **Radix UI**
- **TanStack React Query**
- **Solana Wallet Adapter**
- **@solana/spl-governance (optional)**

---

## 🗂 Folder Structure

```
apps/
└── dao-voting/
    ├── app/
    ├── components/
    ├── hooks/
    ├── lib/
    ├── queries/
    ├── styles/
    └── utils/

programs/
└── dao_program/
    ├── src/
    └── tests/

scripts/
└── seed_initial_proposals.ts
```

---

## 🌐 Pages

### `/`
**Governance Dashboard**
- List of proposals
- Create proposal button
- Vote breakdown (bar chart UI)

### `/proposal/[pubkey]`
**Proposal Detail Page**
- Description, vote buttons, result
- Transaction history & proposal metadata

---

## 🔧 Architecture Overview

- **Anchor Program**:
  - Stores proposals and vote counts via PDA
  - Voters identified by wallet address
  - Enforces 1 vote per wallet per proposal

- **Frontend**:
  - Lists proposals
  - Allows voting
  - Visual result charts

---

## 🎨 UI Components

- `<ProposalCard />`
- `<CreateProposalModal />`
- `<VoteButton />`
- `<ProposalResults />`
- `<Alert />`

---

## ✅ Features & Acceptance Criteria

### 1. Wallet Connect
**Acceptance Criteria**:
- [ ] Phantom/Backpack support
- [ ] Address shown after connect

---

### 2. Create Proposal
- Title, description input
- Create button triggers Anchor tx

**Acceptance Criteria**:
- [ ] Inputs are validated
- [ ] Proposal added to list and state on-chain
- [ ] Emits creation event

---

### 3. View Proposals
- Displays proposals on homepage
- Shows current votes

**Acceptance Criteria**:
- [ ] Proposals fetched via React Query
- [ ] Realtime updates shown

---

### 4. Vote on Proposal
- Single vote per wallet per proposal
- Vote stored in Anchor PDA
- Vote breakdown bar

**Acceptance Criteria**:
- [ ] Double voting blocked
- [ ] Votes update live
- [ ] Bar shows vote % per option

---

### 5. Proposal Detail View
- Title, description, status
- Buttons to vote Yes / No / Abstain
- Shows tx logs and vote history

**Acceptance Criteria**:
- [ ] Status updates correctly
- [ ] View history from Anchor events

---

## ⚙️ How to Run (Cursor)

**1. Install**
```bash
pnpm install
```

**2. Build and Deploy Anchor**
```bash
anchor build && anchor deploy
```

**3. Seed Proposals**
```bash
ts-node scripts/seed_initial_proposals.ts
```

**4. Add Environment Config**
`.env`
```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=YourAnchorProgramPubkey
```

**5. Start Dev**
```bash
pnpm dev
```

---

## 🛠 Future Features

- SPL governance token gating
- Weighted voting by token amount
- Proposal expiration + quorum logic

---

## 📎 Live Demo

> Coming soon — deploy to [Vercel](https://vercel.com)

---

## 🧾 License

MIT © YourName