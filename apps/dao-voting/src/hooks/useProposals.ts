import { fetchAllProposals } from '@/lib/anchor-client';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export function useProposals() {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const proposals = await fetchAllProposals(connection);
      
      // Get current timestamp
      const now = Math.floor(Date.now() / 1000);
      
      // Sort proposals:
      // 1. Active proposals (not expired) first
      // 2. Within active proposals, sort by expiration time (soonest first)
      // 3. Expired proposals at the end, sorted by most recent expiration
      return proposals.sort((a, b) => {
        const aActive = a.status === 'active' && a.expiresAt > now;
        const bActive = b.status === 'active' && b.expiresAt > now;
        
        // If one is active and the other isn't, active comes first
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        
        // If both are active, sort by expiration time (soonest first)
        if (aActive && bActive) {
          return a.expiresAt - b.expiresAt;
        }
        
        // If both are expired/finalized, sort by expiration time (most recent first)
        return b.expiresAt - a.expiresAt;
      });
    },
    enabled: !!connection,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}
