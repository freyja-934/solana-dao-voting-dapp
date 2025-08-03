'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { VotingPowerDisplay } from '@/components/voting/VotingPowerDisplay';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUserVotingHistory } from '@/hooks/useUserVotingHistory';
import { formatDate } from '@/utils/formatting';
import { PublicKey } from '@solana/web3.js';
import { Calendar, User, Vote } from 'lucide-react';
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

  if (!userPublicKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Address</h1>
          <p className="text-muted-foreground">The wallet address provided is not valid.</p>
        </div>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <User className="w-10 h-10 text-white" />
                </div>
              )}
              <div>
                <CardTitle className="text-2xl">{displayName}</CardTitle>
                <p className="text-muted-foreground text-sm">{address}</p>
                {profile?.discord_id && (
                  <Badge variant="secondary" className="mt-2">
                    Discord Connected
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Total Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalVotes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Yes Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{voteBreakdown.yes}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">No Votes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{voteBreakdown.no}</p>
            </CardContent>
          </Card>
        </div>

        <VotingPowerDisplay walletAddress={address} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Voting History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading voting history...</p>
            ) : votingHistory && votingHistory.length > 0 ? (
              <div className="space-y-4">
                {votingHistory.map((item, index) => (
                  <div key={index}>
                    <Link href={`/proposal/${item.proposal.id}`}>
                      <div className="flex items-start justify-between hover:bg-accent p-3 rounded-lg transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h4 className="font-medium hover:underline">
                            {item.proposal.title}
                          </h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
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
                        >
                          {item.vote.choice.charAt(0).toUpperCase() + item.vote.choice.slice(1)}
                        </Badge>
                      </div>
                    </Link>
                    {index < votingHistory.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No voting history yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 