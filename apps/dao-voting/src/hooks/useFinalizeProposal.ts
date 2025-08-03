import {
    finalizeProposalInstruction,
    getDaoStatePDA,
    getProposalPDA,
    sendAndConfirmTransaction,
    Wallet
} from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

interface FinalizeProposalParams {
  proposalId: number;
}

export function useFinalizeProposal() {
  const wallet = useWallet() as Wallet;
  const { connection } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: FinalizeProposalParams) => {
      if (!wallet.publicKey || !wallet.sendTransaction || !connection) {
        throw new Error('Wallet not connected');
      }

      const [daoStatePda] = await getDaoStatePDA();
      const [proposalPda] = await getProposalPDA(params.proposalId);

      const instruction = finalizeProposalInstruction(
        daoStatePda,
        proposalPda,
        wallet.publicKey
      );

      const transaction = new Transaction().add(instruction);
      
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        wallet
      );

      if (signature === 'already-processed') {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return signature;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['proposals'] });
      await queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] });
      await queryClient.invalidateQueries({ queryKey: ['proposal-stats'] });
    },
    onError: (error) => {
      console.error('Failed to finalize proposal:', error);
    },
  });
} 