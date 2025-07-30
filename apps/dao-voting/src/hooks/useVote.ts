import { getProposalPDA, getVotePDA } from '@/lib/anchor-client';
import { proposalQueries } from '@/queries/proposalQueries';
import { SystemProgram } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export type VoteChoice = { yes: {} } | { no: {} } | { abstain: {} };

interface VoteArgs {
  proposalId: number;
  choice: VoteChoice;
}

export function useVote() {
  const { program, wallet } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ proposalId, choice }: VoteArgs) => {
      if (!program || !wallet) throw new Error('Program or wallet not available');

      const [proposalPda] = await getProposalPDA(proposalId);
      const [votePda] = await getVotePDA(proposalPda, wallet.publicKey);

      const tx = await program.methods
        .castVote(choice)
        .accounts({
          proposal: proposalPda,
          voteRecord: votePda,
          voter: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .rpc();

      return tx;
    },
    onSuccess: (_, { proposalId }) => {
      queryClient.invalidateQueries({ queryKey: proposalQueries.detail(proposalId, program) });
      queryClient.invalidateQueries({ queryKey: proposalQueries.lists() });
    },
  });
}
