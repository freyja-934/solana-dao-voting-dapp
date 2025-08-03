import { Database, supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

type UserReputation = Database['public']['Tables']['user_reputation']['Row'];

export interface VotingPowerBreakdown {
  base: number;
  fromUpvotes: number;
  fromProposals: number;
  fromVotes: number;
  fromComments: number;
  total: number;
}

export function useVotingPower(walletAddress: string | null) {
  return useQuery({
    queryKey: ['voting-power', walletAddress],
    queryFn: async (): Promise<VotingPowerBreakdown> => {
      if (!walletAddress) {
        return {
          base: 1,
          fromUpvotes: 0,
          fromProposals: 0,
          fromVotes: 0,
          fromComments: 0,
          total: 1,
        };
      }

      const { data: reputation } = await supabase
        .from('user_reputation')
        .select('*')
        .eq('wallet_address', walletAddress)
        .single();

      if (!reputation) {
        return {
          base: 1,
          fromUpvotes: 0,
          fromProposals: 0,
          fromVotes: 0,
          fromComments: 0,
          total: 1,
        };
      }

      const base = 1;
      const fromUpvotes = Math.min(Math.floor(reputation.comment_upvotes_received / 10), 10);
      const fromProposals = Math.min(reputation.proposals_created * 2, 10);
      const fromVotes = Math.min(Math.floor(reputation.votes_cast / 5), 5);
      const fromComments = Math.min(Math.floor(reputation.comments_made / 10), 5);
      
      const total = base + fromUpvotes + fromProposals + fromVotes + fromComments;

      return {
        base,
        fromUpvotes,
        fromProposals,
        fromVotes,
        fromComments,
        total,
      };
    },
    enabled: !!walletAddress,
    staleTime: 1000 * 60,
  });
}

export function useTopVoters(limit: number = 10) {
  return useQuery({
    queryKey: ['top-voters', limit],
    queryFn: async (): Promise<UserReputation[]> => {
      const { data, error } = await supabase
        .from('user_reputation')
        .select('*')
        .order('voting_power', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching top voters:', error);
        return [];
      }

      return data || [];
    },
  });
} 