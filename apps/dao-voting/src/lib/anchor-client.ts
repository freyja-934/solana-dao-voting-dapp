import { AnchorProvider, BN, Idl, Program } from '@coral-xyz/anchor';
import { AnchorWallet } from '@solana/wallet-adapter-react';
import { Commitment, Connection, PublicKey } from '@solana/web3.js';
import { COMMITMENT, PROGRAM_ID, RPC_URL } from './constants';

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
  return new AnchorProvider(connection, wallet, {
    commitment,
    preflightCommitment: commitment,
  });
}

export function getProgram(provider: AnchorProvider): Program {
  const IDL = require('./idl/dao_program.json');
  return new Program(IDL as Idl, PROGRAM_ID, provider);
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
