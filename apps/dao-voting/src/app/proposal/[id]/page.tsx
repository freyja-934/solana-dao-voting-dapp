'use client';

import { ProposalResults } from '@/components/proposal/ProposalResults';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VoteButton } from '@/components/vote/VoteButton';
import { fetchProposal, getConnection } from '@/lib/anchor-client';
import { formatDateTime, formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock } from 'lucide-react';
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
  const expired = isActive && isProposalExpired(proposal.expiresAt);
  const canVote = isActive && !expired;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{proposal.title}</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Proposal #{proposal.id} • Created by {proposal.creator.toBase58().slice(0, 8)}...
                </p>
              </div>
              <Badge
                variant={
                  !isActive ? 'secondary' : 
                  expired ? 'destructive' : 
                  'default'
                }
                className="text-sm"
              >
                {!isActive ? 'Finalized' : expired ? 'Expired' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg leading-relaxed">{proposal.description}</p>
            <Separator className="my-6" />
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Created: {formatDateTime(proposal.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {canVote ? (
                  <span className="text-primary font-medium">
                    {formatTimeRemaining(proposal.expiresAt)}
                  </span>
                ) : (
                  <span>Ended: {formatDateTime(proposal.expiresAt)}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <ProposalResults proposal={proposal} />

        {/* Voting Actions */}
        {wallet.publicKey && canVote && (
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

        {!wallet.publicKey && canVote && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Connect your wallet to vote on this proposal
              </p>
            </CardContent>
          </Card>
        )}

        {expired && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Voting has ended for this proposal
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
