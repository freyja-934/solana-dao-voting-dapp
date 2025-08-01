import {
    createCastVoteInstruction,
    fetchProposal,
    fetchVoteRecord,
    getProposalPDA,
    getVotePDA,
    sendAndConfirmTransaction
} from '@/lib/anchor-client';
import { Transaction } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

interface VoteParams {
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
}

export function useVote() {
  const { connection, wallet } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: VoteParams) => {
      if (!wallet.publicKey || !wallet.sendTransaction) throw new Error('Wallet not connected');

      console.log('Casting vote:', params);

      // Check if user has already voted
      const existingVote = await fetchVoteRecord(connection, params.proposalId, wallet.publicKey);
      if (existingVote) {
        console.log('User has already voted:', existingVote);
        throw new Error(`You have already voted "${existingVote.choice}" on this proposal`);
      }

      const [proposalPda] = await getProposalPDA(params.proposalId);
      const [votePda] = await getVotePDA(proposalPda, wallet.publicKey);

      console.log('Vote PDAs:', {
        proposalPda: proposalPda.toBase58(),
        votePda: votePda.toBase58()
      });

      const instruction = createCastVoteInstruction(
        proposalPda,
        votePda,
        wallet.publicKey,
        params.choice
      );

      const transaction = new Transaction().add(instruction);
      
      try {
        const signature = await sendAndConfirmTransaction(connection, transaction, wallet as any);
        console.log('Vote transaction result:', signature);
        
        // Handle special case where transaction was already processed
        if (signature === 'already-processed') {
          console.log('Vote transaction was already processed, refreshing data...');
          // Wait a moment for the chain to update
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Fetch the updated proposal data
          const updatedProposal = await fetchProposal(connection, params.proposalId);
          console.log('Updated proposal data:', updatedProposal);
          
          // Update the cache with the new data
          queryClient.setQueryData(['proposal', params.proposalId], updatedProposal);
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
          
          return 'Vote succeeded (already processed)';
        }
        
        // Wait a moment for the chain to update
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Fetch the updated proposal data after successful vote
        const updatedProposal = await fetchProposal(connection, params.proposalId);
        console.log('Updated proposal data after vote:', updatedProposal);
        
        // Update the cache with the new data
        queryClient.setQueryData(['proposal', params.proposalId], updatedProposal);
        
        return signature;
      } catch (error: any) {
        console.error('Vote transaction failed:', error);
        if (error.logs) {
          console.error('Program logs:', error.logs);
        }
        
        // Additional check for already processed errors
        if (error.message?.includes('already been processed') || 
            error.message?.includes('AlreadyProcessed') ||
            error.message?.includes('This transaction has already been processed')) {
          // Wait and fetch updated data
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const updatedProposal = await fetchProposal(connection, params.proposalId);
          console.log('Updated proposal data (from error handler):', updatedProposal);
          
          queryClient.setQueryData(['proposal', params.proposalId], updatedProposal);
          queryClient.invalidateQueries({ queryKey: ['proposals'] });
          
          return 'Vote succeeded (already processed)';
        }
        
        throw error;
      }
    },
    onSuccess: async (_, variables) => {
      console.log('Vote successful, invalidating queries...');
      
      // Invalidate and refetch all relevant queries
      await queryClient.invalidateQueries({ queryKey: ['proposals'] });
      await queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] });
      
      // Force refetch the specific proposal
      await queryClient.refetchQueries({ queryKey: ['proposal', variables.proposalId] });
    },
  });
}
