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
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <h3 className="text-lg sm:text-xl font-semibold line-clamp-2 flex-1">{title}</h3>
            <div className="flex flex-wrap gap-1 items-start">
              <Badge variant={getBadgeVariant()}>
                {getStatusLabel()}
              </Badge>
              {expiringSoon && (
                <Badge variant="destructive" className="animate-pulse">
                  <Clock className="h-3 w-3 mr-1" />
                  <span className="text-xs">Expiring Soon</span>
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base text-muted-foreground line-clamp-2 mb-4">{description}</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserAvatar address={creatorAddress} size="xs" />
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {creatorAddress.slice(0, 4)}...{creatorAddress.slice(-4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
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
          <div className="grid grid-cols-3 gap-2 w-full text-xs sm:text-sm">
            <div className="text-center">
              <span className="font-medium text-green-600 block">{yesVotes}</span>
              <span className="text-muted-foreground">Yes</span>
            </div>
            <div className="text-center">
              <span className="font-medium text-red-600 block">{noVotes}</span>
              <span className="text-muted-foreground">No</span>
            </div>
            <div className="text-center">
              <span className="font-medium text-gray-600 block">{abstainVotes}</span>
              <span className="text-muted-foreground">Abstain</span>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-muted-foreground text-center mt-2 pt-2 border-t w-full">
            {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
