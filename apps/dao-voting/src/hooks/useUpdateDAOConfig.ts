import {
    createUpdateVotingConfigInstruction,
    getDaoStatePDA,
    sendAndConfirmTransaction,
    VotingConfig,
    Wallet,
} from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAnchorProvider } from './useAnchorProvider';

interface UpdateConfigParams {
  nftRequired: boolean;
  nftCollection: PublicKey | null;
  nftVerifiedCollection: boolean;
  tokenRequired: boolean;
  tokenMint: PublicKey | null;
  minTokenAmount: number;
  requireBoth: boolean;
}

export function useUpdateDAOConfig() {
  const wallet = useWallet() as Wallet;
  const { connection } = useAnchorProvider();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateConfigParams) => {
      if (!wallet.publicKey || !wallet.sendTransaction || !connection) {
        throw new Error('Wallet not connected');
      }

      const [daoStatePda] = await getDaoStatePDA();

      // Convert params to VotingConfig format
      const config: VotingConfig = {
        nftRequired: params.nftRequired,
        nftCollection: params.nftCollection,
        nftVerifiedCollection: params.nftVerifiedCollection,
        tokenRequired: params.tokenRequired,
        tokenMint: params.tokenMint,
        minTokenAmount: BigInt(params.minTokenAmount),
        requireBoth: params.requireBoth,
      };

      const instruction = createUpdateVotingConfigInstruction(
        daoStatePda,
        wallet.publicKey,
        config
      );

      const transaction = new Transaction().add(instruction);
      
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        wallet
      );

      return { signature, config: params };
    },
    onSuccess: async (data) => {
      console.log('DAO config updated:', data);
      
      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ['dao-requirements'] });
      await queryClient.invalidateQueries({ queryKey: ['dao-state'] });
      
      toast.success('DAO Configuration Updated', {
        description: 'Voting requirements have been successfully updated.',
      });
    },
    onError: (error) => {
      console.error('Failed to update DAO config:', error);
      toast.error('Failed to Update Configuration', {
        description: error instanceof Error ? error.message : 'Please try again later.',
      });
    },
  });
}