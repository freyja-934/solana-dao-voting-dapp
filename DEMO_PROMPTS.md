# Docusaurus Documentation Demo - Detailed Prompts

These are the detailed, information-rich prompts for the live demo. Copy and paste these into Cursor during the demonstration to show how consultants provide domain knowledge that Cursor transforms into professional documentation.

## Key Message for Demo
**"Cursor doesn't generate knowledge - it transforms YOUR expertise into professional documentation"**

---

## Prompt 1: Smart Contract Overview (5 minutes)

```
Create documentation for docs/contracts/dao-program.md with the following information:

# DAO Program Overview
Our DAO program is built with Anchor framework on Solana. Program ID: 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj

## Core Functionality
The program manages decentralized governance through:
1. DAO initialization with configurable parameters
2. Proposal creation with title (100 chars), description (500 chars), and voting period
3. Token-weighted or NFT-gated voting mechanisms
4. Vote execution after quorum (default 10% participation)
5. Time-locked proposal finalization

## Account Structures
- DAO Account (PDA): Stores admin, proposal count, voting config, treasury
  - Seed: ["dao", admin_pubkey]
  - Size: 500 bytes
  
- Proposal Account (PDA): Stores proposal data, votes, status
  - Seed: ["proposal", dao_pubkey, proposal_id.to_le_bytes()]
  - Size: 2000 bytes
  
- Vote Account (PDA): Records individual votes
  - Seed: ["vote", proposal_pubkey, voter_pubkey]
  - Size: 100 bytes

## Instructions
1. initialize_dao: Creates DAO with admin privileges
   - Params: min_votes_required (u64), voting_period (i64)
   - Signers: admin, payer
   
2. create_proposal: Submits new proposal
   - Params: title (String), description (String)
   - Access: Any token holder or NFT owner
   
3. cast_vote: Records vote on active proposal
   - Params: vote_type (For/Against/Abstain), weight (u64)
   - Validation: Check NFT ownership or token balance
   
4. execute_proposal: Finalizes proposal after voting period
   - Access: Anyone can call after period ends
   - Logic: Check quorum, determine outcome

## Security Considerations
- Admin cannot vote on proposals to prevent centralization
- Votes are immutable once cast
- Time checks prevent early execution
- PDAs ensure deterministic addressing
- Overflow checks on vote tallying

Format this with proper markdown structure, code examples for account derivations, and make it accessible for client developers.
```

---

## Prompt 2: Frontend Architecture (5 minutes)

```
Create docs/frontend/architecture.md with this information:

# Frontend Architecture

## Technology Stack
- Next.js 14 with App Router for SSR and optimal performance
- TypeScript for type safety across 50+ components
- TailwindCSS + Radix UI for consistent design system
- @solana/web3.js and @coral-xyz/anchor for blockchain interaction
- React Query for server state management with 5-minute cache
- Supabase for off-chain data (comments, profiles, activity logs)

## Core Design Patterns

### 1. Wallet Integration Pattern
We use Solana Wallet Adapter with custom provider:
- WalletContextProvider wraps entire app
- Auto-connects to previously used wallet
- Supports Phantom, Backpack, Solflare
- Custom useAnchorProvider hook for program interactions
- Graceful degradation for read-only access without wallet

### 2. Data Fetching Strategy
Three-layer approach:
- On-chain data: Direct program queries via Anchor
- Off-chain data: Supabase for comments, profiles
- Hybrid: React Query synchronizes both sources
- Optimistic updates for better UX
- Background refetching every 30 seconds for live data

### 3. Component Organization
/components structure:
- /ui: Reusable primitives (Button, Card, Dialog)
- /wallet: Wallet connection components
- /proposal: Proposal-specific components
- /voting: Voting interface components  
- /profile: User profile management
- /providers: Context providers and wrappers

### 4. State Management
- Server state: React Query with custom hooks
- Client state: React Context for wallet, user
- Form state: Controlled components with validation
- URL state: Next.js router for navigation

### 5. Key Custom Hooks
- useProposals: Fetches and caches proposal list
- useVote: Handles vote submission with retry logic
- useVotingPower: Calculates user's voting weight
- useVotingEligibility: Checks NFT/token requirements
- useDAORequirements: Fetches current DAO rules

## Performance Optimizations
- Static generation for marketing pages
- Dynamic imports for wallet libraries (50% smaller initial bundle)
- Image optimization with next/image
- Suspense boundaries for async components
- Memo-ized expensive calculations

## Error Handling
- ErrorBoundary at app level
- Toast notifications for user actions
- Retry logic for RPC failures
- Fallback UI for loading states
- Graceful wallet disconnection handling

Transform this into clear, structured documentation with code snippets showing usage patterns.
```

---

## Prompt 3: Deployment Guide (4 minutes)

```
Create docs/deployment/production-deployment.md with these specifications:

# Production Deployment Guide

## Prerequisites
- Solana CLI 1.17+ installed
- Anchor CLI 0.30+ installed  
- Node.js 18+ and pnpm 8+
- Funded Solana wallet (need ~5 SOL for deployment)
- Vercel account for frontend hosting
- Supabase project for database

## Smart Contract Deployment

### Step 1: Configure for Mainnet
Update Anchor.toml:
- cluster = "mainnet"
- wallet = "~/.config/solana/mainnet-wallet.json"
- Remove test configurations

### Step 2: Build Program
\`\`\`bash
anchor build
# Generates target/deploy/dao_program.so
# Updates target/idl/dao_program.json
\`\`\`

### Step 3: Deploy to Mainnet
\`\`\`bash
# Ensure wallet has 3-5 SOL
solana balance

# Deploy program
anchor deploy

# Note the Program ID from output
# Example: 7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj
\`\`\`

### Step 4: Verify Deployment
\`\`\`bash
anchor idl init -f target/idl/dao_program.json <PROGRAM_ID>
anchor idl upgrade -f target/idl/dao_program.json <PROGRAM_ID>
\`\`\`

## Frontend Deployment

### Step 1: Environment Configuration
Create .env.production with:
- NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
- NEXT_PUBLIC_PROGRAM_ID=<your_program_id>
- NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
- NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_anon_key>
- NEXTAUTH_URL=https://your-domain.com
- NEXTAUTH_SECRET=<generate with openssl>

### Step 2: Update Program ID
In src/lib/constants.ts:
- Update PROGRAM_ID
- Set IS_DEVNET = false
- Update RPC endpoints

### Step 3: Deploy to Vercel
\`\`\`bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/dao-voting
vercel --prod

# Set environment variables in Vercel dashboard
\`\`\`

### Step 4: Configure Domain
- Add custom domain in Vercel
- Update DNS records
- Enable SSL (automatic)

## Database Setup

### Supabase Configuration
1. Run migration scripts in order:
   - setup_all_supabase_tables.sql
   - fix_supabase_relationships.sql
   - fix_supabase_anon_access.sql

2. Enable Row Level Security:
   - Profiles: Users can update own profile
   - Comments: Authenticated users can create
   - Activity: Read-only for all

3. Configure Auth:
   - Enable wallet authentication
   - Set JWT expiry to 7 days
   - Configure redirect URLs

## Post-Deployment Checklist
- [ ] Initialize DAO with admin wallet
- [ ] Set voting parameters (quorum, period)
- [ ] Create initial proposals for testing
- [ ] Verify wallet connections work
- [ ] Test vote submission flow
- [ ] Monitor RPC rate limits
- [ ] Set up error tracking (Sentry)
- [ ] Configure analytics (Plausible)
- [ ] Document admin wallet backup

## Monitoring Setup
- Solana Explorer: Monitor program transactions
- Vercel Analytics: Track frontend performance
- Supabase Dashboard: Database metrics
- Custom metrics: Vote participation, proposal success rate

## Rollback Procedure
If issues occur:
1. Revert frontend to previous Vercel deployment
2. Program is immutable - deploy new version if needed
3. Database: Restore from Supabase backups

Transform this into step-by-step documentation with clear commands and verification steps.
```

---

## Prompt 4: Testing Documentation (3 minutes)

```
Create docs/testing/testing-guide.md with our testing specifications:

# Testing Guide

## Smart Contract Tests

### Test Environment Setup
We use Anchor's test framework with:
- Local validator for isolated testing
- Test wallets with 1000 SOL each
- Deterministic program deployment
- Clean state between test suites

### Core Test Scenarios

1. DAO Initialization Tests
   - Valid initialization with proper parameters
   - Invalid parameters rejection (negative values, zero quorum)
   - Duplicate initialization prevention
   - PDA derivation correctness

2. Proposal Creation Tests
   - Valid proposal with all fields
   - Title length validation (max 100 chars)
   - Description length validation (max 500 chars)
   - Proposal counter increment
   - Event emission verification

3. Voting Tests
   - Single vote recording
   - Vote weight calculation (token-based)
   - NFT verification for gated voting
   - Duplicate vote prevention
   - Vote after deadline rejection
   - Quorum calculation accuracy

4. Execution Tests
   - Successful execution after period
   - Early execution prevention
   - Quorum failure handling
   - State transition verification

### Running Contract Tests
\`\`\`bash
# Run all tests
anchor test

# Run specific test file
anchor test -- --grep "DAO initialization"

# Run with detailed output
RUST_LOG=debug anchor test
\`\`\`

## Frontend Testing

### Unit Tests
Components tested with React Testing Library:
- ProposalCard: Renders all proposal states
- VoteButton: Handles all vote types
- WalletButton: Connection/disconnection flow
- CreateProposalModal: Form validation

### Integration Tests
End-to-end flows with Playwright:
1. Complete voting flow:
   - Connect wallet
   - View proposals
   - Cast vote
   - See results update

2. Proposal creation:
   - Open modal
   - Fill form
   - Submit transaction
   - Verify on-chain

### Test Data
Seed scripts provide consistent test data:
- 5 sample proposals in different states
- 10 test votes per proposal
- Mock NFT collections for gating
- Test user profiles

### Running Frontend Tests
\`\`\`bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
\`\`\`

## Manual Testing Checklist

### Wallet Testing
- [ ] Phantom wallet connection
- [ ] Backpack wallet connection  
- [ ] Wallet disconnection
- [ ] Wallet switch handling
- [ ] Insufficient balance handling

### Proposal Testing
- [ ] Create proposal with valid data
- [ ] Create with edge-case characters
- [ ] View proposal details
- [ ] Filter active/completed proposals
- [ ] Pagination with 50+ proposals

### Voting Testing  
- [ ] Vote For/Against/Abstain
- [ ] Vote weight display
- [ ] Real-time vote updates
- [ ] Vote on expired proposal (should fail)
- [ ] Vote without eligibility (should fail)

### Performance Testing
- Load 100+ proposals: < 2s render
- Submit vote: < 3s confirmation
- Wallet connection: < 1s
- Page navigation: < 500ms

## Bug Reporting Template
When reporting bugs, include:
1. Environment (browser, wallet, network)
2. Steps to reproduce
3. Expected vs actual behavior
4. Transaction signatures if applicable
5. Console errors
6. Screenshots

Format this into comprehensive testing documentation with examples and commands.
```

---

## Prompt 5: Operational Runbook (3 minutes)

```
Create docs/operations/runbook.md with these operational procedures:

# Operational Runbook

## Daily Operations

### Health Checks (Run every morning)
1. Check Solana program status:
   \`\`\`bash
   solana program show <PROGRAM_ID>
   # Verify: "State: Deployed"
   \`\`\`

2. Verify RPC endpoint:
   \`\`\`bash
   curl https://api.mainnet-beta.solana.com -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
   # Expected: {"jsonrpc":"2.0","result":"ok","id":1}
   \`\`\`

3. Check frontend status:
   - Visit production URL
   - Verify wallet connection works
   - Check latest proposal loads

4. Database health:
   - Supabase dashboard → Database → Health
   - Check connection pool usage < 80%
   - Verify backup completed

### Weekly Maintenance

1. Review metrics:
   - Total proposals created
   - Average participation rate
   - Failed transactions count
   - User growth rate

2. Clean up old data:
   - Archive proposals older than 90 days
   - Purge test transactions
   - Compress activity logs

3. Security review:
   - Check for unusual voting patterns
   - Review admin actions
   - Verify no unauthorized program upgrades

## Incident Response

### Issue: Wallet Connection Failures
**Symptoms**: Users report "Cannot connect wallet"
**Diagnosis**:
1. Check RPC status: https://status.solana.com
2. Test with different wallet (Phantom/Backpack)
3. Check browser console for errors

**Resolution**:
- If RPC issue: Switch to backup RPC in constants.ts
- If wallet issue: Clear browser cache, reinstall wallet
- If app issue: Roll back recent deployment

### Issue: Transaction Failures
**Symptoms**: "Transaction failed" errors
**Common Causes**:
1. Insufficient SOL for fees
2. RPC rate limiting
3. Program error

**Resolution Steps**:
1. Get transaction signature from error
2. Check in explorer: https://explorer.solana.com/tx/[signature]
3. Common fixes:
   - 0x1: Insufficient funds → User needs more SOL
   - 0x2: Invalid instruction → Check program logs
   - Rate limit → Implement exponential backoff

### Issue: Database Connection Errors
**Symptoms**: Comments/profiles not loading
**Diagnosis**:
\`\`\`sql
-- In Supabase SQL editor
SELECT count(*) FROM pg_stat_activity;
-- Should be < 100
\`\`\`

**Resolution**:
1. Restart connection pool in Supabase
2. Scale up database if at limit
3. Implement connection pooling in app

### Issue: High RPC Costs
**Symptoms**: RPC bill exceeding budget
**Analysis**:
1. Check request patterns in RPC dashboard
2. Identify heavy endpoints
3. Review caching strategy

**Optimization**:
- Increase React Query cache time
- Implement request batching
- Use websocket subscriptions vs polling

## Emergency Procedures

### Program Exploit Detected
1. IMMEDIATE: Alert team via emergency channel
2. Document exploit details
3. Freeze program if upgrade authority exists
4. Notify users via all channels
5. Prepare patched version
6. Coordinate deployment timing

### Frontend Compromise
1. Revert to last known good deployment
2. Revoke compromised API keys
3. Audit recent commits
4. Reset all secrets
5. Deploy clean version

### Database Breach
1. Enable read-only mode
2. Capture audit logs
3. Reset all user sessions
4. Review RLS policies
5. Notify affected users per compliance

## Monitoring Commands

### Check Program Transactions (last 10)
\`\`\`bash
solana program logs <PROGRAM_ID> --limit 10
\`\`\`

### Monitor Vote Activity
\`\`\`sql
-- Recent votes
SELECT COUNT(*), DATE(created_at) 
FROM votes 
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at);
\`\`\`

### Frontend Performance
\`\`\`javascript
// Browser console
performance.getEntriesByType('navigation')[0].loadEventEnd
// Should be < 3000ms
\`\`\`

## Contact Information
- On-call engineer: [Rotation schedule]
- RPC provider support: support@rpc-provider.com
- Vercel support: via dashboard
- Supabase support: via dashboard

Transform this into a comprehensive runbook with clear procedures and commands.
```

---

## Demo Scripts

### Opening Statement
"Today I'll demonstrate how we at Lazer Consulting create professional documentation for our blockchain projects. The key insight: Cursor doesn't generate knowledge - it transforms YOUR expertise into professional documentation."

### After Each Prompt
"Notice how I provided all the technical details? Cursor organized my knowledge into professional docs. The accuracy comes from our input, not AI guessing."

### Closing Statement
"This approach saves 2-3 weeks of documentation work while maintaining quality. The consultant provides the expertise, Cursor provides the formatting and structure."

---

## Quick Reference Commands

### Start Complete Docs (Port 3000)
```bash
cd docs-complete
npm run start
```

### Start Demo Docs (Port 3001)
```bash
cd docs-demo
npm run start -- --port 3001
```

### Install Mermaid Support
```bash
npm install @docusaurus/theme-mermaid
```

### Build Documentation
```bash
npm run build
```

### Test Documentation Site
```bash
npm run serve
```
