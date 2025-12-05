import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDAORequirements } from '@/hooks/useDAORequirements';
import { Coins, ExternalLink, Shield } from 'lucide-react';

export function VotingRequirements() {
  const { data: requirements, isLoading } = useDAORequirements();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!requirements || (!requirements.nftRequired && !requirements.tokenRequired)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Voting Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {requirements.nftRequired && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  NFT Required
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Must hold NFT from collection
                </span>
              </div>
              {requirements.nftCollection && (
                <a
                  href={`https://solscan.io/token/${requirements.nftCollection}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View Collection <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {requirements.nftVerifiedCollection && (
              <p className="text-xs text-muted-foreground mt-1">
                ✓ Verified collection required
              </p>
            )}
          </div>
        )}
        
        {requirements.tokenRequired && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Coins className="h-3 w-3 mr-1" />
                  Token Required
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Must hold at least {requirements.minTokenAmount.toLocaleString()} tokens
                </span>
              </div>
              {requirements.tokenMint && (
                <a
                  href={`https://solscan.io/token/${requirements.tokenMint}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  View Token <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
        
        {requirements.requireBoth && requirements.nftRequired && requirements.tokenRequired && (
          <div className="text-sm text-muted-foreground italic p-2 bg-yellow-50 rounded border border-yellow-200">
            ⚠️ Both NFT and token requirements must be met to vote
          </div>
        )}
      </CardContent>
    </Card>
  );
}