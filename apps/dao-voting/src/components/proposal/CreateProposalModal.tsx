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
import { SuccessDialog } from '@/components/ui/success-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useCreateProposal } from '@/hooks/useCreateProposal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateProposalModal() {
  const [open, setOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votingDays, setVotingDays] = useState(7); // Default 7 days
  const { mutate: createProposal, isPending } = useCreateProposal();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const votingDuration = votingDays * 24 * 60 * 60; // Convert days to seconds
    
    createProposal(
      { title, description, votingDuration },
      {
        onSuccess: () => {
          console.log('Proposal created successfully');
          setOpen(false);
          setTitle('');
          setDescription('');
          setVotingDays(7);
          setShowSuccess(true);
        },
        onError: (error) => {
          console.error('Failed to create proposal:', error);
        },
      }
    );
  };

  const handleSuccessAction = () => {
    // Navigate to proposals page or refresh
    router.refresh();
  };

  return (
    <>
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
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="votingDays">Voting Period (days)</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVotingDays(3)}
                  >
                    3 days
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVotingDays(7)}
                  >
                    1 week
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVotingDays(30)}
                  >
                    1 month
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setVotingDays(90)}
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
      
      <SuccessDialog
        open={showSuccess}
        onOpenChange={setShowSuccess}
        title="Proposal Created!"
        description="Your proposal has been successfully submitted. Community members can now vote on it."
        actionLabel="View Proposals"
        onAction={handleSuccessAction}
      />
    </>
  );
}
