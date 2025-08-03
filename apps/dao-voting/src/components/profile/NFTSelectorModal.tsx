'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserNFTs } from '@/hooks/useUserNFTs';
import { useCreateOrUpdateProfile, useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@solana/wallet-adapter-react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface NFTSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NFTSelectorModal({ isOpen, onClose }: NFTSelectorModalProps) {
  const { publicKey } = useWallet();
  const [selectedNFT, setSelectedNFT] = useState<string | null>(null);
  
  const walletAddress = publicKey?.toBase58() || null;
  const { data: profile } = useUserProfile(walletAddress);
  const { data: nfts, isLoading } = useUserNFTs(publicKey);
  const { mutate: updateProfile, isPending } = useCreateOrUpdateProfile();

  const handleSelectNFT = (nft: { mint: string; image?: string }) => {
    if (!walletAddress || !profile || !nft.image) return;

    updateProfile({
      wallet_address: walletAddress,
      username: profile.username,
      avatar_url: nft.image,
      avatar_type: 'nft',
      discord_id: null,
      nft_mint_address: nft.mint,
    }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select NFT Avatar</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : nfts && nfts.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto">
              {nfts.map((nft) => (
                <button
                  key={nft.mint}
                  onClick={() => handleSelectNFT(nft)}
                  disabled={isPending}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedNFT === nft.mint ? 'border-primary' : 'border-border hover:border-muted-foreground'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Image
                    src={nft.image || ''}
                    alt={nft.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 25vw"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white truncate">{nft.name}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No NFTs found in your wallet
              </p>
              <p className="text-sm text-muted-foreground">
                NFTs with valid image metadata will appear here
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 