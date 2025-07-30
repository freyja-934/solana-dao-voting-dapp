'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { useWallet } from '@solana/wallet-adapter-react';
import { useState } from 'react';

export const CreateProposalModal = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const { connected } = useWallet();
  const createProposal = useCreateProposal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    try {
      await createProposal.mutateAsync({ title, description });
      setOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create proposal:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!connected}>
          Create Proposal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Submit a new proposal for the DAO to vote on. All members can participate in the voting process.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter proposal title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your proposal in detail"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                required
                rows={4}
              />
              <span className="text-sm text-muted-foreground">
                {description.length}/500 characters
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createProposal.isPending || !title || !description}>
              {createProposal.isPending ? 'Creating...' : 'Create Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
