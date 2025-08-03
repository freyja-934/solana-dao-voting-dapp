'use client';

import { DiscordConnectButton } from '@/components/profile/DiscordConnectButton';
import { NFTSelectorModal } from '@/components/profile/NFTSelectorModal';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCreateOrUpdateProfile, useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@solana/wallet-adapter-react';
import { ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProfileSettingsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
  const { publicKey } = useWallet();
  const [showNFTSelector, setShowNFTSelector] = useState(false);
  const [username, setUsername] = useState('');
  
  const walletAddress = publicKey?.toBase58() || null;
  const { data: profile } = useUserProfile(walletAddress);
  const { mutate: updateProfile, isPending } = useCreateOrUpdateProfile();

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
    } else if (walletAddress) {
      setUsername(`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`);
    }
  }, [profile, walletAddress]);

  const handleSave = () => {
    if (!walletAddress) return;

    updateProfile({
      wallet_address: walletAddress,
      username: username.trim() || `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
      avatar_url: profile?.avatar_url || '',
      avatar_type: profile?.avatar_type || 'default',
      discord_id: profile?.discord_id || null,
      nft_mint_address: profile?.nft_mint_address || null,
    }, {
      onSuccess: () => {
        onOpenChange?.(false);
      },
    });
  };

  const handleResetAvatar = () => {
    if (!walletAddress || !profile) return;

    updateProfile({
      wallet_address: walletAddress,
      username: profile.username,
      avatar_url: '',
      avatar_type: 'default',
      discord_id: null,
      nft_mint_address: null,
    });
  };

  if (!publicKey) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label>Wallet Address</Label>
              <Input
                value={walletAddress || ''}
                disabled
                className="font-mono text-xs truncate"
                readOnly
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Avatar Source</Label>
              <div className="space-y-2">
                <DiscordConnectButton />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowNFTSelector(true)}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Select NFT Avatar
                </Button>
                {profile?.avatar_type !== 'default' && (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive"
                    onClick={handleResetAvatar}
                  >
                    Reset to Default Avatar
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending || !username.trim()}
              >
                {isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <NFTSelectorModal
        isOpen={showNFTSelector}
        onClose={() => setShowNFTSelector(false)}
      />
    </>
  );
} 