import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || '5RzYB945gtiaM3k2WjiuhptSNQ8M3VmXQbBmJsSTCwC5'
);

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';
export const COMMITMENT = process.env.NEXT_PUBLIC_COMMITMENT || 'confirmed';

export const DAO_NAME = 'Solana DAO';

export const PROPOSAL_SEEDS = {
  DAO_STATE: 'dao-state',
  PROPOSAL: 'proposal',
  VOTE: 'vote',
};

export const VOTE_OPTIONS = {
  YES: 'Yes',
  NO: 'No',
  ABSTAIN: 'Abstain',
} as const;

export const PROPOSAL_STATUS = {
  ACTIVE: 'Active',
  FINALIZED: 'Finalized',
} as const;
