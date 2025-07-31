import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || 'HPH6itf3pTzFGReDBju8XhvQ8kgN1Wtpmd4oqXgaXKqp'
);

// Using Helius devnet RPC for better reliability
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://devnet.helius-rpc.com/?api-key=0991e593-a2d1-4db3-8685-e00494fb96cd';
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
