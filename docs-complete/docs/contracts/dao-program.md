---
id: dao-program
title: DAO Program Documentation
sidebar_label: Smart Contract
---

# DAO Program Overview

The DAO Program is a Solana smart contract built with the Anchor framework that manages decentralized governance on-chain. It provides a secure, transparent, and efficient system for proposal creation, voting, and execution.

**Program ID**: `7KqAtsakdPmWh1WMpokqMWKsGSNJ3S9He3kb9qtNHUaj`

## Core Functionality

The program manages decentralized governance through the following key features:

### 1. DAO Initialization
Configure and deploy a new DAO with customizable parameters including voting periods, quorum requirements, and access controls.

### 2. Proposal Management
Create and manage governance proposals with:
- **Title**: Up to 100 characters for concise identification
- **Description**: Up to 500 characters for detailed context
- **Voting Period**: Configurable duration for vote collection
- **Automatic Status Tracking**: Active, Passed, Rejected, Executed states

### 3. Voting Mechanisms
Support for multiple voting strategies:
- **Token-Weighted Voting**: Vote power based on token holdings
- **NFT-Gated Voting**: Restrict participation to NFT holders
- **One-Wallet-One-Vote**: Equal voting power for all participants

### 4. Execution Logic
Automated proposal execution with:
- **Quorum Verification**: Minimum 10% participation required
- **Time-Lock Protection**: Execution only after voting period ends
- **Result Calculation**: Automatic pass/fail determination

### 5. Treasury Management
Built-in treasury controls for:
- **Fund Collection**: Accept SOL and SPL tokens
- **Proposal Funding**: Allocate resources to approved proposals
- **Access Control**: Admin-only withdrawal capabilities

## Account Structures

### DAO Account (PDA)

The main account storing DAO configuration and state.

```rust
pub struct Dao {
    pub admin: Pubkey,           // DAO administrator
    pub proposal_count: u64,     // Total proposals created
    pub min_votes_required: u64, // Minimum votes for quorum
    pub voting_period: i64,      // Duration in seconds
    pub treasury: Pubkey,        // Treasury wallet address
    pub nft_collection: Option<Pubkey>, // Optional NFT gate
    pub voting_token: Option<Pubkey>,   // Optional token gate
}
```

**PDA Derivation**:
```typescript
const [daoAccount] = PublicKey.findProgramAddressSync(
  [Buffer.from("dao"), adminPubkey.toBuffer()],
  programId
);
```

**Size**: 500 bytes allocated

### Proposal Account (PDA)

Individual proposal storage with voting data.

```rust
pub struct Proposal {
    pub id: u64,                 // Unique identifier
    pub dao: Pubkey,            // Parent DAO account
    pub creator: Pubkey,        // Proposal creator
    pub title: String,          // Proposal title
    pub description: String,    // Detailed description
    pub votes_for: u64,         // Supporting votes
    pub votes_against: u64,     // Opposing votes
    pub votes_abstain: u64,     // Neutral votes
    pub total_weight: u64,      // Total voting weight
    pub status: ProposalStatus, // Current status
    pub created_at: i64,        // Creation timestamp
    pub voting_ends_at: i64,    // Voting deadline
    pub executed_at: Option<i64>, // Execution timestamp
}

pub enum ProposalStatus {
    Active,    // Voting in progress
    Passed,    // Approved by voters
    Rejected,  // Failed to pass
    Executed,  // Action completed
    Cancelled, // Withdrawn by creator
}
```

**PDA Derivation**:
```typescript
const [proposalAccount] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("proposal"),
    daoAccount.toBuffer(),
    proposalId.toArrayLike(Buffer, "le", 8)
  ],
  programId
);
```

**Size**: 2000 bytes allocated

### Vote Account (PDA)

Individual vote records for audit trail.

```rust
pub struct Vote {
    pub proposal: Pubkey,    // Proposal being voted on
    pub voter: Pubkey,       // Voter's wallet
    pub vote_type: VoteType, // Vote direction
    pub weight: u64,         // Voting power
    pub timestamp: i64,      // Vote timestamp
}

pub enum VoteType {
    For,      // Support proposal
    Against,  // Oppose proposal
    Abstain,  // Neutral stance
}
```

**PDA Derivation**:
```typescript
const [voteAccount] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("vote"),
    proposalAccount.toBuffer(),
    voterPubkey.toBuffer()
  ],
  programId
);
```

**Size**: 100 bytes allocated

## Instructions

### 1. Initialize DAO

Creates a new DAO with specified parameters.

```rust
pub fn initialize_dao(
    ctx: Context<InitializeDao>,
    min_votes_required: u64,
    voting_period: i64,
) -> Result<()>
```

**Parameters**:
- `min_votes_required`: Minimum votes for quorum (e.g., 100)
- `voting_period`: Duration in seconds (e.g., 259200 for 3 days)

**Required Accounts**:
- `dao`: DAO account to initialize (PDA)
- `admin`: DAO administrator (signer)
- `treasury`: Treasury wallet
- `payer`: Transaction fee payer (signer)
- `system_program`: Solana system program

**Validation**:
- `min_votes_required` must be greater than 0
- `voting_period` must be at least 86400 (1 day)
- Admin cannot be system program

**Example Usage**:
```typescript
const tx = await program.methods
  .initializeDao(
    new BN(100),        // min_votes_required
    new BN(259200)      // voting_period (3 days)
  )
  .accounts({
    dao: daoAccount,
    admin: wallet.publicKey,
    treasury: treasuryWallet,
    payer: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 2. Create Proposal

Submits a new governance proposal.

```rust
pub fn create_proposal(
    ctx: Context<CreateProposal>,
    title: String,
    description: String,
) -> Result<()>
```

**Parameters**:
- `title`: Proposal title (max 100 characters)
- `description`: Detailed description (max 500 characters)

**Required Accounts**:
- `proposal`: New proposal account (PDA)
- `dao`: Parent DAO account
- `creator`: Proposal creator (signer)
- `payer`: Transaction fee payer (signer)
- `system_program`: Solana system program

**Access Control**:
- Token holders: Must have minimum balance
- NFT holders: Must own collection NFT
- Open DAOs: Any wallet can create

**Validation**:
- Title length: 1-100 characters
- Description length: 1-500 characters
- No special characters in title
- Creator must meet eligibility requirements

**Example Usage**:
```typescript
const proposalId = dao.proposalCount.add(new BN(1));
const [proposalAccount] = getProposalAddress(daoAccount, proposalId);

const tx = await program.methods
  .createProposal(
    "Increase Treasury Allocation",
    "Proposal to increase monthly treasury allocation to 1000 SOL for development expenses"
  )
  .accounts({
    proposal: proposalAccount,
    dao: daoAccount,
    creator: wallet.publicKey,
    payer: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 3. Cast Vote

Records a vote on an active proposal.

```rust
pub fn cast_vote(
    ctx: Context<CastVote>,
    vote_type: VoteType,
    weight: u64,
) -> Result<()>
```

**Parameters**:
- `vote_type`: Vote direction (For/Against/Abstain)
- `weight`: Voting power (token amount or NFT count)

**Required Accounts**:
- `vote`: Vote record account (PDA)
- `proposal`: Target proposal account
- `dao`: Parent DAO account
- `voter`: Voter wallet (signer)
- `payer`: Transaction fee payer (signer)
- `system_program`: Solana system program

**Validation**:
- Proposal must be active
- Voting period must not be expired
- Voter must not have already voted
- Weight must match actual holdings

**NFT Verification**:
```rust
// Check NFT ownership
let nft_account = ctx.accounts.nft_token_account;
if nft_account.amount != 1 {
    return Err(ErrorCode::NoNftOwnership);
}
if nft_account.mint != dao.nft_collection {
    return Err(ErrorCode::WrongCollection);
}
```

**Example Usage**:
```typescript
const [voteAccount] = getVoteAddress(proposalAccount, voter);

const tx = await program.methods
  .castVote(
    { for: {} },        // VoteType enum
    new BN(100)         // weight
  )
  .accounts({
    vote: voteAccount,
    proposal: proposalAccount,
    dao: daoAccount,
    voter: wallet.publicKey,
    payer: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

### 4. Execute Proposal

Finalizes a proposal after voting ends.

```rust
pub fn execute_proposal(
    ctx: Context<ExecuteProposal>,
) -> Result<()>
```

**Required Accounts**:
- `proposal`: Proposal to execute
- `dao`: Parent DAO account
- `executor`: Any wallet (signer)

**Logic Flow**:
1. Verify voting period has ended
2. Calculate total participation
3. Check quorum requirements
4. Determine pass/fail status
5. Update proposal state
6. Emit execution event

**Quorum Calculation**:
```rust
let total_votes = proposal.votes_for
    .checked_add(proposal.votes_against)
    .checked_add(proposal.votes_abstain)?;

let quorum_met = total_votes >= dao.min_votes_required;
let majority_for = proposal.votes_for > proposal.votes_against;

proposal.status = if quorum_met && majority_for {
    ProposalStatus::Passed
} else {
    ProposalStatus::Rejected
};
```

**Example Usage**:
```typescript
const tx = await program.methods
  .executeProposal()
  .accounts({
    proposal: proposalAccount,
    dao: daoAccount,
    executor: wallet.publicKey,
  })
  .rpc();
```

## Security Considerations

### Access Control
- **Admin Restrictions**: Admin cannot vote to prevent centralization
- **Signer Verification**: All state changes require proper signatures
- **PDA Validation**: Account addresses are deterministically derived

### Vote Integrity
- **Immutable Votes**: Once cast, votes cannot be changed
- **Duplicate Prevention**: One vote per wallet per proposal
- **Weight Verification**: Voting power validated against holdings

### Time Security
- **Clock Drift Protection**: Uses Solana clock with tolerance
- **Deadline Enforcement**: Strict voting period limits
- **Early Execution Prevention**: Time checks before finalization

### Arithmetic Safety
- **Overflow Protection**: Checked math operations
- **Underflow Guards**: Safe subtraction patterns
- **Division Safety**: Zero-division prevention

```rust
// Safe addition example
let new_total = proposal.votes_for
    .checked_add(weight)
    .ok_or(ErrorCode::MathOverflow)?;
```

### Input Validation
- **String Sanitization**: Length and character checks
- **Parameter Bounds**: Min/max value validation
- **State Verification**: Proper status transitions

## Error Codes

Common error codes and their meanings:

| Code | Name | Description |
|------|------|-------------|
| 0x1  | `InvalidAdmin` | Admin address is invalid |
| 0x2  | `ProposalNotActive` | Proposal is not in voting phase |
| 0x3  | `VotingPeriodEnded` | Voting deadline has passed |
| 0x4  | `AlreadyVoted` | User has already voted |
| 0x5  | `InsufficientTokens` | Not enough tokens for voting |
| 0x6  | `NoNftOwnership` | User doesn't own required NFT |
| 0x7  | `QuorumNotMet` | Minimum participation not reached |
| 0x8  | `MathOverflow` | Arithmetic operation overflow |
| 0x9  | `InvalidVoteWeight` | Vote weight doesn't match holdings |
| 0xA  | `ProposalTooLong` | Title or description exceeds limits |

## Events

The program emits events for important actions:

```rust
#[event]
pub struct ProposalCreated {
    pub proposal_id: u64,
    pub creator: Pubkey,
    pub title: String,
    pub created_at: i64,
}

#[event]
pub struct VoteCast {
    pub proposal_id: u64,
    pub voter: Pubkey,
    pub vote_type: VoteType,
    pub weight: u64,
    pub timestamp: i64,
}

#[event]
pub struct ProposalExecuted {
    pub proposal_id: u64,
    pub status: ProposalStatus,
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed_at: i64,
}
```

## Best Practices

### For Developers
1. Always validate user inputs before sending transactions
2. Implement proper error handling for all RPC calls
3. Use optimistic updates for better UX
4. Cache proposal data to minimize RPC requests
5. Monitor gas costs and optimize transaction size

### For DAO Administrators
1. Set reasonable quorum requirements (10-20% typical)
2. Use appropriate voting periods (3-7 days recommended)
3. Regularly monitor proposal activity
4. Implement off-chain discussion before proposals
5. Document governance processes clearly

### For Integration
1. Use Anchor's generated IDL for type safety
2. Implement retry logic for failed transactions
3. Subscribe to program events for real-time updates
4. Validate PDA derivations on client side
5. Handle wallet disconnections gracefully
