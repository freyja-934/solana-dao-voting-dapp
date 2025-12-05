---
id: production-deployment
title: Production Deployment Guide
sidebar_label: Production Deployment
---

# Production Deployment Guide

This comprehensive guide covers deploying the DAO Voting Platform to production, including smart contract deployment to Solana Mainnet, frontend deployment to Vercel, and database setup with Supabase.

## Prerequisites

### Required Tools
- **Solana CLI 1.17+**: Command-line tools for Solana
- **Anchor CLI 0.30+**: Framework for Solana programs
- **Node.js 18+**: JavaScript runtime
- **pnpm 8+**: Package manager
- **Git**: Version control
- **Vercel CLI**: Deployment tool (optional)

### Required Accounts
- **Funded Solana Wallet**: Need ~5 SOL for deployment
- **Vercel Account**: For frontend hosting
- **Supabase Project**: For database and auth
- **GitHub Repository**: For source control

### Environment Preparation
```bash
# Verify installations
solana --version    # Should be 1.17+
anchor --version    # Should be 0.30+
node --version      # Should be 18+
pnpm --version      # Should be 8+

# Set Solana cluster to mainnet
solana config set --url https://api.mainnet-beta.solana.com
```

## Smart Contract Deployment

### Step 1: Configure for Mainnet

Update `Anchor.toml` in the project root:

```toml
[features]
seeds = false
skip-lint = false

[programs.mainnet]
dao_program = "7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "mainnet"
wallet = "~/.config/solana/mainnet-wallet.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
```

### Step 2: Prepare Deployment Wallet

```bash
# Create a new wallet for deployment (if needed)
solana-keygen new --outfile ~/.config/solana/mainnet-wallet.json

# Get the wallet address
solana address

# Fund the wallet with SOL (need 3-5 SOL)
# Transfer SOL from exchange or another wallet

# Verify balance
solana balance
# Expected output: 5 SOL (or more)
```

### Step 3: Build the Program

```bash
# Navigate to program directory
cd programs/dao_program

# Clean previous builds
anchor clean

# Build for mainnet
anchor build

# Verify build artifacts
ls -la target/deploy/
# Should see:
# - dao_program.so (compiled program)
# - dao_program-keypair.json (program keypair)
```

### Step 4: Deploy to Mainnet

```bash
# Deploy the program
anchor deploy

# Expected output:
# Deploying cluster: https://api.mainnet-beta.solana.com
# Upgrade authority: <your-wallet-address>
# Deploying program "dao_program"...
# Program path: target/deploy/dao_program.so
# Program Id: 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
# 
# Deploy success

# Note the Program ID - you'll need this for frontend configuration
```

### Step 5: Verify Deployment

```bash
# Check program is deployed
solana program show 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj

# Upload and initialize IDL
anchor idl init -f target/idl/dao_program.json 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj

# Verify IDL is accessible
anchor idl fetch 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
```

### Step 6: Set Program Authority (Optional but Recommended)

```bash
# Transfer upgrade authority to multisig or governance
solana program set-upgrade-authority 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj \
  --new-upgrade-authority <multisig-address>

# Or make program immutable (cannot be upgraded)
solana program set-upgrade-authority 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj \
  --final
```

## Frontend Deployment

### Step 1: Environment Configuration

Create `.env.production` in `apps/dao-voting/`:

```env
# Solana Configuration
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_COMMITMENT=confirmed
NEXT_PUBLIC_PROGRAM_ID=7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
NEXT_PUBLIC_NETWORK=mainnet-beta

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.com
```

Generate NextAuth secret:
```bash
openssl rand -base64 32
```

### Step 2: Update Program ID

Update `apps/dao-voting/src/lib/constants.ts`:

```typescript
// Program Configuration
export const PROGRAM_ID = new PublicKey('7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj');
export const IS_DEVNET = false;
export const NETWORK = 'mainnet-beta';

// RPC Configuration
export const RPC_ENDPOINTS = {
  primary: 'https://api.mainnet-beta.solana.com',
  secondary: 'https://solana-mainnet.g.alchemy.com/v2/your-api-key',
  tertiary: 'https://rpc.helius.xyz/?api-key=your-api-key',
};

// DAO Configuration
export const DAO_ADMIN = new PublicKey('your-admin-wallet');
export const DAO_TREASURY = new PublicKey('your-treasury-wallet');
```

### Step 3: Build the Frontend

```bash
# Navigate to frontend directory
cd apps/dao-voting

# Install dependencies
pnpm install

# Build for production
pnpm run build

# Expected output:
# ✓ Compiled successfully
# ✓ Linting and type checking
# ✓ Collecting page data
# ✓ Generating static pages
# ✓ Finalizing page optimization
```

### Step 4: Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Follow prompts:
# - Link to existing project or create new
# - Configure project settings
# - Set environment variables
```

#### Option B: Using Git Integration

1. Push code to GitHub:
```bash
git add .
git commit -m "Production deployment"
git push origin main
```

2. In Vercel Dashboard:
- Import project from GitHub
- Configure build settings:
  - Framework Preset: Next.js
  - Root Directory: `apps/dao-voting`
  - Build Command: `pnpm run build`
  - Output Directory: `.next`
- Add environment variables from `.env.production`
- Deploy

### Step 5: Configure Custom Domain

1. In Vercel Dashboard:
- Go to Project Settings > Domains
- Add custom domain: `dao-voting.yourdomain.com`

2. Update DNS records:
```
Type: A
Name: dao-voting
Value: 76.76.21.21

Type: AAAA
Name: dao-voting  
Value: 2606:4700:3033::6815:2a5
```

3. Enable SSL (automatic in Vercel)

### Step 6: Verify Frontend Deployment

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs dao-voting.yourdomain.com

# Test the live site
curl -I https://dao-voting.yourdomain.com
```

## Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note the project URL and API keys

### Step 2: Run Database Migrations

Execute migration scripts in order:

```sql
-- 1. Run setup_all_supabase_tables.sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  discord_id TEXT,
  twitter_handle TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS proposals_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id TEXT UNIQUE NOT NULL,
  extended_description TEXT,
  discussion_url TEXT,
  ipfs_hash TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id TEXT NOT NULL,
  author_wallet TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  action_type TEXT NOT NULL,
  proposal_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voting_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL,
  proposal_id TEXT NOT NULL,
  vote_type TEXT NOT NULL,
  vote_weight BIGINT NOT NULL,
  transaction_signature TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(wallet_address, proposal_id)
);
```

```sql
-- 2. Run fix_supabase_relationships.sql
ALTER TABLE comments
  ADD CONSTRAINT fk_comments_author
  FOREIGN KEY (author_wallet)
  REFERENCES profiles(wallet_address)
  ON DELETE CASCADE;

ALTER TABLE activity_log
  ADD CONSTRAINT fk_activity_wallet
  FOREIGN KEY (wallet_address)
  REFERENCES profiles(wallet_address)
  ON DELETE CASCADE;

ALTER TABLE voting_history
  ADD CONSTRAINT fk_voting_wallet
  FOREIGN KEY (wallet_address)
  REFERENCES profiles(wallet_address)
  ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_comments_proposal ON comments(proposal_id);
CREATE INDEX idx_activity_wallet ON activity_log(wallet_address);
CREATE INDEX idx_voting_proposal ON voting_history(proposal_id);
CREATE INDEX idx_voting_wallet ON voting_history(wallet_address);
```

```sql
-- 3. Run fix_supabase_anon_access.sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.jwt() ->> 'wallet_address' = wallet_address);

-- Comments: Authenticated users can create, everyone can read
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.jwt() ->> 'wallet_address' = author_wallet);

-- Activity log: Read-only for everyone
CREATE POLICY "Activity log is viewable by everyone"
  ON activity_log FOR SELECT
  USING (true);

-- Voting history: Read-only for everyone
CREATE POLICY "Voting history is viewable by everyone"
  ON voting_history FOR SELECT
  USING (true);
```

### Step 3: Configure Authentication

1. In Supabase Dashboard:
- Go to Authentication > Providers
- Enable "Email" provider for wallet authentication
- Configure JWT settings:
  - JWT Expiry: 604800 (7 days)
  - JWT Secret: (auto-generated)

2. Set redirect URLs:
```
https://dao-voting.yourdomain.com/api/auth/callback
https://dao-voting.yourdomain.com/profile
```

### Step 4: Configure Storage (Optional)

For proposal attachments and user avatars:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('proposals', 'proposals', true);

-- Set up storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.jwt() ->> 'wallet_address' = (storage.foldername(name))[1]
  );
```

## Post-Deployment Checklist

### Initialize DAO

```typescript
// Script to initialize DAO
import { Program } from '@coral-xyz/anchor';
import { PublicKey, Keypair } from '@solana/web3.js';

const initializeDAO = async () => {
  const tx = await program.methods
    .initializeDao(
      new BN(100),        // min_votes_required
      new BN(259200)      // voting_period (3 days)
    )
    .accounts({
      dao: daoAccount,
      admin: adminWallet.publicKey,
      treasury: treasuryWallet.publicKey,
      payer: adminWallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
  
  console.log('DAO initialized:', tx);
};
```

### Verification Steps

- [ ] Initialize DAO with admin wallet
- [ ] Set voting parameters (quorum, period)
- [ ] Create initial test proposal
- [ ] Verify wallet connections (Phantom, Backpack)
- [ ] Test vote submission flow
- [ ] Check Supabase data sync
- [ ] Monitor RPC rate limits
- [ ] Verify transaction confirmations

### Monitoring Setup

#### 1. Solana Explorer
Monitor program activity:
```
https://explorer.solana.com/address/7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
```

#### 2. Vercel Analytics
- Enable in Vercel Dashboard
- Track Core Web Vitals
- Monitor API routes
- Set up alerts for errors

#### 3. Supabase Monitoring
- Database metrics dashboard
- Connection pool monitoring
- Query performance insights
- Storage usage tracking

#### 4. Custom Metrics
Track business metrics:
- Total proposals created
- Average vote participation
- Unique wallet addresses
- Proposal success rate

### Error Tracking Setup

#### Sentry Configuration

```bash
# Install Sentry
cd apps/dao-voting
pnpm add @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard -i nextjs
```

Update `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: 'production',
  tracesSampleRate: 0.1,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

### Security Hardening

1. **Enable CSP Headers**:
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
];
```

2. **Rate Limiting**:
```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});
```

3. **API Key Rotation**:
- Schedule monthly rotation
- Use environment variable management
- Update in Vercel dashboard

## Rollback Procedures

### Frontend Rollback

```bash
# List recent deployments
vercel ls dao-voting

# Rollback to previous deployment
vercel rollback <deployment-url>

# Or use Vercel Dashboard:
# Projects > dao-voting > Deployments > Promote to Production
```

### Smart Contract Recovery

Since programs are immutable once deployed:

1. Deploy new version with fixes:
```bash
anchor deploy --program-keypair <new-keypair>
```

2. Update frontend to use new program ID

3. Migrate data if necessary:
```typescript
// Data migration script
const migrateData = async () => {
  // Read from old program
  const oldData = await oldProgram.account.dao.all();
  
  // Initialize new program with data
  for (const item of oldData) {
    await newProgram.methods.migrate(item).rpc();
  }
};
```

### Database Rollback

```bash
# Restore from Supabase backup
# In Supabase Dashboard:
# Settings > Backups > Restore

# Or use Point-in-Time Recovery:
# Select specific timestamp to restore
```

## Cost Estimates

### Solana Costs
- Program Deployment: ~2-3 SOL
- Account Rent: ~0.002 SOL per account
- Transaction Fees: ~0.00025 SOL per transaction
- Monthly estimate: ~0.5 SOL for moderate usage

### Infrastructure Costs
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- RPC Provider: $50-200/month (based on usage)
- Domain: $12/year
- Total: ~$100-250/month

## Troubleshooting Common Issues

### Issue: "Transaction too large"
**Solution**: Reduce instruction size or split into multiple transactions

### Issue: "Rate limited by RPC"
**Solution**: Implement request caching and use multiple RPC endpoints

### Issue: "Wallet connection fails"
**Solution**: Check CORS settings and wallet adapter configuration

### Issue: "Database connection timeout"
**Solution**: Increase connection pool size in Supabase settings

## Support Resources

- **Solana Docs**: [docs.solana.com](https://docs.solana.com)
- **Anchor Book**: [book.anchor-lang.com](https://book.anchor-lang.com)
- **Vercel Support**: Via dashboard ticket system
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Community Discord**: [discord.gg/solana](https://discord.gg/solana)
