---
id: testing-guide
title: Testing Guide
sidebar_label: Testing Guide
---

# Testing Guide

Comprehensive testing is critical for the security and reliability of the DAO Voting Platform. This guide covers testing strategies for smart contracts, frontend components, and end-to-end user flows.

## Testing Philosophy

Our testing approach follows these principles:
- **Security First**: Smart contract tests focus on security vulnerabilities
- **User Experience**: Frontend tests ensure smooth user interactions
- **Integration Coverage**: E2E tests verify complete workflows
- **Performance Validation**: Load tests ensure scalability
- **Continuous Testing**: Automated tests run on every commit

## Smart Contract Tests

### Test Environment Setup

The Anchor framework provides a robust testing environment:

```typescript
// tests/dao_program.ts
import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { DaoProgram } from '../target/types/dao_program';
import { assert } from 'chai';

describe('dao_program', () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  
  const program = anchor.workspace.DaoProgram as Program<DaoProgram>;
  
  // Test wallets with 1000 SOL each
  const admin = Keypair.generate();
  const voter1 = Keypair.generate();
  const voter2 = Keypair.generate();
  const voter3 = Keypair.generate();
  
  before(async () => {
    // Airdrop SOL to test wallets
    await airdropSol(admin.publicKey, 1000);
    await airdropSol(voter1.publicKey, 1000);
    await airdropSol(voter2.publicKey, 1000);
    await airdropSol(voter3.publicKey, 1000);
  });
});
```

### Core Test Scenarios

#### 1. DAO Initialization Tests

```typescript
describe('DAO Initialization', () => {
  it('should initialize DAO with valid parameters', async () => {
    const [daoAccount] = await PublicKey.findProgramAddress(
      [Buffer.from('dao'), admin.publicKey.toBuffer()],
      program.programId
    );
    
    await program.methods
      .initializeDao(new BN(100), new BN(259200))
      .accounts({
        dao: daoAccount,
        admin: admin.publicKey,
        treasury: treasury.publicKey,
        payer: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();
    
    const dao = await program.account.dao.fetch(daoAccount);
    assert.equal(dao.admin.toString(), admin.publicKey.toString());
    assert.equal(dao.minVotesRequired.toNumber(), 100);
    assert.equal(dao.votingPeriod.toNumber(), 259200);
  });
  
  it('should reject invalid parameters', async () => {
    try {
      await program.methods
        .initializeDao(new BN(0), new BN(100)) // Invalid: zero quorum
        .accounts({...})
        .rpc();
      assert.fail('Should have thrown error');
    } catch (err) {
      assert.include(err.message, 'InvalidQuorum');
    }
  });
  
  it('should prevent duplicate initialization', async () => {
    // First initialization
    await initializeDAO(admin);
    
    // Attempt duplicate
    try {
      await initializeDAO(admin);
      assert.fail('Should prevent duplicate');
    } catch (err) {
      assert.include(err.message, 'already in use');
    }
  });
  
  it('should validate PDA derivation', async () => {
    const [expectedPDA, bump] = await PublicKey.findProgramAddress(
      [Buffer.from('dao'), admin.publicKey.toBuffer()],
      program.programId
    );
    
    const dao = await program.account.dao.fetch(expectedPDA);
    assert.exists(dao);
    assert.equal(dao.admin.toString(), admin.publicKey.toString());
  });
});
```

#### 2. Proposal Creation Tests

```typescript
describe('Proposal Creation', () => {
  it('should create valid proposal', async () => {
    const proposalId = new BN(1);
    const [proposalAccount] = await getProposalAddress(daoAccount, proposalId);
    
    await program.methods
      .createProposal(
        'Test Proposal',
        'This is a test proposal description'
      )
      .accounts({
        proposal: proposalAccount,
        dao: daoAccount,
        creator: voter1.publicKey,
        payer: voter1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter1])
      .rpc();
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    assert.equal(proposal.title, 'Test Proposal');
    assert.equal(proposal.creator.toString(), voter1.publicKey.toString());
    assert.equal(proposal.status, { active: {} });
  });
  
  it('should validate title length', async () => {
    const longTitle = 'a'.repeat(101); // Exceeds 100 char limit
    
    try {
      await program.methods
        .createProposal(longTitle, 'Description')
        .accounts({...})
        .rpc();
      assert.fail('Should reject long title');
    } catch (err) {
      assert.include(err.message, 'TitleTooLong');
    }
  });
  
  it('should validate description length', async () => {
    const longDesc = 'a'.repeat(501); // Exceeds 500 char limit
    
    try {
      await program.methods
        .createProposal('Title', longDesc)
        .accounts({...})
        .rpc();
      assert.fail('Should reject long description');
    } catch (err) {
      assert.include(err.message, 'DescriptionTooLong');
    }
  });
  
  it('should increment proposal counter', async () => {
    const daoBefore = await program.account.dao.fetch(daoAccount);
    const countBefore = daoBefore.proposalCount.toNumber();
    
    await createProposal(voter1, 'New Proposal', 'Description');
    
    const daoAfter = await program.account.dao.fetch(daoAccount);
    const countAfter = daoAfter.proposalCount.toNumber();
    
    assert.equal(countAfter, countBefore + 1);
  });
  
  it('should emit ProposalCreated event', async () => {
    const listener = program.addEventListener('ProposalCreated', (event) => {
      assert.equal(event.title, 'Event Test Proposal');
      assert.equal(event.creator.toString(), voter1.publicKey.toString());
    });
    
    await createProposal(voter1, 'Event Test Proposal', 'Description');
    
    // Wait for event
    await sleep(1000);
    program.removeEventListener(listener);
  });
});
```

#### 3. Voting Tests

```typescript
describe('Voting Mechanism', () => {
  it('should record single vote', async () => {
    const [voteAccount] = await getVoteAddress(proposalAccount, voter1.publicKey);
    
    await program.methods
      .castVote({ for: {} }, new BN(1))
      .accounts({
        vote: voteAccount,
        proposal: proposalAccount,
        dao: daoAccount,
        voter: voter1.publicKey,
        payer: voter1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter1])
      .rpc();
    
    const vote = await program.account.vote.fetch(voteAccount);
    assert.equal(vote.voteType, { for: {} });
    assert.equal(vote.weight.toNumber(), 1);
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    assert.equal(proposal.votesFor.toNumber(), 1);
  });
  
  it('should calculate vote weight for tokens', async () => {
    // Setup token account with balance
    const tokenBalance = new BN(1000);
    await setupTokenAccount(voter2.publicKey, tokenBalance);
    
    await program.methods
      .castVote({ for: {} }, tokenBalance)
      .accounts({
        vote: voteAccount,
        proposal: proposalAccount,
        dao: daoAccount,
        voter: voter2.publicKey,
        tokenAccount: tokenAccountAddress,
        payer: voter2.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter2])
      .rpc();
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    assert.equal(proposal.votesFor.toNumber(), tokenBalance.toNumber());
  });
  
  it('should verify NFT ownership for gated voting', async () => {
    // Setup NFT ownership
    const nftMint = await createNFT(nftCollection, voter3.publicKey);
    
    await program.methods
      .castVote({ for: {} }, new BN(1))
      .accounts({
        vote: voteAccount,
        proposal: proposalAccount,
        dao: daoAccount,
        voter: voter3.publicKey,
        nftTokenAccount: nftTokenAccount,
        payer: voter3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([voter3])
      .rpc();
    
    const vote = await program.account.vote.fetch(voteAccount);
    assert.exists(vote);
  });
  
  it('should prevent duplicate voting', async () => {
    // First vote
    await castVote(voter1, proposalAccount, { for: {} });
    
    // Attempt duplicate
    try {
      await castVote(voter1, proposalAccount, { against: {} });
      assert.fail('Should prevent duplicate vote');
    } catch (err) {
      assert.include(err.message, 'AlreadyVoted');
    }
  });
  
  it('should reject vote after deadline', async () => {
    // Fast forward time
    await fastForward(4 * 24 * 60 * 60); // 4 days
    
    try {
      await castVote(voter2, proposalAccount, { for: {} });
      assert.fail('Should reject late vote');
    } catch (err) {
      assert.include(err.message, 'VotingPeriodEnded');
    }
  });
  
  it('should accurately calculate quorum', async () => {
    // Cast multiple votes
    await castVote(voter1, proposalAccount, { for: {} }, 30);
    await castVote(voter2, proposalAccount, { against: {} }, 25);
    await castVote(voter3, proposalAccount, { abstain: {} }, 20);
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    const totalVotes = proposal.votesFor.toNumber() + 
                      proposal.votesAgainst.toNumber() + 
                      proposal.votesAbstain.toNumber();
    
    assert.equal(totalVotes, 75);
    assert.isTrue(totalVotes >= dao.minVotesRequired.toNumber());
  });
});
```

#### 4. Execution Tests

```typescript
describe('Proposal Execution', () => {
  it('should execute after voting period', async () => {
    // Setup: Create proposal and cast votes
    const proposalAccount = await createProposal(voter1, 'Execute Test', 'Description');
    await castVote(voter1, proposalAccount, { for: {} }, 60);
    await castVote(voter2, proposalAccount, { against: {} }, 30);
    
    // Fast forward past voting period
    await fastForward(3 * 24 * 60 * 60 + 1);
    
    await program.methods
      .executeProposal()
      .accounts({
        proposal: proposalAccount,
        dao: daoAccount,
        executor: anyone.publicKey,
      })
      .signers([anyone])
      .rpc();
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    assert.equal(proposal.status, { passed: {} });
  });
  
  it('should prevent early execution', async () => {
    const proposalAccount = await createProposal(voter1, 'Early Test', 'Description');
    
    try {
      await program.methods
        .executeProposal()
        .accounts({
          proposal: proposalAccount,
          dao: daoAccount,
          executor: anyone.publicKey,
        })
        .rpc();
      assert.fail('Should prevent early execution');
    } catch (err) {
      assert.include(err.message, 'VotingPeriodNotEnded');
    }
  });
  
  it('should handle quorum failure', async () => {
    const proposalAccount = await createProposal(voter1, 'Quorum Test', 'Description');
    await castVote(voter1, proposalAccount, { for: {} }, 5); // Below quorum
    
    await fastForward(3 * 24 * 60 * 60 + 1);
    
    await program.methods.executeProposal().accounts({...}).rpc();
    
    const proposal = await program.account.proposal.fetch(proposalAccount);
    assert.equal(proposal.status, { rejected: {} });
  });
  
  it('should update state transitions correctly', async () => {
    const states = [];
    
    // Track state changes
    const proposalAccount = await createProposal(voter1, 'State Test', 'Description');
    let proposal = await program.account.proposal.fetch(proposalAccount);
    states.push(proposal.status);
    
    await castVote(voter1, proposalAccount, { for: {} }, 100);
    proposal = await program.account.proposal.fetch(proposalAccount);
    states.push(proposal.status);
    
    await fastForward(3 * 24 * 60 * 60 + 1);
    await executeProposal(proposalAccount);
    proposal = await program.account.proposal.fetch(proposalAccount);
    states.push(proposal.status);
    
    assert.deepEqual(states, [{ active: {} }, { active: {} }, { passed: {} }]);
  });
});
```

### Running Contract Tests

```bash
# Run all tests
anchor test

# Run specific test suite
anchor test -- --grep "DAO initialization"

# Run with detailed output
RUST_LOG=debug anchor test

# Run with coverage (requires additional setup)
anchor test --coverage

# Run in specific environment
anchor test --provider.cluster devnet
```

## Frontend Testing

### Unit Tests

Component testing with React Testing Library:

```typescript
// components/proposal/ProposalCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProposalCard } from './ProposalCard';
import { mockProposal } from '../../test/mocks';

describe('ProposalCard', () => {
  it('renders all proposal states', () => {
    const states = ['active', 'passed', 'rejected', 'executed'];
    
    states.forEach(status => {
      const proposal = { ...mockProposal, status };
      render(<ProposalCard proposal={proposal} />);
      
      const badge = screen.getByText(status.toUpperCase());
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(`badge-${status}`);
    });
  });
  
  it('displays vote percentages correctly', () => {
    const proposal = {
      ...mockProposal,
      votesFor: 60,
      votesAgainst: 30,
      votesAbstain: 10,
    };
    
    render(<ProposalCard proposal={proposal} />);
    
    expect(screen.getByText('60%')).toBeInTheDocument(); // For
    expect(screen.getByText('30%')).toBeInTheDocument(); // Against
    expect(screen.getByText('10%')).toBeInTheDocument(); // Abstain
  });
  
  it('handles click navigation', () => {
    const mockPush = jest.fn();
    jest.mock('next/navigation', () => ({
      useRouter: () => ({ push: mockPush }),
    }));
    
    render(<ProposalCard proposal={mockProposal} />);
    fireEvent.click(screen.getByRole('article'));
    
    expect(mockPush).toHaveBeenCalledWith(`/proposal/${mockProposal.id}`);
  });
});
```

```typescript
// components/vote/VoteButton.test.tsx
describe('VoteButton', () => {
  it('handles all vote types', async () => {
    const mockVote = jest.fn();
    render(<VoteButton onVote={mockVote} />);
    
    // Test For vote
    fireEvent.click(screen.getByText('Vote For'));
    expect(mockVote).toHaveBeenCalledWith({ for: {} });
    
    // Test Against vote
    fireEvent.click(screen.getByText('Vote Against'));
    expect(mockVote).toHaveBeenCalledWith({ against: {} });
    
    // Test Abstain vote
    fireEvent.click(screen.getByText('Abstain'));
    expect(mockVote).toHaveBeenCalledWith({ abstain: {} });
  });
  
  it('shows loading state during transaction', async () => {
    const mockVote = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<VoteButton onVote={mockVote} />);
    
    fireEvent.click(screen.getByText('Vote For'));
    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Submitting...')).not.toBeInTheDocument();
    });
  });
  
  it('disables when wallet not connected', () => {
    jest.mock('@solana/wallet-adapter-react', () => ({
      useWallet: () => ({ connected: false }),
    }));
    
    render(<VoteButton onVote={jest.fn()} />);
    
    const button = screen.getByText('Connect Wallet to Vote');
    expect(button).toBeDisabled();
  });
});
```

```typescript
// components/wallet/WalletButton.test.tsx
describe('WalletButton', () => {
  it('shows connection flow', async () => {
    const { rerender } = render(<WalletButton />);
    
    // Initial disconnected state
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    
    // Mock connection
    jest.mock('@solana/wallet-adapter-react', () => ({
      useWallet: () => ({ 
        connected: true, 
        publicKey: new PublicKey('11111111111111111111111111111111') 
      }),
    }));
    
    rerender(<WalletButton />);
    
    // Connected state
    expect(screen.getByText('1111...1111')).toBeInTheDocument();
  });
  
  it('handles disconnection', async () => {
    const mockDisconnect = jest.fn();
    jest.mock('@solana/wallet-adapter-react', () => ({
      useWallet: () => ({ 
        connected: true,
        disconnect: mockDisconnect,
      }),
    }));
    
    render(<WalletButton />);
    fireEvent.click(screen.getByText('Disconnect'));
    
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
```

```typescript
// components/proposal/CreateProposalModal.test.tsx
describe('CreateProposalModal', () => {
  it('validates form inputs', async () => {
    render(<CreateProposalModal isOpen={true} onClose={jest.fn()} />);
    
    // Submit empty form
    fireEvent.click(screen.getByText('Submit Proposal'));
    
    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(screen.getByText('Description is required')).toBeInTheDocument();
  });
  
  it('enforces character limits', async () => {
    render(<CreateProposalModal isOpen={true} onClose={jest.fn()} />);
    
    const titleInput = screen.getByLabelText('Title');
    const longTitle = 'a'.repeat(101);
    
    fireEvent.change(titleInput, { target: { value: longTitle } });
    fireEvent.blur(titleInput);
    
    expect(screen.getByText('Title must be 100 characters or less')).toBeInTheDocument();
  });
  
  it('submits valid proposal', async () => {
    const mockSubmit = jest.fn();
    render(<CreateProposalModal isOpen={true} onClose={jest.fn()} onSubmit={mockSubmit} />);
    
    fireEvent.change(screen.getByLabelText('Title'), { 
      target: { value: 'Test Proposal' } 
    });
    fireEvent.change(screen.getByLabelText('Description'), { 
      target: { value: 'Test Description' } 
    });
    
    fireEvent.click(screen.getByText('Submit Proposal'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        title: 'Test Proposal',
        description: 'Test Description',
      });
    });
  });
});
```

### Integration Tests

End-to-end testing with Playwright:

```typescript
// e2e/voting-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Voting Flow', () => {
  test('should complete entire voting journey', async ({ page }) => {
    // 1. Connect wallet
    await page.goto('/');
    await page.click('text=Connect Wallet');
    await page.click('text=Phantom'); // Select Phantom wallet
    
    // Wait for wallet connection (mocked in test env)
    await expect(page.locator('text=Disconnect')).toBeVisible();
    
    // 2. View proposals
    await page.click('text=View Proposals');
    await expect(page).toHaveURL('/proposals');
    
    // 3. Select a proposal
    await page.click('.proposal-card:first-child');
    await expect(page).toHaveURL(/\/proposal\/.+/);
    
    // 4. Cast vote
    await page.click('text=Vote For');
    
    // Confirm transaction in mock wallet
    await page.click('text=Approve', { force: true });
    
    // 5. Verify vote recorded
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible();
    await expect(page.locator('text=You voted: For')).toBeVisible();
  });
  
  test('should handle wallet disconnection gracefully', async ({ page }) => {
    await page.goto('/proposal/1');
    
    // Attempt to vote without wallet
    await page.click('text=Vote For');
    
    // Should redirect to wallet connection
    await expect(page.locator('text=Please connect your wallet')).toBeVisible();
    await expect(page).toHaveURL('/connect-wallet');
  });
});
```

```typescript
// e2e/proposal-creation.spec.ts
test.describe('Proposal Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Connect wallet
    await connectWallet(page);
  });
  
  test('should create new proposal', async ({ page }) => {
    // 1. Open creation modal
    await page.goto('/proposals');
    await page.click('text=Create Proposal');
    
    // 2. Fill form
    await page.fill('input[name="title"]', 'E2E Test Proposal');
    await page.fill('textarea[name="description"]', 'This is an automated test proposal');
    
    // 3. Submit
    await page.click('button:has-text("Submit")');
    
    // 4. Confirm transaction
    await page.click('text=Approve');
    
    // 5. Verify creation
    await expect(page.locator('text=Proposal created successfully')).toBeVisible();
    await expect(page.locator('text=E2E Test Proposal')).toBeVisible();
  });
  
  test('should validate inputs', async ({ page }) => {
    await page.goto('/proposals');
    await page.click('text=Create Proposal');
    
    // Try submitting empty form
    await page.click('button:has-text("Submit")');
    
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
    
    // Try exceeding limits
    const longTitle = 'a'.repeat(101);
    await page.fill('input[name="title"]', longTitle);
    
    await expect(page.locator('text=Title too long')).toBeVisible();
  });
});
```

### Test Data Management

Seed scripts for consistent test data:

```typescript
// scripts/seed-test-data.ts
import { Program } from '@coral-xyz/anchor';
import { Connection, Keypair } from '@solana/web3.js';

const seedTestData = async () => {
  const connection = new Connection('http://localhost:8899');
  const program = await getProgram(connection);
  
  // Create test proposals in different states
  const proposals = [
    { title: 'Active Proposal', votesFor: 45, votesAgainst: 30, status: 'active' },
    { title: 'Passed Proposal', votesFor: 75, votesAgainst: 20, status: 'passed' },
    { title: 'Rejected Proposal', votesFor: 15, votesAgainst: 60, status: 'rejected' },
    { title: 'Low Participation', votesFor: 5, votesAgainst: 3, status: 'active' },
    { title: 'Controversial', votesFor: 50, votesAgainst: 49, status: 'active' },
  ];
  
  for (const data of proposals) {
    await createTestProposal(program, data);
  }
  
  // Create test votes
  const voters = await generateTestVoters(10);
  for (const voter of voters) {
    await castTestVote(program, voter, proposals[0], { for: {} });
  }
  
  // Create test user profiles
  await createTestProfiles(voters);
  
  // Create test comments
  await createTestComments(proposals[0].id, voters);
  
  console.log('Test data seeded successfully');
};
```

### Running Frontend Tests

```bash
# Unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E in headed mode (see browser)
pnpm test:e2e --headed

# E2E for specific browser
pnpm test:e2e --browser=firefox

# Debug E2E tests
pnpm test:e2e --debug
```

## Manual Testing Checklist

### Wallet Testing
- [ ] **Phantom wallet connection**: Connect, approve, see address
- [ ] **Backpack wallet connection**: Connect, approve, see address
- [ ] **Wallet disconnection**: Disconnect cleanly, clear session
- [ ] **Wallet switch**: Switch between wallets smoothly
- [ ] **Insufficient balance**: Show clear error message
- [ ] **Network mismatch**: Detect and prompt network switch

### Proposal Testing
- [ ] **Create with valid data**: Title, description, submit
- [ ] **Edge-case characters**: Emojis, special chars, unicode
- [ ] **View details**: All fields display correctly
- [ ] **Filter active**: Show only active proposals
- [ ] **Filter completed**: Show passed/rejected
- [ ] **Pagination**: Handle 50+ proposals smoothly
- [ ] **Search**: Find proposals by title/description
- [ ] **Sort options**: Recent, popular, ending soon

### Voting Testing
- [ ] **Vote For**: Transaction completes, count updates
- [ ] **Vote Against**: Transaction completes, count updates
- [ ] **Vote Abstain**: Transaction completes, count updates
- [ ] **Weight display**: Show correct voting power
- [ ] **Real-time updates**: See other votes live
- [ ] **Expired proposal**: Cannot vote, shows message
- [ ] **No eligibility**: NFT/token gate prevents voting
- [ ] **Already voted**: Prevents duplicate, shows previous vote

### Performance Testing

#### Load Testing Benchmarks
- **100+ proposals load**: < 2 seconds
- **Vote submission**: < 3 seconds including confirmation
- **Wallet connection**: < 1 second
- **Page navigation**: < 500ms
- **Search results**: < 200ms
- **Filter application**: < 100ms

#### Load Test Script
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up
    { duration: '1m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 50 }, // Ramp to 50
    { duration: '1m', target: 50 },  // Stay at 50
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'],     // Error rate under 10%
  },
};

export default function () {
  // Test proposal listing
  const proposalsRes = http.get('https://api.dao-voting.com/proposals');
  check(proposalsRes, {
    'proposals loaded': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 2000,
  });
  
  sleep(1);
  
  // Test individual proposal
  const proposalRes = http.get('https://api.dao-voting.com/proposal/1');
  check(proposalRes, {
    'proposal loaded': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

## Bug Reporting Template

When reporting bugs, include the following information:

```markdown
## Bug Report

### Environment
- **Browser**: Chrome 120.0.6099.109
- **Wallet**: Phantom v23.13.0
- **Network**: Devnet / Mainnet
- **OS**: macOS 14.2
- **App Version**: 1.0.3

### Steps to Reproduce
1. Connect Phantom wallet
2. Navigate to /proposals
3. Click "Create Proposal"
4. Fill in title and description
5. Click "Submit"

### Expected Behavior
Proposal should be created and appear in the list

### Actual Behavior
Transaction fails with error "insufficient lamports"

### Error Messages
```
Error: Transaction simulation failed
Program log: Error: insufficient lamports 5000, need 5825
```

### Transaction Signature (if applicable)
`5KTh3Gh5P8x7mNtg...` (full signature)

### Console Errors
```javascript
Uncaught (in promise) Error: Transaction failed
  at sendTransaction (anchor-client.ts:142)
  at async createProposal (use-create-proposal.ts:28)
```

### Screenshots
[Attach screenshots showing the issue]

### Additional Context
- This only happens when creating the first proposal
- Works fine after refreshing the page
- May be related to rent exemption calculation
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          
      - name: Setup Solana
        uses: solana-labs/solana-github-actions/setup@v1
        with:
          solana-version: 1.17.0
          
      - name: Setup Anchor
        run: npm i -g @coral-xyz/anchor-cli
        
      - name: Run Contract Tests
        run: |
          cd programs/dao_program
          anchor test
          
  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install pnpm
        run: npm i -g pnpm
        
      - name: Install Dependencies
        run: pnpm install
        
      - name: Run Unit Tests
        run: pnpm test
        
      - name: Run E2E Tests
        run: pnpm test:e2e
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Coverage Requirements

### Minimum Coverage Targets
- **Smart Contracts**: 90% coverage
- **Critical Functions**: 100% coverage
- **UI Components**: 80% coverage
- **Utilities**: 95% coverage
- **Overall**: 85% coverage

### Coverage Report Generation
```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Check coverage thresholds
pnpm test:coverage --check-coverage
```

## Security Testing

### Smart Contract Security Checklist
- [ ] Reentrancy protection verified
- [ ] Integer overflow/underflow handled
- [ ] Access control properly implemented
- [ ] PDA derivation validated
- [ ] Time-based attacks prevented
- [ ] Economic attacks considered

### Frontend Security Testing
- [ ] XSS prevention verified
- [ ] CSRF tokens implemented
- [ ] Content Security Policy tested
- [ ] Wallet signature validation
- [ ] Rate limiting functional
- [ ] Input sanitization complete
