import {
  Commitment,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js';
import { COMMITMENT, PROGRAM_ID, RPC_URL } from './constants';

export interface Wallet {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  sendTransaction: (
    transaction: Transaction,
    connection: Connection,
    options?: any
  ) => Promise<string>;
}

export interface ProposalAccount {
  id: number;
  creator: PublicKey;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  status: 'active' | 'finalized';
  createdAt: number;
  expiresAt: number;  // New field
  bump: number;
}

export interface DaoStateAccount {
  authority: PublicKey;
  daoName: string;
  proposalCount: number;
  bump: number;
}

export interface VoteRecord {
  voter: PublicKey;
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
  timestamp: number;
  bump: number;
}

// Instruction discriminators (first 8 bytes of each instruction)
const INSTRUCTION_DISCRIMINATORS = {
  initialize: Buffer.from([175, 175, 109, 31, 13, 152, 155, 237]),
  createProposal: Buffer.from([132, 116, 68, 174, 216, 160, 198, 22]),
  castVote: Buffer.from([20, 212, 15, 189, 69, 180, 69, 151]),
  finalizeProposal: Buffer.from([23, 68, 51, 167, 109, 173, 187, 164]),
};

export function getConnection(commitment: Commitment = COMMITMENT as Commitment): Connection {
  return new Connection(RPC_URL, commitment);
}

export async function getDaoStatePDA(): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('dao-state')],
    PROGRAM_ID
  );
}

export async function getProposalPDA(proposalId: number): Promise<[PublicKey, number]> {
  const idBuffer = Buffer.alloc(8);
  // Convert number to buffer in a browser-compatible way
  const view = new DataView(idBuffer.buffer, idBuffer.byteOffset, idBuffer.byteLength);
  view.setBigUint64(0, BigInt(proposalId), true); // true for little-endian
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('proposal'), idBuffer],
    PROGRAM_ID
  );
}

export async function getVotePDA(
  proposalPubkey: PublicKey,
  voterPubkey: PublicKey
): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('vote'), proposalPubkey.toBuffer(), voterPubkey.toBuffer()],
    PROGRAM_ID
  );
}

// Create initialize instruction
export function createInitializeInstruction(
  daoStatePda: PublicKey,
  authority: PublicKey,
  daoName: string
): TransactionInstruction {
  const nameBuffer = Buffer.from(daoName, 'utf8');
  
  // Create proper Anchor string serialization (4-byte length prefix)
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(nameBuffer.length, 0);
  
  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.initialize,
    lengthBuffer,  // 4-byte length prefix for Anchor strings
    nameBuffer
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: daoStatePda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

// Create proposal instruction
export function createProposalInstruction(
  daoStatePda: PublicKey,
  proposalPda: PublicKey,
  creator: PublicKey,
  title: string,
  description: string,
  votingDuration: number  // Duration in seconds
): TransactionInstruction {
  const titleBuffer = Buffer.from(title);
  const descriptionBuffer = Buffer.from(description);
  
  const titleLengthBuffer = Buffer.alloc(4);
  titleLengthBuffer.writeUInt32LE(titleBuffer.length, 0);
  
  const descriptionLengthBuffer = Buffer.alloc(4);
  descriptionLengthBuffer.writeUInt32LE(descriptionBuffer.length, 0);
  
  const votingDurationBuffer = Buffer.alloc(8);
  const view = new DataView(votingDurationBuffer.buffer, votingDurationBuffer.byteOffset, votingDurationBuffer.byteLength);
  view.setBigInt64(0, BigInt(votingDuration), true); // true for little-endian
  
  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.createProposal,
    titleLengthBuffer,
    titleBuffer,
    descriptionLengthBuffer,
    descriptionBuffer,
    votingDurationBuffer  // Add voting duration to instruction data
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: daoStatePda, isSigner: false, isWritable: true },
      { pubkey: proposalPda, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

// Cast vote instruction
export function createCastVoteInstruction(
  proposalPda: PublicKey,
  votePda: PublicKey,
  voter: PublicKey,
  choice: 'yes' | 'no' | 'abstain'
): TransactionInstruction {
  const choiceValue = choice === 'yes' ? 0 : choice === 'no' ? 1 : 2;
  
  const data = Buffer.concat([
    INSTRUCTION_DISCRIMINATORS.castVote,
    Buffer.from([choiceValue])
  ]);

  return new TransactionInstruction({
    keys: [
      { pubkey: proposalPda, isSigner: false, isWritable: true },
      { pubkey: votePda, isSigner: false, isWritable: true },
      { pubkey: voter, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  });
}

// Finalize proposal instruction  
export function createFinalizeProposalInstruction(
  proposalPda: PublicKey,
  authority: PublicKey
): TransactionInstruction {
  return new TransactionInstruction({
    keys: [
      { pubkey: proposalPda, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data: INSTRUCTION_DISCRIMINATORS.finalizeProposal,
  });
}

// Helper to send and confirm transaction
export async function sendAndConfirmTransaction(
  connection: Connection,
  transaction: Transaction,
  wallet: Wallet
): Promise<string> {
  try {
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Use wallet.sendTransaction which handles signing and sending atomically
    const signature = await wallet.sendTransaction(transaction, connection, {
      preflightCommitment: 'confirmed',
      maxRetries: 3
    });
    
    console.log('Transaction sent:', signature);
    
    // Confirm the transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight
    }, 'confirmed');
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }
    
    console.log('Transaction confirmed:', signature);
    return signature;
  } catch (error: any) {
    console.error('Transaction error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Try to extract more details from the error
    if (error.error) {
      console.error('Inner error:', error.error);
    }
    
    // Check if this is an "already processed" error
    if (error.message?.includes('already been processed') || 
        error.message?.includes('AlreadyProcessed') ||
        error.message?.includes('This transaction has already been processed')) {
      console.log('Transaction was already processed (likely succeeded)');
      return 'already-processed';
    }
    
    // Check for specific program errors
    if (error.message?.includes('custom program error')) {
      console.error('Program error detected');
    }
    
    if (error.logs) {
      console.error('Transaction logs:', error.logs);
    }
    throw error;
  }
}

// Fetch DAO state
export async function fetchDaoState(connection: Connection): Promise<DaoStateAccount | null> {
  try {
    const [daoStatePda] = await getDaoStatePDA();
    const accountInfo = await connection.getAccountInfo(daoStatePda);
    
    if (!accountInfo) return null;

    // Parse the account data (skip discriminator)
    const data = accountInfo.data.slice(8);
    
    // Manual parsing since borsh is complex with PublicKeys
    let offset = 0;
    const authority = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const nameLength = data.readUInt32LE(offset);
    offset += 4;
    const daoName = data.slice(offset, offset + nameLength).toString('utf8');
    offset += nameLength;
    
    // Use DataView for browser-compatible 64-bit integer reading
    const view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const proposalCount = Number(view.getBigUint64(0, true)); // true for little-endian
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      authority,
      daoName,
      proposalCount,
      bump,
    };
  } catch (error) {
    console.error('Error fetching DAO state:', error);
    return null;
  }
}

// Fetch proposal
export async function fetchProposal(connection: Connection, proposalId: number): Promise<ProposalAccount | null> {
  try {
    const [proposalPda] = await getProposalPDA(proposalId);
    const accountInfo = await connection.getAccountInfo(proposalPda);
    
    if (!accountInfo) return null;

    // Parse the account data (skip discriminator)
    const data = accountInfo.data.slice(8);
    
    let offset = 0;
    // Use DataView for browser-compatible 64-bit integer reading
    let view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const id = Number(view.getBigUint64(0, true));
    offset += 8;
    
    const creator = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    const titleLength = data.readUInt32LE(offset);
    offset += 4;
    const title = data.slice(offset, offset + titleLength).toString('utf8');
    offset += titleLength;
    
    const descriptionLength = data.readUInt32LE(offset);
    offset += 4;
    const description = data.slice(offset, offset + descriptionLength).toString('utf8');
    offset += descriptionLength;
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const yesVotes = Number(view.getBigUint64(0, true));
    offset += 8;
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const noVotes = Number(view.getBigUint64(0, true));
    offset += 8;
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const abstainVotes = Number(view.getBigUint64(0, true));
    offset += 8;
    
    const statusByte = data.readUInt8(offset);
    offset += 1;
    const status = statusByte === 0 ? 'active' : 'finalized';
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const createdAt = Number(view.getBigUint64(0, true));
    offset += 8;
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const expiresAt = Number(view.getBigUint64(0, true));
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      id,
      creator,
      title,
      description,
      yesVotes,
      noVotes,
      abstainVotes,
      status,
      createdAt,
      expiresAt,
      bump,
    };
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

// Fetch all proposals
export async function fetchAllProposals(connection: Connection): Promise<ProposalAccount[]> {
  try {
    const daoState = await fetchDaoState(connection);
    if (!daoState) return [];

    const proposals: ProposalAccount[] = [];
    for (let i = 0; i < daoState.proposalCount; i++) {
      const proposal = await fetchProposal(connection, i);
      if (proposal) {
        proposals.push(proposal);
      }
    }

    return proposals;
  } catch (error) {
    console.error('Error fetching all proposals:', error);
    return [];
  }
}

// Fetch vote record
export async function fetchVoteRecord(
  connection: Connection,
  proposalId: number,
  voterPubkey: PublicKey
): Promise<VoteRecord | null> {
  try {
    const [proposalPda] = await getProposalPDA(proposalId);
    const [votePda] = await getVotePDA(proposalPda, voterPubkey);
    const accountInfo = await connection.getAccountInfo(votePda);
    
    if (!accountInfo) return null;

    // Parse the account data (skip discriminator)
    const data = accountInfo.data.slice(8);
    
    let offset = 0;
    const voter = new PublicKey(data.slice(offset, offset + 32));
    offset += 32;
    
    // Use DataView for browser-compatible 64-bit integer reading
    let view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const proposalIdFromAccount = Number(view.getBigUint64(0, true));
    offset += 8;
    
    const choiceByte = data.readUInt8(offset);
    offset += 1;
    const choice = choiceByte === 0 ? 'yes' : choiceByte === 1 ? 'no' : 'abstain';
    
    view = new DataView(data.buffer, data.byteOffset + offset, 8);
    const timestamp = Number(view.getBigUint64(0, true));
    offset += 8;
    
    const bump = data.readUInt8(offset);

    return {
      voter,
      proposalId: proposalIdFromAccount,
      choice,
      timestamp,
      bump,
    };
  } catch (error) {
    console.error('Error fetching vote record:', error);
    return null;
  }
}
