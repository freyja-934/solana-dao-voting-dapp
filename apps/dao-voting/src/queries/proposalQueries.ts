import { ProposalAccount, getDaoStatePDA, getProposalPDA } from '@/lib/anchor-client';
import { Program } from '@coral-xyz/anchor';

export const proposalQueries = {
  all: (program: Program | null) => ['proposals', { program }],
  lists: () => [...proposalQueries.all(null), 'list'],
  list: (program: Program | null) => [...proposalQueries.lists(), { program }],
  details: () => [...proposalQueries.all(null), 'detail'],
  detail: (id: number, program: Program | null) => [...proposalQueries.details(), id, { program }],
};

export async function fetchProposals(program: Program): Promise<ProposalAccount[]> {
  const [daoStatePda] = await getDaoStatePDA();
  const daoState = await program.account.daoState.fetch(daoStatePda);
  
  const proposals: ProposalAccount[] = [];
  
  for (let i = 0; i < daoState.proposalCount.toNumber(); i++) {
    const [proposalPda] = await getProposalPDA(i);
    try {
      const proposal = await program.account.proposal.fetch(proposalPda);
      proposals.push(proposal as ProposalAccount);
    } catch (error) {
      console.error(`Failed to fetch proposal ${i}:`, error);
    }
  }
  
  return proposals.reverse();
}

export async function fetchProposal(
  program: Program,
  proposalId: number
): Promise<ProposalAccount | null> {
  const [proposalPda] = await getProposalPDA(proposalId);
  
  try {
    const proposal = await program.account.proposal.fetch(proposalPda);
    return proposal as ProposalAccount;
  } catch (error) {
    console.error(`Failed to fetch proposal ${proposalId}:`, error);
    return null;
  }
}
