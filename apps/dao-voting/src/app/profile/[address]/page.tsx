'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VotingPowerDisplay } from '@/components/voting/VotingPowerDisplay';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVotingHistory } from '@/hooks/useUserVotingHistory';
import { formatDate } from '@/utils/formatting';
import { PublicKey } from '@solana/web3.js';
import { AlertCircle, Calendar, CheckCircle, MinusCircle, User, Vote, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';

export default function ProfilePage() {
  const params = useParams();
  const address = params.address as string;
  
  const userPublicKey = useMemo(() => {
    try {
      return new PublicKey(address);
    } catch {
      return null;
    }
  }, [address]);

  const { data: profile } = useUserProfile(address);
  const { data: votingHistory, isLoading } = useUserVotingHistory(userPublicKey);

  // Invalid address state
  if (!userPublicKey) {
    return (
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Card className="border-destructive">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-2">Invalid Address</h1>
            <p className="text-muted-foreground">
              The wallet address provided is not valid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile?.username || `${address.slice(0, 4)}...${address.slice(-4)}`;
  const totalVotes = votingHistory?.length || 0;
  const voteBreakdown = votingHistory?.reduce(
    (acc, item) => {
      acc[item.vote.choice]++;
      return acc;
    },
    { yes: 0, no: 0, abstain: 0 }
  ) || { yes: 0, no: 0, abstain: 0 };

  const getVoteIcon = (choice: 'yes' | 'no' | 'abstain') => {
    switch (choice) {
      case 'yes':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'no':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'abstain':
        return <MinusCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="pb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover flex-shrink-0 ring-2 ring-border"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 ring-2 ring-border">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <div className="text-center sm:text-left min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{displayName}</h1>
                <p className="text-sm text-muted-foreground break-all font-mono">
                  {address}
                </p>
                {profile?.discord_id && (
                  <Badge variant="secondary" className="mt-3">
                    Discord Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalVotes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lifetime participation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Yes Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{voteBreakdown.yes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Supporting proposals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">No Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{voteBreakdown.no}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Opposing proposals
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Voting Power Display */}
        <VotingPowerDisplay walletAddress={address} />

        {/* Voting History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Voting History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Loading voting history...
                </div>
              </div>
            ) : votingHistory && votingHistory.length > 0 ? (
              <div className="space-y-1">
                {votingHistory.map((item, index) => (
                  <Link 
                    key={`${item.proposal.id}-${index}`} 
                    href={`/proposal/${item.proposal.id}`}
                    className="block"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-accent rounded-lg p-3 transition-colors gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium hover:underline line-clamp-1 mb-1">
                          {item.proposal.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Proposal #{item.proposal.id}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.vote.timestamp)}
                          </span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          item.vote.choice === 'yes' ? 'default' :
                          item.vote.choice === 'no' ? 'destructive' :
                          'secondary'
                        }
                        className="self-start sm:self-center flex items-center gap-1"
                      >
                        {getVoteIcon(item.vote.choice)}
                        {item.vote.choice.charAt(0).toUpperCase() + item.vote.choice.slice(1)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Vote className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No voting history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cast your first vote to see it here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 