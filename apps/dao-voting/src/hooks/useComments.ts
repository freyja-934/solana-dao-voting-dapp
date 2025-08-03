import { Database, supabase } from '@/lib/supabase';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type CommentVote = Database['public']['Tables']['comment_votes']['Row'];

export interface CommentWithAuthor extends Comment {
  author?: Database['public']['Tables']['users']['Row'];
  replies?: CommentWithAuthor[];
  userVote?: 'upvote' | 'downvote' | null;
}

export function useComments(proposalId: number) {
  const { publicKey } = useWallet();
  const walletAddress = publicKey?.toBase58();

  return useQuery({
    queryKey: ['comments', proposalId],
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      // First fetch comments
      const { data: comments, error: commentsError } = await supabase
        .from('comments')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get unique author wallets
      const authorWallets = [...new Set(comments.map(c => c.author_wallet))];

      // Fetch users separately
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .in('wallet_address', authorWallets);

      const usersMap = new Map(users?.map(u => [u.wallet_address, u]) || []);

      // Fetch user votes if wallet is connected
      let votesMap = new Map<string, 'upvote' | 'downvote'>();
      if (walletAddress) {
        const { data: votes } = await supabase
          .from('comment_votes')
          .select('*')
          .eq('voter_wallet', walletAddress)
          .in('comment_id', comments.map(c => c.id));

        votesMap = new Map(votes?.map(v => [v.comment_id, v.vote_type]) || []);
      }

      // Combine data
      const commentsWithData = comments.map(comment => ({
        ...comment,
        author: usersMap.get(comment.author_wallet),
        userVote: votesMap.get(comment.id) || null,
      }));

      // Build comment tree
      const rootComments = commentsWithData.filter(c => !c.parent_comment_id);
      const repliesMap = new Map<string, CommentWithAuthor[]>();

      commentsWithData.forEach(comment => {
        if (comment.parent_comment_id) {
          const replies = repliesMap.get(comment.parent_comment_id) || [];
          replies.push(comment);
          repliesMap.set(comment.parent_comment_id, replies);
        }
      });

      return rootComments.map(comment => ({
        ...comment,
        replies: repliesMap.get(comment.id) || [],
      }));
    },
    enabled: !!proposalId,
  });
}

export function useCreateComment() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      proposalId, 
      content, 
      parentCommentId 
    }: { 
      proposalId: number; 
      content: string; 
      parentCommentId?: string;
    }) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const walletAddress = publicKey.toBase58();

      let depth = 0;
      if (parentCommentId) {
        const { data: parentComment } = await supabase
          .from('comments')
          .select('depth')
          .eq('id', parentCommentId)
          .single();
        
        if (parentComment) {
          depth = parentComment.depth + 1;
          if (depth > 2) throw new Error('Maximum comment depth exceeded');
        }
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          proposal_id: proposalId,
          author_wallet: walletAddress,
          content,
          parent_comment_id: parentCommentId || null,
          depth,
        })
        .select()
        .single();

      if (error) throw error;

      // Update user reputation
      const { error: repError } = await supabase
        .from('user_reputation')
        .upsert({
          wallet_address: walletAddress,
          comments_made: 1,
        }, {
          onConflict: 'wallet_address',
          count: 'exact',
        });

      if (!repError) {
        await supabase.rpc('calculate_voting_power', { wallet: walletAddress });
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['comments', variables.proposalId] });
      queryClient.invalidateQueries({ queryKey: ['user-reputation'] });
    },
  });
}

export function useVoteComment() {
  const { publicKey } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      commentId, 
      voteType 
    }: { 
      commentId: string; 
      voteType: 'upvote' | 'downvote' | null;
    }) => {
      if (!publicKey) throw new Error('Wallet not connected');

      const walletAddress = publicKey.toBase58();

      const { data: existingVote } = await supabase
        .from('comment_votes')
        .select('*')
        .eq('comment_id', commentId)
        .eq('voter_wallet', walletAddress)
        .single();

      if (existingVote && voteType === null) {
        await supabase
          .from('comment_votes')
          .delete()
          .eq('id', existingVote.id);
      } else if (existingVote && voteType !== null) {
        await supabase
          .from('comment_votes')
          .update({ vote_type: voteType })
          .eq('id', existingVote.id);
      } else if (!existingVote && voteType !== null) {
        await supabase
          .from('comment_votes')
          .insert({
            comment_id: commentId,
            voter_wallet: walletAddress,
            vote_type: voteType,
          });
      }

      return { commentId, voteType };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['user-reputation'] });
    },
  });
} 