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
import { useState } from 'react';

export function CreateProposalModal() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingDays, setVotingDays] = useState(7); // Default 7 days
  const { mutate: createProposal, isPending } = useCreateProposal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const votingDuration = votingDays * 24 * 60 * 60; // Convert days to seconds
    
    createProposal(
      { title, description, votingDuration },
      {
        onSuccess: () => {
          setTitle('');
          setDescription('');
          setVotingDays(7);
          setOpen(false);
        },
        onError: (error) => {
          console.error('Failed to create proposal:', error);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Proposal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Submit a new proposal for the community to vote on.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="Enter proposal title"
                required
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Describe your proposal"
                required
                maxLength={500}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="votingDays" className="text-right">
                Voting Period
              </Label>
              <div className="col-span-3 flex items-center gap-2">
                <Input
                  id="votingDays"
                  type="number"
                  value={votingDays}
                  onChange={(e) => setVotingDays(parseInt(e.target.value) || 1)}
                  className="w-24"
                  min={1}
                  max={30}
                  required
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
