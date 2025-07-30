'use client';

import { Button } from '@/components/ui/button';
import { useVote, VoteChoice } from '@/hooks/useVote';
import { useWallet } from '@solana/wallet-adapter-react';

interface VoteButtonProps {
  proposalId: number;
  choice: VoteChoice;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
}

export const VoteButton: React.FC<VoteButtonProps> = ({
  proposalId,
  choice,
  variant = 'default',
  disabled = false,
}) => {
  const { connected } = useWallet();
  const vote = useVote();

  const getLabel = () => {
    if ('yes' in choice) return 'Yes';
    if ('no' in choice) return 'No';
    return 'Abstain';
  };

  const getVariant = () => {
    if (variant) return variant;
    if ('yes' in choice) return 'default';
    if ('no' in choice) return 'destructive';
    return 'outline';
  };

  const handleVote = async () => {
    try {
      await vote.mutateAsync({ proposalId, choice });
    } catch (error) {
      console.error('Failed to cast vote:', error);
    }
  };

  return (
    <Button
      onClick={handleVote}
      disabled={!connected || vote.isPending || disabled}
      variant={getVariant()}
    >
      {vote.isPending ? 'Voting...' : getLabel()}
    </Button>
  );
};
