'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ProposalAccount } from '@/lib/anchor-client';
import { formatTimeRemaining, isProposalExpired } from '@/utils/formatting';
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
    <Link href={`/proposal/${proposal.id}`} className="block">
      <Card className="h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-lg font-semibold line-clamp-2 flex-1">
                {title}
              </h3>
              <div className="flex flex-col gap-1 items-end">
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
          </div>
        </CardHeader>
        
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <UserAvatar address={creatorAddress} size="xs" />
              <span className="truncate max-w-[100px]">
                {creatorAddress.slice(0, 4)}...{creatorAddress.slice(-4)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {expired ? (
                <span>Ended</span>
              ) : (
                <span className={expiringSoon ? "text-destructive font-medium" : ""}>
                  {formatTimeRemaining(proposal.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 pb-4">
          <div className="w-full space-y-2">
            {/* Vote Counts */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-semibold text-green-600">{yesVotes}</p>
                <p className="text-xs text-muted-foreground">Yes</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-red-600">{noVotes}</p>
                <p className="text-xs text-muted-foreground">No</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-600">{abstainVotes}</p>
                <p className="text-xs text-muted-foreground">Abstain</p>
              </div>
            </div>
            
            {/* Total Votes */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {totalVotes} total {totalVotes === 1 ? 'vote' : 'votes'}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
