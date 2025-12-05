import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { useAnchorProvider } from './useAnchorProvider';
import { useDAORequirements } from './useDAORequirements';

export interface EligibilityCheck {
  eligible: boolean;
  hasRequiredNFT: boolean;
  hasRequiredTokens: boolean;
  nftOwned: boolean;
  tokenBalance: number;
  missingRequirements: string[];
}

export function useVotingEligibility(walletAddress: string | null) {
  const { connection } = useAnchorProvider();
  const { data: requirements } = useDAORequirements();

  return useQuery({
    queryKey: ['voting-eligibility', walletAddress, requirements],
    queryFn: async (): Promise<EligibilityCheck> => {
      if (!walletAddress || !requirements) {
        return {
          eligible: false,
          hasRequiredNFT: true,
          hasRequiredTokens: true,
          nftOwned: false,
          tokenBalance: 0,
          missingRequirements: ['Wallet not connected'],
        };
      }

      const missingRequirements: string[] = [];
      let hasRequiredNFT = true;
      let hasRequiredTokens = true;
      let nftOwned = false;
      let tokenBalance = 0;

      // Check NFT requirement
      if (requirements.nftRequired && requirements.nftCollection) {
        try {
          const walletPubkey = new PublicKey(walletAddress);
          const collectionPubkey = new PublicKey(requirements.nftCollection);
          
          // Check if user owns NFT from collection
          nftOwned = await checkNFTOwnership(
            connection,
            walletPubkey,
            collectionPubkey,
            requirements.nftVerifiedCollection
          );
          
          hasRequiredNFT = nftOwned;
          if (!nftOwned) {
            missingRequirements.push('Must own NFT from required collection');
          }
        } catch (error) {
          console.error('Error checking NFT ownership:', error);
          hasRequiredNFT = false;
          missingRequirements.push('Error checking NFT ownership');
        }
      }

      // Check token requirement
      if (requirements.tokenRequired && requirements.tokenMint) {
        try {
          const walletPubkey = new PublicKey(walletAddress);
          const mintPubkey = new PublicKey(requirements.tokenMint);
          
          const tokenAccount = await getAssociatedTokenAddress(
            mintPubkey,
            walletPubkey
          );
          
          try {
            const accountInfo = await connection.getTokenAccountBalance(tokenAccount);
            tokenBalance = accountInfo.value.uiAmount || 0;
          } catch (error) {
            // Token account doesn't exist, balance is 0
            tokenBalance = 0;
          }
          
          hasRequiredTokens = tokenBalance >= requirements.minTokenAmount;
          if (!hasRequiredTokens) {
            missingRequirements.push(
              `Must hold at least ${requirements.minTokenAmount} tokens (you have ${tokenBalance})`
            );
          }
        } catch (error) {
          console.error('Error checking token balance:', error);
          hasRequiredTokens = false;
          tokenBalance = 0;
          missingRequirements.push('Error checking token balance');
        }
      }

      // Determine overall eligibility based on requireBoth flag
      let eligible = true;
      if (requirements.requireBoth) {
        // Need both NFT and tokens
        eligible = (!requirements.nftRequired || hasRequiredNFT) && 
                  (!requirements.tokenRequired || hasRequiredTokens);
      } else {
        // Need at least one (or none if neither is required)
        if (requirements.nftRequired && requirements.tokenRequired) {
          eligible = hasRequiredNFT || hasRequiredTokens;
        } else if (requirements.nftRequired) {
          eligible = hasRequiredNFT;
        } else if (requirements.tokenRequired) {
          eligible = hasRequiredTokens;
        }
      }

      return {
        eligible,
        hasRequiredNFT,
        hasRequiredTokens,
        nftOwned,
        tokenBalance,
        missingRequirements: eligible ? [] : missingRequirements,
      };
    },
    enabled: !!walletAddress && !!requirements,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Helper function to check NFT ownership
async function checkNFTOwnership(
  connection: Connection,
  wallet: PublicKey,
  collection: PublicKey,
  requireVerified: boolean
): Promise<boolean> {
  try {
    // Fetch all token accounts for wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      wallet,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    // Filter for NFTs (amount = 1, decimals = 0)
    const nftAccounts = tokenAccounts.value.filter(account => {
      const data = account.account.data.parsed.info;
      return data.tokenAmount.amount === '1' && data.tokenAmount.decimals === 0;
    });
    
    // For now, we'll implement a simplified check
    // In a full implementation, you would:
    // 1. Fetch metadata for each NFT
    // 2. Check if the collection field matches the required collection
    // 3. If requireVerified is true, ensure the collection is verified
    
    // For demonstration, we'll just check if they have any NFTs
    // You would need to integrate with Metaplex or another NFT standard
    // to properly verify collection membership
    
    return nftAccounts.length > 0;
  } catch (error) {
    console.error('Error checking NFT ownership:', error);
    return false;
  }
}