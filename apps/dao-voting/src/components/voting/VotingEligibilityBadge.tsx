'use client';

import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVotingEligibility } from '@/hooks/useVotingEligibility';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface VotingEligibilityBadgeProps {
  walletAddress: string | null;
  className?: string;
}

export function VotingEligibilityBadge({ walletAddress, className }: VotingEligibilityBadgeProps) {
  const { data: eligibility, isLoading } = useVotingEligibility(walletAddress);

  if (!walletAddress) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (!eligibility) {
    return null;
  }

  if (eligibility.eligible) {
    return (
      <Badge variant="default" className={`bg-green-600 hover:bg-green-700 ${className}`}>
        <CheckCircle className="h-3 w-3 mr-1" />
        Eligible to Vote
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="destructive" className={className}>
            <XCircle className="h-3 w-3 mr-1" />
            Not Eligible
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-4">
          <div className="space-y-2">
            <p className="font-semibold flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Missing Requirements:
            </p>
            <ul className="text-sm space-y-1 ml-5">
              {eligibility.missingRequirements.map((req, idx) => (
                <li key={idx} className="list-disc">
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}