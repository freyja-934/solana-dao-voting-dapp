import { fetchProposals, proposalQueries } from '@/queries/proposalQueries';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export function useProposals() {
  const { program } = useAnchorProvider();

  return useQuery({
    queryKey: proposalQueries.list(program),
    queryFn: () => {
      if (!program) throw new Error('Program not available');
      return fetchProposals(program);
    },
    enabled: !!program,
  });
}
