import { BN } from '@coral-xyz/anchor';

export function formatDate(timestamp: BN | number): string {
  const date = new Date(
    typeof timestamp === 'number' ? timestamp * 1000 : timestamp.toNumber() * 1000
  );
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateVotePercentage(
  votes: BN | number,
  totalVotes: BN | number
): number {
  const votesNum = typeof votes === 'number' ? votes : votes.toNumber();
  const totalNum = typeof totalVotes === 'number' ? totalVotes : totalVotes.toNumber();
  
  if (totalNum === 0) return 0;
  return Math.round((votesNum / totalNum) * 100);
}

export function formatAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
