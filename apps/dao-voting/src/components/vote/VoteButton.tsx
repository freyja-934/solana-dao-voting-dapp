'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useVote } from '@/hooks/useVote';
import { useVotingEligibility } from '@/hooks/useVotingEligibility';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface VoteButtonProps {
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
  disabled?: boolean;
  className?: string;
}

export function VoteButton({ proposalId, choice, disabled, className }: VoteButtonProps) {
  const { publicKey } = useWallet();
  const { mutate: vote, isPending, isError, error } = useVote();
  const { data: eligibility } = useVotingEligibility(publicKey?.toBase58() || null);
  const [showRequirementsDialog, setShowRequirementsDialog] = useState(false);

  const handleVote = useCallback(() => {
    if (!eligibility?.eligible) {
      setShowRequirementsDialog(true);
      return;
    }
    
    vote({ proposalId, choice }, {
      onSuccess: () => {
        const messages = {
          yes: 'You voted YES on this proposal.',
          no: 'You voted NO on this proposal.',
          abstain: 'You abstained from voting on this proposal.'
        };
        
        toast.success('Vote Recorded!', {
          description: messages[choice],
          duration: 5000,
        });
      },
      onError: (error) => {
        console.error('Vote error:', error);
        toast.error('Failed to vote', {
          description: error.message || 'Please try again later.',
        });
      }
    });
  }, [vote, proposalId, choice, eligibility]);

  const getButtonText = () => {
    if (isPending) return 'Voting...';
    
    if (isError && error?.message?.includes('already voted')) {
      return 'Already Voted';
    }
    
    switch (choice) {
      case 'yes':
        return 'Vote Yes';
      case 'no':
        return 'Vote No';
      case 'abstain':
        return 'Abstain';
    }
  };

  const getButtonVariant = () => {
    switch (choice) {
      case 'yes':
        return 'default';
      case 'no':
        return 'destructive';
      case 'abstain':
        return 'secondary';
    }
  };

  const isDisabled = disabled || isPending || !publicKey || 
    (isError && error?.message?.includes('already voted'));

  return (
    <>
      <Button
        onClick={handleVote}
        disabled={isDisabled}
        variant={getButtonVariant()}
        className={cn('min-w-[120px]', className)}
        aria-label={`Vote ${choice} on proposal ${proposalId}`}
      >
        {getButtonText()}
      </Button>

      <Dialog open={showRequirementsDialog} onOpenChange={setShowRequirementsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Voting Requirements Not Met
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-3">
            <p>You need to meet the following requirements to vote:</p>
            <ul className="space-y-2">
              {eligibility?.missingRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Please acquire the necessary NFTs or tokens to participate in voting.
            </p>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}
