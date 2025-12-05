import { fetchDaoState } from '@/lib/anchor-client';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export interface VotingRequirements {
  nftRequired: boolean;
  nftCollection: string | null;
  nftVerifiedCollection: boolean;
  tokenRequired: boolean;
  tokenMint: string | null;
  minTokenAmount: number;
  requireBoth: boolean;
}

export function useDAORequirements() {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['dao-requirements'],
    queryFn: async (): Promise<VotingRequirements> => {
      try {
        const daoState = await fetchDaoState(connection);
        
        if (!daoState) {
          throw new Error('DAO state not found');
        }
        
        return {
          nftRequired: daoState.votingConfig.nftRequired,
          nftCollection: daoState.votingConfig.nftCollection?.toBase58() || null,
          nftVerifiedCollection: daoState.votingConfig.nftVerifiedCollection,
          tokenRequired: daoState.votingConfig.tokenRequired,
          tokenMint: daoState.votingConfig.tokenMint?.toBase58() || null,
          minTokenAmount: daoState.votingConfig.minTokenAmount.toNumber(),
          requireBoth: daoState.votingConfig.requireBoth,
        };
      } catch (error) {
        console.error('Error fetching DAO requirements:', error);
        // Return default config if DAO doesn't have voting config yet
        return {
          nftRequired: false,
          nftCollection: null,
          nftVerifiedCollection: false,
          tokenRequired: false,
          tokenMint: null,
          minTokenAmount: 0,
          requireBoth: false,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 1,
  });
}