import { getDaoStatePDA, getProposalPDA } from '@/lib/anchor-client';
import { proposalQueries } from '@/queries/proposalQueries';
import { SystemProgram } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

interface CreateProposalArgs {
  title: string;
  description: string;
}

export function useCreateProposal() {
  const { program, wallet } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description }: CreateProposalArgs) => {
      if (!program || !wallet) throw new Error('Program or wallet not available');

      const [daoStatePda] = await getDaoStatePDA();
      const daoState = await program.account.daoState.fetch(daoStatePda) as any;
      const proposalId = daoState.proposalCount.toNumber();
      
      const [proposalPda] = await getProposalPDA(proposalId);

      const tx = await program.methods
        .createProposal(title, description)
        .accounts({
          daoState: daoStatePda,
          proposal: proposalPda,
          creator: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      return { tx, proposalId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalQueries.lists() });
    },
  });
}
