import { fetchAllProposals, fetchVoteRecord, ProposalAccount, VoteRecord } from '@/lib/anchor-client';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export interface VoteHistoryItem {
  proposal: ProposalAccount;
  vote: VoteRecord;
}

export function useUserVotingHistory(userPublicKey: PublicKey | null) {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['voting-history', userPublicKey?.toBase58()],
    queryFn: async (): Promise<VoteHistoryItem[]> => {
      if (!connection || !userPublicKey) {
        return [];
      }

      try {
        const proposals = await fetchAllProposals(connection);
        const votingHistory: VoteHistoryItem[] = [];

        for (const proposal of proposals) {
          const voteRecord = await fetchVoteRecord(connection, proposal.id, userPublicKey);
          if (voteRecord) {
            votingHistory.push({ proposal, vote: voteRecord });
          }
        }

        votingHistory.sort((a, b) => b.vote.timestamp - a.vote.timestamp);
        
        return votingHistory;
      } catch (error) {
        console.error('Error fetching voting history:', error);
        return [];
      }
    },
    enabled: !!connection && !!userPublicKey,
    staleTime: 1000 * 60,
  });
} 