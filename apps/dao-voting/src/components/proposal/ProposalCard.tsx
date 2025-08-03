'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import { formatDate, formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
import { Clock } from 'lucide-react';
import Link from 'next/link';

interface ProposalCardProps {
  proposal: ProposalAccount;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const { yesVotes, noVotes, abstainVotes, title, description } = proposal;
  const totalVotes = yesVotes + noVotes + abstainVotes;
  const isActive = proposal.status === 'active';
  const expired = proposal.status === 'expired' || (isActive && isProposalExpired(proposal.expiresAt));
  const creatorAddress = proposal.creator.toBase58();
  
  // Check if expiring soon (within 24 hours)
  const now = Math.floor(Date.now() / 1000);
  const hoursUntilExpiry = (proposal.expiresAt - now) / 3600;
  const expiringSoon = isActive && !expired && hoursUntilExpiry <= 24 && hoursUntilExpiry > 0;

  const getBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    if (expired || proposal.status === 'expired') return "secondary";
    if (proposal.status === 'passed') return "default";
    if (proposal.status === 'rejected') return "destructive";
    return "outline";
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
    <Link href={`/proposal/${proposal.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xl font-semibold line-clamp-1">{title}</h3>
            <div className="flex flex-col gap-1 items-end">
              <Badge variant={getBadgeVariant()}>
                {getStatusLabel()}
              </Badge>
              {expiringSoon && (
                <Badge variant="destructive" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground line-clamp-2">{description}</p>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <UserAvatar address={creatorAddress} size="xs" />
              <span className="text-sm text-muted-foreground">
                {creatorAddress.slice(0, 4)}...{creatorAddress.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {expired ? (
                <span>Ended {formatDate(proposal.expiresAt)}</span>
              ) : (
                <span className={expiringSoon ? "text-destructive font-medium" : ""}>
                  {formatTimeRemaining(proposal.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex items-center gap-4 w-full text-sm">
            <div className="flex items-center gap-1">
              <span className="font-medium text-green-600">{yesVotes}</span>
              <span className="text-muted-foreground">Yes</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-red-600">{noVotes}</span>
              <span className="text-muted-foreground">No</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-600">{abstainVotes}</span>
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
