import { fetchAllProposals } from '@/lib/anchor-client';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export function useProposals() {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['proposals'],
    queryFn: () => fetchAllProposals(connection),
    enabled: !!connection,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
