'use client';

import { CommentSection } from '@/components/comments/CommentSection';
import { ProposalResults } from '@/components/proposal/ProposalResults';
import { VotingActivity } from '@/components/proposal/VotingActivity';
import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { VoteButton } from '@/components/vote/VoteButton';
import { fetchProposal, getConnection } from '@/lib/anchor-client';
import { formatDateTime, formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
import { useWallet } from '@solana/wallet-adapter-react';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calendar, Clock } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = parseInt(params.id as string);
  const wallet = useWallet();

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ['proposal', proposalId],
    queryFn: async () => {
      const connection = getConnection();
      return fetchProposal(connection, proposalId);
    },
    enabled: !isNaN(proposalId),
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !proposal) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Proposal Not Found</h1>
            <p className="text-muted-foreground">
              The proposal you're looking for doesn't exist or couldn't be loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const creatorAddress = proposal.creator.toBase58();
  const isActive = proposal.status === 'active';
  const expired = proposal.status === 'expired' || (isActive && isProposalExpired(proposal.expiresAt));
  const canVote = isActive && !expired;

  const getBadgeVariant = () => {
    if (expired || proposal.status === 'expired') return 'secondary';
    if (proposal.status === 'passed') return 'default';
    if (proposal.status === 'rejected') return 'destructive';
    return 'outline';
  };

  const getStatusLabel = () => {
    if (expired && proposal.status === 'active') return 'Expired';
    switch (proposal.status) {
      case 'active':
        return 'Active';
      case 'passed':
        return 'Passed';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      {/* Proposal Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
            {proposal.title}
          </h1>
          <Badge variant={getBadgeVariant()} className="self-start">
            {getStatusLabel()}
          </Badge>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <UserAvatar address={creatorAddress} size="sm" />
            <span>
              Proposal #{proposal.id} • Created by {creatorAddress.slice(0, 8)}...
            </span>
          </div>
          <Separator orientation="vertical" className="hidden sm:block h-4" />
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDateTime(proposal.createdAt)}</span>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed">{proposal.description}</p>
            </CardContent>
          </Card>

          {/* Voting Results */}
          <ProposalResults proposal={proposal} />

          {/* Comments Section - Full width on mobile */}
          <div className="lg:hidden">
            <CommentSection proposalId={proposal.id} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <aside className="space-y-6">
          {/* Voting Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Voting Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {expired ? (
                  <span className="text-muted-foreground">
                    Ended {formatDateTime(proposal.expiresAt)}
                  </span>
                ) : (
                  <span className="font-medium">
                    {formatTimeRemaining(proposal.expiresAt)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Voting Actions */}
          {wallet.publicKey && canVote && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cast Your Vote</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <VoteButton
                    proposalId={proposal.id}
                    choice="yes"
                    className="w-full"
                  />
                  <VoteButton
                    proposalId={proposal.id}
                    choice="no"
                    className="w-full"
                  />
                  <VoteButton
                    proposalId={proposal.id}
                    choice="abstain"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Voting Activity Widget */}
          <VotingActivity proposalId={proposal.id} />
        </aside>
      </div>

      {/* Comments Section - Desktop only */}
      <section className="hidden lg:block mt-8">
        <CommentSection proposalId={proposal.id} />
      </section>
    </div>
  );
}
