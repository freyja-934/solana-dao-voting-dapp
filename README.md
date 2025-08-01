# 🗳️ Solana DAO Voting DApp

A decentralized governance application built on Solana that enables community-driven decision making through on-chain proposals and voting.

## 🚀 Features

- **Wallet Integration**: Support for Phantom and Backpack wallets
- **Proposal Creation**: Community members can create governance proposals
- **On-chain Voting**: Secure voting mechanism with one vote per wallet
- **Real-time Updates**: Live vote counting and proposal status
- **Visual Results**: Interactive charts showing vote distribution
- **Mobile Responsive**: Optimized for all device sizes

## 🛠️ Tech Stack

- **Blockchain**: Solana (Devnet)
- **Smart Contracts**: Anchor Framework
- **Frontend**: Next.js 14 (App Router)
- **Styling**: TailwindCSS + Radix UI
- **State Management**: TanStack React Query
- **Wallet Integration**: Solana Wallet Adapter

## 📁 Project Structure

```
solana-dao-voting-dapp/
├── apps/
│   └── dao-voting/          # Next.js frontend application
├── programs/
│   └── dao_program/         # Anchor smart contract
├── scripts/
│   └── seed_initial_proposals.ts
├── IMPLEMENTATION_PLAN.md   # Development roadmap
└── pnpm-workspace.yaml      # Monorepo configuration
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Rust (latest stable)
- Solana CLI
- Anchor Framework

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd solana-dao-voting-dapp
```

2. Install dependencies:
```bash
pnpm install
```

3. Build the Anchor program:
```bash
pnpm run build:anchor
```

4. Deploy to devnet:
```bash
pnpm run deploy
```

5. Update the program ID in your environment variables

6. Start the development server:
```bash
pnpm run dev
```

## 🔧 Configuration

Create a `.env.local` file in `apps/dao-voting/`:

```env
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_COMMITMENT=confirmed
NEXT_PUBLIC_PROGRAM_ID=<your-program-id>
```

## 📝 Development

### Available Scripts

- `pnpm dev` - Start the Next.js development server
- `pnpm build` - Build both Anchor program and Next.js app
- `pnpm test` - Run all tests
- `pnpm deploy` - Deploy Anchor program to devnet
- `pnpm seed` - Seed initial proposals for testing

### Testing

Run Anchor tests:
```bash
pnpm run test:anchor
```

Run frontend tests:
```bash
pnpm run test:web
```

## 🎯 Roadmap

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for detailed development progress.

## 📜 License

MIT 