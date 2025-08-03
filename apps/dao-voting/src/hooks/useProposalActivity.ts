import { supabase } from '@/lib/supabase';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation } from '@tanstack/react-query';

type ActivityType = 'vote' | 'comment' | 'status_change';

interface RecordActivityParams {
  proposalId: number;
  activityType: ActivityType;
  metadata?: Record<string, any>;
}

export function useRecordActivity() {
  const { publicKey } = useWallet();

  return useMutation({
    mutationFn: async ({ proposalId, activityType, metadata = {} }: RecordActivityParams) => {
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      const { data, error } = await supabase
        .from('proposal_activities')
        .insert({
          proposal_id: proposalId,
          user_wallet: publicKey.toBase58(),
          activity_type: activityType,
          metadata,
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording activity:', error);
        throw error;
      }

      return data;
    },
  });
} 