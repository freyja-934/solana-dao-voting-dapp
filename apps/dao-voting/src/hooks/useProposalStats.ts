import { fetchAllProposals } from '@/lib/anchor-client';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export interface ProposalStats {
  active: number;
  passed: number;
  rejected: number;
  expired: number;
  total: number;
}

export function useProposalStats() {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['proposal-stats'],
    queryFn: async (): Promise<ProposalStats> => {
      if (!connection) {
        return { active: 0, passed: 0, rejected: 0, expired: 0, total: 0 };
      }

      try {
        const proposals = await fetchAllProposals(connection);
        
        const stats = proposals.reduce((acc, proposal) => {
          acc.total++;
          switch (proposal.status) {
            case 'active':
              acc.active++;
              break;
            case 'passed':
              acc.passed++;
              break;
            case 'rejected':
              acc.rejected++;
              break;
            case 'expired':
              acc.expired++;
              break;
          }
          return acc;
        }, { active: 0, passed: 0, rejected: 0, expired: 0, total: 0 });

        return stats;
      } catch (error) {
        console.error('Error fetching proposal stats:', error);
        return { active: 0, passed: 0, rejected: 0, expired: 0, total: 0 };
      }
    },
    enabled: !!connection,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
} 