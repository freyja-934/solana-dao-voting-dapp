'use client';

import {
    createInitializeInstruction,
    getDaoStatePDA,
    sendAndConfirmTransaction
} from '@/lib/anchor-client';
import { Transaction } from '@solana/web3.js';
import { useMutation } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export function useInitializeDao() {
  const { connection, wallet } = useAnchorProvider();

  return useMutation({
    mutationFn: async (daoName: string) => {
      if (!wallet.publicKey || !wallet.sendTransaction) throw new Error('Wallet not connected');

      const [daoStatePda] = await getDaoStatePDA();
      
      const initializeIx = createInitializeInstruction(
        daoStatePda,
        wallet.publicKey,
        daoName
      );

      const transaction = new Transaction().add(initializeIx);
      
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        wallet as any
      );

      return signature;
    },
  });
} 