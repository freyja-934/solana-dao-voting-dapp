import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';
import { COMMITMENT, PROGRAM_ID, RPC_URL } from './constants';

// Polyfill for window.BN if needed
declare global {
  interface Window {
    BN?: typeof BN;
  }
}

// Ensure BN is available globally for Anchor
if (typeof window !== 'undefined' && !window.BN) {
  window.BN = BN;
}

// We'll load the IDL differently to avoid issues
let DaoIDL: any = null;

// Load IDL on client side only
if (typeof window !== 'undefined') {
  try {
    DaoIDL = require('./idl/dao_program.json');
  } catch (e) {
    console.error('Failed to load IDL:', e);
  }
}

// Type the IDL
type DaoIDL = typeof DaoIDL;

export type DaoProgram = {
  version: string;
  name: string;
  instructions: any[];
  accounts: any[];
  types: any[];
  events: any[];
  errors: any[];
};

export interface ProposalAccount {
  id: BN;
  creator: PublicKey;
  title: string;
  description: string;
  yesVotes: BN;
  noVotes: BN;
  abstainVotes: BN;
  status: { active: {} } | { finalized: {} };
  createdAt: BN;
  bump: number;
}

export interface DaoStateAccount {
  authority: PublicKey;
  daoName: string;
  proposalCount: BN;
  bump: number;
}

export interface VoteRecord {
  voter: PublicKey;
  proposalId: BN;
  choice: { yes: {} } | { no: {} } | { abstain: {} };
  timestamp: BN;
  bump: number;
}

export function getProvider(
  wallet: AnchorWallet | undefined,
  commitment: Commitment = COMMITMENT as Commitment
): AnchorProvider | null {
  if (!wallet) return null;
  
  const connection = new Connection(RPC_URL, commitment);
  const provider = new AnchorProvider(connection, wallet, {
    commitment,
    preflightCommitment: commitment,
  });
  
  return provider;
}

// Cache the program instance
let programInstance: Program<any> | null = null;

export function getProgram(provider: AnchorProvider): Program<any> {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    throw new Error('Program can only be initialized on the client side');
  }

  // Check if IDL is loaded
  if (!DaoIDL) {
    throw new Error('IDL not loaded. Please ensure the IDL file exists.');
  }

  try {
    // Return cached instance if available and provider is the same
    if (programInstance && programInstance.provider === provider) {
      return programInstance;
    }
    
    // Log for debugging
    console.log('Creating program with:', {
      hasIDL: !!DaoIDL,
      idlVersion: DaoIDL?.version,
      programId: PROGRAM_ID.toBase58(),
      hasProvider: !!provider
    });
    
    // Create new program instance
    // Pass the IDL directly without type assertion first
    const idl = { ...DaoIDL };
    
    // Ensure the IDL has the required structure
    if (!idl.version || !idl.name || !idl.instructions) {
      throw new Error('Invalid IDL structure');
    }
    
    // Create the program
    programInstance = new (Program as any)(
      idl,
      PROGRAM_ID,
      provider
    );
    
    console.log('Program created successfully');
    return programInstance;
  } catch (error) {
    console.error('Error creating program:', error);
    console.error('IDL structure:', {
      version: DaoIDL?.version,
      name: DaoIDL?.name,
      hasInstructions: !!DaoIDL?.instructions,
      instructionCount: DaoIDL?.instructions?.length
    });
    throw error;
  }
}

export async function getDaoStatePDA(): Promise<[PublicKey, number]> {
  return await PublicKey.findProgramAddressSync(
    [Buffer.from('dao-state')],
    PROGRAM_ID
  );
}

export async function getProposalPDA(proposalId: number): Promise<[PublicKey, number]> {
  const idBuffer = Buffer.from(new Uint8Array(new BN(proposalId).toArrayLike(Buffer, 'le', 8)));
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
