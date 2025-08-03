import { fetchVoteRecord, getProposalPDA } from '@/lib/anchor-client';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export interface VotingActivity {
  userWallet: string;
  choice: 'yes' | 'no' | 'abstain';
  timestamp: number;
  user?: {
    username: string;
    avatar_url: string;
    avatar_type: 'discord' | 'nft' | 'default';
  };
}

export function useProposalVotingActivity(proposalId: number) {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['proposal-voting-activity', proposalId],
    queryFn: async (): Promise<VotingActivity[]> => {
      // First, get all vote activities from Supabase
      const { data: activities, error } = await supabase
        .from('proposal_activities')
        .select(`
          *,
          user:users!proposal_activities_user_wallet_fkey(
            username,
            avatar_url,
            avatar_type
          )
        `)
        .eq('proposal_id', proposalId)
        .eq('activity_type', 'vote')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching voting activities:', error);
      }

      const votingActivities: VotingActivity[] = [];

      // If we have activities from Supabase, use them
      if (activities && activities.length > 0) {
        for (const activity of activities) {
          votingActivities.push({
            userWallet: activity.user_wallet,
            choice: activity.metadata?.choice || 'abstain',
            timestamp: new Date(activity.created_at).getTime() / 1000,
            user: activity.user,
          });
        }
      }

      // Also check on-chain for any votes not in Supabase
      // This is a fallback for votes made before activity tracking was added
      try {
        const [proposalPda] = await getProposalPDA(proposalId);
        
        // Get recent transaction signatures for the proposal account
        const signatures = await connection.getSignaturesForAddress(proposalPda, { limit: 100 });
        
        // For each signature, check if it's a vote transaction
        for (const sig of signatures) {
          const tx = await connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (tx && tx.meta && !tx.meta.err) {
            // Check if this is a vote transaction by looking at the logs
            const logs = tx.meta.logMessages || [];
            const isVote = logs.some(log => log.includes('Instruction: CastVote'));
            
            if (isVote && tx.transaction.message.staticAccountKeys) {
              // Get the voter's public key (usually the fee payer)
              const voter = tx.transaction.message.staticAccountKeys[0];
              const voterStr = voter.toBase58();
              
              // Check if we already have this vote
              const alreadyExists = votingActivities.some(v => v.userWallet === voterStr);
              
              if (!alreadyExists) {
                // Try to get the vote record to determine the choice
                try {
                  const voteRecord = await fetchVoteRecord(connection, proposalId, voter);
                  
                  if (voteRecord) {
                    // Get user info from Supabase
                    const { data: userData } = await supabase
                      .from('users')
                      .select('username, avatar_url, avatar_type')
                      .eq('wallet_address', voterStr)
                      .single();

                    votingActivities.push({
                      userWallet: voterStr,
                      choice: voteRecord.choice,
                      timestamp: voteRecord.timestamp,
                      user: userData || undefined,
                    });
                  }
                } catch (e) {
                  // Vote record not found, skip
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching on-chain votes:', error);
      }

      // Sort by timestamp descending
      return votingActivities.sort((a, b) => b.timestamp - a.timestamp);
    },
    enabled: !!proposalId && !!connection,
    staleTime: 30000, // Cache for 30 seconds
  });
} 