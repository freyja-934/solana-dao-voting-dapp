import { Metaplex } from '@metaplex-foundation/js';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';

export interface NFTMetadata {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  description?: string;
}

export function useUserNFTs(userPublicKey: PublicKey | null) {
  const { connection } = useAnchorProvider();

  return useQuery({
    queryKey: ['user-nfts', userPublicKey?.toBase58()],
    queryFn: async (): Promise<NFTMetadata[]> => {
      if (!connection || !userPublicKey) {
        return [];
      }

      try {
        const metaplex = Metaplex.make(connection);
        
        const nfts = await metaplex
          .nfts()
          .findAllByOwner({ owner: userPublicKey });

        const nftMetadata: NFTMetadata[] = [];

        for (const nft of nfts.slice(0, 20)) {
          try {
            if (nft.uri) {
              const response = await fetch(nft.uri);
              const json = await response.json();
              
              if (json.image) {
                nftMetadata.push({
                  mint: nft.address.toBase58(),
                  name: nft.name || json.name || 'Unknown NFT',
                  symbol: nft.symbol || json.symbol || '',
                  image: json.image,
                  description: json.description,
                });
              }
            }
          } catch (error) {
            console.error('Error loading NFT metadata:', error);
          }
        }

        return nftMetadata;
      } catch (error) {
        console.error('Error fetching user NFTs:', error);
        return [];
      }
    },
    enabled: !!connection && !!userPublicKey,
    staleTime: 1000 * 60 * 5,
  });
} 