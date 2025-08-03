'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import { formatDate, formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface ProposalCardProps {
  proposal: ProposalAccount;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const isActive = proposal.status === 'active';
  const expired = proposal.status === 'expired' || (isActive && isProposalExpired(proposal.expiresAt));
  const creatorAddress = proposal.creator.toBase58();

  const getBadgeVariant = () => {
    switch (proposal.status) {
      case 'active':
        return expired ? 'destructive' : 'default';
      case 'passed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = () => {
    if (proposal.status === 'active' && expired) return 'Expired';
    return proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1);
  };

  return (
    <Link href={`/proposal/${proposal.id}`}>
      <Card className="transition-colors hover:bg-accent cursor-pointer">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{proposal.title}</CardTitle>
            <Badge variant={getBadgeVariant()}>
              {getStatusLabel()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2">{proposal.description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <UserAvatar address={creatorAddress} size="xs" />
              <span className="text-sm text-muted-foreground">
                {creatorAddress.slice(0, 4)}...{creatorAddress.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {isActive && !expired ? (
                <span className="text-primary">{formatTimeRemaining(proposal.expiresAt)}</span>
              ) : (
                <span>Ended {formatDate(proposal.expiresAt)}</span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-4 w-full text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">{proposal.yesVotes}</span>
              <span className="text-muted-foreground">Yes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-red-600">{proposal.noVotes}</span>
              <span className="text-muted-foreground">No</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-600">{proposal.abstainVotes}</span>
              <span className="text-muted-foreground">Abstain</span>
            </div>
            <div className="ml-auto text-muted-foreground">
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
