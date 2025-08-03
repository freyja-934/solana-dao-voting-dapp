import {
    createCastVoteInstruction,
    fetchVoteRecord,
    getProposalPDA,
    getVotePDA,
    sendAndConfirmTransaction,
    Wallet
} from '@/lib/anchor-client';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@solana/wallet-adapter-react';
import { Transaction } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';
import { useRecordActivity } from './useProposalActivity';

interface VoteParams {
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
}

export function useVote() {
  const wallet = useWallet() as Wallet;
  const { connection } = useAnchorProvider();
  const queryClient = useQueryClient();
  const { mutate: recordActivity } = useRecordActivity();

  return useMutation({
    mutationFn: async (params: VoteParams) => {
      console.log('Voting with params:', params);
      if (!wallet.publicKey || !wallet.sendTransaction || !connection) {
        throw new Error('Wallet not connected');
      }

      const existingVote = await fetchVoteRecord(connection, params.proposalId, wallet.publicKey);
      if (existingVote) {
        throw new Error('You have already voted on this proposal');
      }

      const [proposalPda] = await getProposalPDA(params.proposalId);
      const [voteRecordPda] = await getVotePDA(proposalPda, wallet.publicKey);

      console.log('PDAs:', {
        proposalPda: proposalPda.toBase58(),
        voteRecordPda: voteRecordPda.toBase58(),
        voter: wallet.publicKey.toBase58(),
      });

      const instruction = createCastVoteInstruction(
        proposalPda,
        voteRecordPda,
        wallet.publicKey,
        params.choice
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

      return { signature, choice: params.choice };
    },
    onSuccess: async (data, variables) => {
      console.log('Vote successful:', data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      await queryClient.invalidateQueries({ queryKey: ['proposals'] });
      await queryClient.refetchQueries({ queryKey: ['proposals'] });
      await queryClient.invalidateQueries({ queryKey: ['proposal', variables.proposalId] });
      await queryClient.refetchQueries({ queryKey: ['proposal', variables.proposalId] });

      try {
        recordActivity({
          proposalId: variables.proposalId,
          activityType: 'vote',
          metadata: { choice: variables.choice },
        });
        
        // Update user reputation
        const walletAddress = wallet.publicKey?.toBase58();
        if (walletAddress) {
          await supabase
            .from('user_reputation')
            .upsert({
              wallet_address: walletAddress,
              votes_cast: 1,
            }, {
              onConflict: 'wallet_address',
              count: 'exact',
            });
          
          await supabase.rpc('calculate_voting_power', { wallet: walletAddress });
        }
      } catch (error) {
        console.error('Failed to record activity:', error);
      }
    },
    onError: (error) => {
      console.error('Failed to vote:', error);
    },
  });
}
