'use client';

import { UserAvatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CommentWithAuthor, useVoteComment } from '@/hooks/useComments';
import { useUserProfile } from '@/hooks/useUserProfile';
import { formatDate } from '@/utils/formatting';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { CommentForm } from './CommentForm';

interface CommentItemProps {
  comment: CommentWithAuthor;
  proposalId: number;
  depth?: number;
}

export function CommentItem({ comment, proposalId, depth = 0 }: CommentItemProps) {
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const { mutate: voteComment } = useVoteComment();
  const { data: authorProfile } = useUserProfile(comment.author_wallet);

  const handleVote = (voteType: 'upvote' | 'downvote') => {
    const newVote = comment.userVote === voteType ? null : voteType;
    voteComment({ commentId: comment.id, voteType: newVote });
  };

  const displayName = authorProfile?.username || 
    `${comment.author_wallet.slice(0, 4)}...${comment.author_wallet.slice(-4)}`;

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <UserAvatar address={comment.author_wallet} size="sm" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{displayName}</span>
              <span className="text-muted-foreground">
                {formatDate(new Date(comment.created_at).getTime() / 1000)}
              </span>
            </div>
            <p className="text-sm">{comment.content}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={comment.userVote === 'upvote' ? 'default' : 'ghost'}
                  className="h-7 px-2"
                  onClick={() => handleVote('upvote')}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-xs">{comment.upvotes}</span>
                </Button>
                <Button
                  size="sm"
                  variant={comment.userVote === 'downvote' ? 'destructive' : 'ghost'}
                  className="h-7 px-2"
                  onClick={() => handleVote('downvote')}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span className="text-xs">{comment.downvotes}</span>
                </Button>
              </div>
              {depth < 2 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => setShowReply(!showReply)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 ml-auto"
                  onClick={() => setShowReplies(!showReplies)}
                >
                  {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {
                    comment.replies.length === 1 ? 'reply' : 'replies'
                  }
                </Button>
              )}
            </div>
          </div>
        </div>

        {showReply && (
          <div className="ml-11 mt-3">
            <CommentForm
              proposalId={proposalId}
              parentCommentId={comment.id}
              onSuccess={() => setShowReply(false)}
              placeholder="Write a reply..."
            />
          </div>
        )}

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                proposalId={proposalId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 