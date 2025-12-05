---
id: local-development
title: Local Development Setup
sidebar_label: Local Development
---

# Local Development Setup

This guide will walk you through setting up the DAO Voting Platform for local development, including the Solana program, Next.js frontend, and Supabase backend.

## Prerequisites

### Required Software

Before starting, ensure you have the following installed:

| Software | Version | Installation |
|----------|---------|--------------|
| **Node.js** | 18.0+ | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 8.0+ | `npm install -g pnpm` |
| **Rust** | Latest stable | [rustup.rs](https://rustup.rs/) |
| **Solana CLI** | 1.17+ | [docs.solana.com](https://docs.solana.com/cli/install-solana-cli-tools) |
| **Anchor** | 0.30+ | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked` |
| **Git** | 2.0+ | [git-scm.com](https://git-scm.com/) |

### Verify Installations

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check pnpm version  
pnpm --version
# Expected: 8.x.x or higher

# Check Rust version
rustc --version
# Expected: rustc 1.7x.x

# Check Solana version
solana --version
# Expected: solana-cli 1.17.x

# Check Anchor version
anchor --version
# Expected: anchor-cli 0.30.x
```

### System Requirements

- **Operating System**: macOS, Linux, or WSL2 on Windows
- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: At least 10GB free space
- **Internet**: Stable connection for blockchain interactions

## Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/lazer/solana-dao-voting-dapp.git
cd solana-dao-voting-dapp

# Verify you're on the correct branch
git branch
# Should show: * main
```

## Step 2: Install Dependencies

```bash
# Install all dependencies using pnpm workspaces
pnpm install

# This installs dependencies for:
# - Root workspace
# - apps/dao-voting (Next.js frontend)
# - programs/dao_program (Anchor program)
```

If you encounter issues:

```bash
# Clear pnpm cache
pnpm store prune

# Remove node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/dao-voting/node_modules
rm -rf programs/dao_program/node_modules
pnpm install
```

## Step 3: Configure Solana CLI

### Set Up Local Wallet

```bash
# Create a new wallet for local development
solana-keygen new --outfile ~/.config/solana/devnet-wallet.json

# Set it as the default wallet
solana config set --keypair ~/.config/solana/devnet-wallet.json

# Configure for local development
solana config set --url localhost

# Verify configuration
solana config get
# Expected output:
# Config File: ~/.config/solana/cli/config.yml
# RPC URL: http://localhost:8899
# WebSocket URL: ws://localhost:8900/ (computed)
# Keypair Path: ~/.config/solana/devnet-wallet.json
```

### Fund Your Wallet

For local development:
```bash
# Start local validator (in a separate terminal)
solana-test-validator

# Airdrop SOL to your wallet
solana airdrop 10
# Expected: "10 SOL"

# Verify balance
solana balance
# Expected: "10 SOL"
```

For devnet development:
```bash
# Switch to devnet
solana config set --url devnet

# Airdrop SOL (limited to 2 SOL per request)
solana airdrop 2

# May need multiple airdrops
solana airdrop 2
solana airdrop 2

# Verify balance
solana balance
# Expected: "6 SOL" (or more)
```

## Step 4: Build and Deploy Smart Contract

### Build the Anchor Program

```bash
# Navigate to program directory
cd programs/dao_program

# Build the program
anchor build

# Output:
# ✓ Building dao_program
# ✓ Build successful
# 
# Program ID: <your_program_id>

# Note the Program ID - you'll need this for configuration
```

### Deploy to Local Validator

```bash
# Ensure local validator is running
# In a separate terminal:
solana-test-validator

# Deploy the program
anchor deploy

# Expected output:
# Deploying cluster: http://localhost:8899
# Upgrade authority: <your_wallet>
# Deploying program "dao_program"...
# Program path: target/deploy/dao_program.so
# Program Id: <your_program_id>
# 
# Deploy success

# Verify deployment
solana program show <your_program_id>
```

### Run Tests

```bash
# Run Anchor tests
anchor test

# Expected output:
# ✓ DAO Initialization (250ms)
# ✓ Proposal Creation (180ms)
# ✓ Vote Casting (220ms)
# ✓ Proposal Execution (195ms)
# 
# 4 passing (845ms)
```

## Step 5: Configure Environment Variables

### Create Environment File

```bash
# Navigate to frontend directory
cd apps/dao-voting

# Copy example configuration
cp config.example.ts .env.local
```

### Edit `.env.local`

```env
# Solana Configuration
NEXT_PUBLIC_RPC_URL=http://localhost:8899
NEXT_PUBLIC_COMMITMENT=confirmed
NEXT_PUBLIC_PROGRAM_ID=<your_program_id_from_step_4>
NEXT_PUBLIC_NETWORK=localnet

# Supabase Configuration (for local Supabase)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-for-local-dev

# Development Settings
NEXT_PUBLIC_IS_DEV=true
NEXT_PUBLIC_SHOW_TEST_DATA=true
```

### Update Program ID in Code

Edit `apps/dao-voting/src/lib/constants.ts`:

```typescript
import { PublicKey } from '@solana/web3.js';

// Update with your deployed program ID
export const PROGRAM_ID = new PublicKey('<your_program_id>');
export const IS_DEVNET = false;
export const IS_LOCALNET = true;

// Local RPC configuration
export const RPC_ENDPOINTS = {
  primary: 'http://localhost:8899',
  secondary: 'http://localhost:8899', // Same for local
};

// DAO Configuration for local testing
export const DAO_ADMIN = new PublicKey('<your_wallet_public_key>');
export const DAO_TREASURY = new PublicKey('<your_wallet_public_key>'); // Can be same for testing
```

## Step 6: Set Up Local Supabase (Optional)

### Install Supabase CLI

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or using npm
npm install -g supabase

# Verify installation
supabase --version
```

### Start Local Supabase

```bash
# Initialize Supabase in project root
supabase init

# Start Supabase services
supabase start

# Expected output:
# Started supabase local development setup.
# 
# API URL: http://localhost:54321
# DB URL: postgresql://postgres:postgres@localhost:54322/postgres
# Studio URL: http://localhost:54323
# Inbucket URL: http://localhost:54324
# JWT secret: your-super-secret-jwt-token
# anon key: eyJhbGc...
# service_role key: eyJhbGc...
```

### Run Database Migrations

```bash
# Apply migrations
psql postgresql://postgres:postgres@localhost:54322/postgres < scripts/setup_all_supabase_tables.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < scripts/fix_supabase_relationships.sql
psql postgresql://postgres:postgres@localhost:54322/postgres < scripts/fix_supabase_anon_access.sql

# Verify tables created
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\dt"
# Should show: profiles, proposals_metadata, comments, activity_log, voting_history
```

## Step 7: Initialize the DAO

### Create Initialization Script

Create `scripts/initialize-local-dao.ts`:

```typescript
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { DaoProgram } from '../target/types/dao_program';

const initializeDAO = async () => {
  // Configure provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.DaoProgram as Program<DaoProgram>;
  const admin = provider.wallet.publicKey;
  
  // Derive DAO PDA
  const [daoAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('dao'), admin.toBuffer()],
    program.programId
  );
  
  // Initialize DAO
  try {
    const tx = await program.methods
      .initializeDao(
        new anchor.BN(10),      // min_votes_required (low for testing)
        new anchor.BN(300)      // voting_period (5 minutes for testing)
      )
      .accounts({
        dao: daoAccount,
        admin: admin,
        treasury: admin, // Use same wallet for testing
        payer: admin,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('DAO initialized successfully!');
    console.log('Transaction:', tx);
    console.log('DAO Account:', daoAccount.toBase58());
    
    // Save DAO account to constants
    console.log('\nAdd this to your constants.ts:');
    console.log(`export const DAO_ACCOUNT = new PublicKey('${daoAccount.toBase58()}');`);
    
  } catch (error) {
    if (error.message.includes('already in use')) {
      console.log('DAO already initialized at:', daoAccount.toBase58());
    } else {
      throw error;
    }
  }
};

initializeDAO().catch(console.error);
```

### Run Initialization

```bash
# From project root
pnpm tsx scripts/initialize-local-dao.ts

# Expected output:
# DAO initialized successfully!
# Transaction: 5KTh3Gh5P8x7mNtg...
# DAO Account: 7xyz123abc...
# 
# Add this to your constants.ts:
# export const DAO_ACCOUNT = new PublicKey('7xyz123abc...');
```

## Step 8: Seed Test Data

### Create Test Data Script

```bash
# Run the seed script
pnpm tsx scripts/seed_initial_proposals.ts

# This creates:
# - 5 test proposals in various states
# - Sample votes on proposals
# - Test user profiles
# - Sample comments
```

## Step 9: Start the Development Server

### Start Frontend

```bash
# Navigate to frontend
cd apps/dao-voting

# Start development server
pnpm dev

# Expected output:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# - Environments: .env.local
# 
# ✓ Ready in 2.5s
```

### Verify Everything Works

1. **Open browser**: Navigate to [http://localhost:3000](http://localhost:3000)
2. **Connect wallet**: Click "Connect Wallet" and select Phantom
3. **View proposals**: Should see seeded test proposals
4. **Create proposal**: Try creating a new proposal
5. **Cast vote**: Vote on an active proposal
6. **Check results**: Verify vote counts update

## Step 10: Development Workflow

### Typical Development Session

```bash
# Terminal 1: Run Solana validator
solana-test-validator

# Terminal 2: Watch Anchor program logs
solana logs --url localhost

# Terminal 3: Run frontend
cd apps/dao-voting && pnpm dev

# Terminal 4: Run Supabase (if using)
supabase start
```

### Making Changes

#### Smart Contract Changes:
```bash
# Edit program code
# Rebuild and redeploy
cd programs/dao_program
anchor build && anchor deploy

# Update program ID in frontend if changed
```

#### Frontend Changes:
```bash
# Edit React components
# Changes auto-refresh via Next.js hot reload
# No restart needed
```

#### Database Changes:
```bash
# Edit SQL migration files
# Rerun migrations
supabase db reset
```

## Troubleshooting Common Issues

### Issue: "Account not found" error

**Solution**:
```bash
# DAO might not be initialized
pnpm tsx scripts/initialize-local-dao.ts
```

### Issue: "Insufficient SOL" error

**Solution**:
```bash
# Airdrop more SOL
solana airdrop 10
```

### Issue: "Transaction simulation failed"

**Solution**:
```bash
# Check program logs for detailed error
solana logs --url localhost

# Common fixes:
# - Rebuild program: anchor build
# - Redeploy: anchor deploy
# - Clear state: solana-test-validator --reset
```

### Issue: "Cannot connect to RPC"

**Solution**:
```bash
# Ensure validator is running
ps aux | grep solana-test-validator

# If not running, start it:
solana-test-validator

# Check it's accessible:
curl http://localhost:8899 -X POST -H "Content-Type: application/json" -d '
  {"jsonrpc":"2.0","id":1,"method":"getHealth"}
'
```

### Issue: "Wallet not connecting"

**Solution**:
```javascript
// Check browser console for errors
// Common issues:
// 1. Phantom not installed
// 2. Wrong network selected
// 3. Popup blocked

// Manual test in console:
window.solana.isPhantom // Should be true
```

### Issue: Build errors

**Solution**:
```bash
# Clear all caches and rebuild
rm -rf node_modules pnpm-lock.yaml
rm -rf apps/dao-voting/node_modules
rm -rf apps/dao-voting/.next
rm -rf programs/dao_program/target
pnpm install
anchor build
pnpm dev
```

## Tips for Local Development

### 1. Use Test Wallets
Create multiple test wallets for different roles:
```bash
solana-keygen new --outfile ~/.config/solana/test-voter1.json
solana-keygen new --outfile ~/.config/solana/test-voter2.json
solana-keygen new --outfile ~/.config/solana/test-admin.json
```

### 2. Fast Iteration
For quick testing, reduce voting periods:
```typescript
// In initialization
.initializeDao(
  new BN(1),    // Min 1 vote for testing
  new BN(60)    // 1 minute voting period
)
```

### 3. Debug Mode
Enable debug logging:
```bash
# For Anchor programs
RUST_LOG=debug anchor test

# For Next.js
DEBUG=* pnpm dev
```

### 4. Monitor Transactions
Keep transaction explorer open:
```bash
# Install Solana Explorer locally
npm install -g @solana/explorer

# Run explorer
solana-explorer --url http://localhost:8899
```

### 5. Reset State
When needed, reset everything:
```bash
# Stop all services
pkill -f solana-test-validator
pkill -f "next dev"

# Clear validator state
solana-test-validator --reset

# Restart services
./scripts/start-local.sh
```

## Next Steps

Once your local environment is set up:

1. **Review Architecture**: Read the [Architecture Overview](/docs/architecture/overview)
2. **Understand the Smart Contract**: Study [DAO Program Documentation](/docs/contracts/dao-program)
3. **Explore Frontend**: Check [Frontend Architecture](/docs/frontend/frontend-architecture)
4. **Run Tests**: See [Testing Guide](/docs/testing/testing-guide)
5. **Prepare for Deployment**: Review [Production Deployment](/docs/deployment/production-deployment)

## Support

If you encounter issues not covered here:

1. Check the [Troubleshooting Guide](/docs/operations/runbook#troubleshooting)
2. Search [GitHub Issues](https://github.com/lazer/solana-dao-voting/issues)
3. Ask in [Discord](https://discord.gg/solana)
4. Contact the team at support@lazer.com
