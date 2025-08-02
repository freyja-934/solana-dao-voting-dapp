import {
    createProposalInstruction,
    fetchDaoState,
    getDaoStatePDA,
    getProposalPDA,
    sendAndConfirmTransaction
} from '@/lib/anchor-client';
import { Transaction } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

interface CreateProposalParams {
  title: string;
  description: string;
  votingDuration: number; // Duration in seconds
}

export function useCreateProposal() {
  const { connection, wallet } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateProposalParams) => {
      if (!wallet.publicKey || !wallet.sendTransaction) throw new Error('Wallet not connected');

      console.log('Creating proposal with params:', params);

      // Get current DAO state to determine next proposal ID
      const daoState = await fetchDaoState(connection);
      if (!daoState) throw new Error('DAO not initialized');

      console.log('Current DAO state:', {
        daoName: daoState.daoName,
        proposalCount: daoState.proposalCount,
        authority: daoState.authority.toBase58()
      });

      const [daoStatePda] = await getDaoStatePDA();
      const [proposalPda, proposalBump] = await getProposalPDA(daoState.proposalCount);
      
      console.log('PDAs:', {
        daoStatePda: daoStatePda.toBase58(),
        proposalPda: proposalPda.toBase58(),
        proposalId: daoState.proposalCount,
        proposalBump
      });

      const instruction = createProposalInstruction(
        daoStatePda,
        proposalPda,
        wallet.publicKey,
        params.title,
        params.description,
        params.votingDuration
      );

      console.log('Creating transaction with instruction');
      const transaction = new Transaction().add(instruction);
      
      try {
        const signature = await sendAndConfirmTransaction(connection, transaction, wallet as any);
        console.log('Transaction result:', signature);
        
        // Handle special case where transaction was already processed
        if (signature === 'already-processed') {
          console.log('Transaction was already processed, refreshing data...');
          // Immediately invalidate queries to show the new proposal
          await queryClient.invalidateQueries({ queryKey: ['proposals'] });
          await queryClient.invalidateQueries({ queryKey: ['dao-state'] });
          return 'Transaction succeeded (already processed)';
        }
        
        // Wait a moment for the chain to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return signature;
      } catch (error: any) {
        console.error('Transaction failed:', error);
        if (error.logs) {
          console.error('Program logs:', error.logs);
        }
        
        // Additional check for already processed errors that might slip through
        if (error.message?.includes('already been processed') || 
            error.message?.includes('AlreadyProcessed') ||
            error.message?.includes('This transaction has already been processed')) {
          // Invalidate queries to refresh the UI
          await queryClient.invalidateQueries({ queryKey: ['proposals'] });
          await queryClient.invalidateQueries({ queryKey: ['dao-state'] });
          // Return a success-like response
          return 'Transaction succeeded (already processed)';
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['dao-state'] });
    },
  });
}
