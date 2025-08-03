'use client';

import { Button } from '@/components/ui/button';
import { useVote } from '@/hooks/useVote';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface VoteButtonProps {
  proposalId: number;
  choice: 'yes' | 'no' | 'abstain';
  disabled?: boolean;
  className?: string;
}

export function VoteButton({ proposalId, choice, disabled, className }: VoteButtonProps) {
  const { mutate: vote, isPending, isError, error } = useVote();

  const handleVote = useCallback(() => {
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

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isPending || (isError && error?.message?.includes('already voted'))}
      variant={getButtonVariant()}
      className={cn('min-w-[120px]', className)}
      aria-label={`Vote ${choice} on proposal ${proposalId}`}
    >
      {getButtonText()}
    </Button>
  );
}
