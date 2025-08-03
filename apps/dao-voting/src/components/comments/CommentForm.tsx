'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useCreateComment } from '@/hooks/useComments';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

interface CommentFormProps {
  proposalId: number;
  parentCommentId?: string;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({ 
  proposalId, 
  parentCommentId, 
  onSuccess,
  placeholder = "Share your thoughts..."
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const { publicKey } = useWallet();
  const { mutate: createComment, isPending } = useCreateComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !publicKey) return;

    createComment({
      proposalId,
      content: content.trim(),
      parentCommentId,
    }, {
      onSuccess: () => {
        setContent('');
        onSuccess?.();
      },
    });
  };

  if (!publicKey) {
    return (
      <div className="text-center p-4 text-muted-foreground">
        Connect your wallet to comment
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isPending}
      />
      <div className="flex justify-end gap-2">
        {parentCommentId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setContent('');
              onSuccess?.();
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          size="sm"
          disabled={!content.trim() || isPending}
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
    </form>
  );
} 