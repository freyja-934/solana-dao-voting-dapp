'use client';

import { Button } from '@/components/ui/button';
import { useVote } from '@/hooks/useVote';
import { cn } from '@/lib/utils';
import { useCallback } from 'react';

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
        return 'outline';
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={disabled || isPending || (isError && error?.message?.includes('already voted'))}
      variant={getButtonVariant() as any}
      className={cn(className)}
      title={isError ? error?.message : undefined}
    >
      {getButtonText()}
    </Button>
  );
}
