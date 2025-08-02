import { BN } from '@coral-xyz/anchor';

export function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString();
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function isProposalExpired(expiresAt: number): boolean {
  const now = Math.floor(Date.now() / 1000); // Current time in seconds
  return now > expiresAt;
}

export function formatTimeRemaining(expiresAt: number): string {
  const now = Math.floor(Date.now() / 1000);
  const remaining = expiresAt - now;
  
  if (remaining <= 0) {
    return 'Expired';
  }
  
  const days = Math.floor(remaining / (24 * 60 * 60));
  const hours = Math.floor((remaining % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((remaining % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ${hours}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  } else {
    return `${minutes}m remaining`;
  }
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
