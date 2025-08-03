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
import { toast } from 'sonner';

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
          setOpen(false);
          setTitle('');
          setDescription('');
          setVotingDays(7);
          
          toast.success('Proposal Created!', {
            description: 'Your proposal has been successfully submitted. Community members can now vote on it.',
            duration: 5000,
          });
        },
        onError: (error) => {
          console.error('Failed to create proposal:', error);
          toast.error('Failed to create proposal', {
            description: error.message || 'Please try again later.',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Proposal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Submit a proposal for the community to vote on.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter proposal title"
                required
                aria-describedby="title-error"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your proposal in detail"
                rows={4}
                required
                aria-describedby="description-error"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="votingDays">Voting Period (days)</Label>
              <div className="flex gap-2 mb-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingDays(3)}
                  aria-pressed={votingDays === 3}
                >
                  3 days
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingDays(7)}
                  aria-pressed={votingDays === 7}
                >
                  1 week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingDays(30)}
                  aria-pressed={votingDays === 30}
                >
                  1 month
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVotingDays(90)}
                  aria-pressed={votingDays === 90}
                >
                  3 months
                </Button>
              </div>
              <Input
                id="votingDays"
                type="number"
                min="1"
                max="365"
                value={votingDays}
                onChange={(e) => setVotingDays(parseInt(e.target.value) || 7)}
                required
                aria-label="Custom voting period in days"
              />
              <p className="text-sm text-muted-foreground">
                How many days should voting remain open? (1-365 days)
              </p>
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
