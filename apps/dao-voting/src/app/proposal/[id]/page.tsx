'use client';

import { ProposalResults } from '@/components/proposal/ProposalResults';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VoteButton } from '@/components/vote/VoteButton';
import { fetchProposal, getConnection } from '@/lib/anchor-client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

export default function ProposalDetailPage() {
  const params = useParams();
  const wallet = useWallet();
  const connection = getConnection();
  const proposalId = parseInt(params.id as string);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: () => fetchProposal(connection, proposalId),
    enabled: !isNaN(proposalId),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or couldn't be loaded.</p>
        </div>
      </div>
    );
  }

  const isActive = proposal.status === 'active';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{proposal.title}</h1>
            <p className="text-muted-foreground mt-2">
              Created on {new Date(proposal.createdAt * 1000).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Finalized'}
          </Badge>
        </div>

        <Separator />

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {proposal.description}
            </p>
          </CardContent>
        </Card>

        {/* Voting Results */}
        <Card>
          <CardHeader>
            <CardTitle>Voting Results</CardTitle>
          </CardHeader>
          <CardContent>
            <ProposalResults
              yesVotes={proposal.yesVotes}
              noVotes={proposal.noVotes}
              abstainVotes={proposal.abstainVotes}
            />
          </CardContent>
        </Card>

        {/* Voting Actions */}
        {wallet.publicKey && isActive && (
          <Card>
            <CardHeader>
              <CardTitle>Cast Your Vote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <VoteButton
                  proposalId={proposal.id}
                  choice="yes"
                  className="flex-1"
                />
                <VoteButton
                  proposalId={proposal.id}
                  choice="no"
                  className="flex-1"
                />
                <VoteButton
                  proposalId={proposal.id}
                  choice="abstain"
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {!wallet.publicKey && isActive && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Connect your wallet to vote on this proposal
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
