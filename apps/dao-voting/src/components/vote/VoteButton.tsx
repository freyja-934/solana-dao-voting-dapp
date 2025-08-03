'use client';

import { Button } from '@/components/ui/button';
import { SuccessDialog } from '@/components/ui/success-dialog';
import { useVote } from '@/hooks/useVote';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

interface VoteButtonProps {
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
  disabled?: boolean;
  className?: string;
}

export function VoteButton({ proposalId, choice, disabled, className }: VoteButtonProps) {
  const { mutate: vote, isPending, isError, error } = useVote();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVote = useCallback(() => {
    vote({ proposalId, choice }, {
      onSuccess: () => {
        setShowSuccess(true);
      },
      onError: (error) => {
        console.error('Vote error:', error);
        // The error will be displayed by the mutation state
      }
    });
  }, [vote, proposalId, choice]);

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

  const getVoteMessage = () => {
    switch (choice) {
      case 'yes':
        return 'You voted YES on this proposal.';
      case 'no':
        return 'You voted NO on this proposal.';
      case 'abstain':
        return 'You abstained from voting on this proposal.';
    }
  };

  return (
    <>
      <Button
        onClick={handleVote}
        disabled={disabled || isPending || (isError && error?.message?.includes('already voted'))}
        variant={getButtonVariant()}
        className={cn('min-w-[120px]', className)}
      >
        {getButtonText()}
      </Button>
      
      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Vote Recorded!"
        description={getVoteMessage() + " Your vote has been successfully recorded on the blockchain."}
        actionLabel="Done"
      />
    </>
  );
}
