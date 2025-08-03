'use client';

import { Button } from '@/components/ui/button';
import { useCreateOrUpdateProfile, useUserProfile } from '@/hooks/useUserProfile';
import { useWallet } from '@solana/wallet-adapter-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import { useEffect } from 'react';

export function DiscordConnectButton() {
  const { publicKey } = useWallet();
  const { data: session, status } = useSession();
  const walletAddress = publicKey?.toBase58() || null;
  const { data: profile } = useUserProfile(walletAddress);
  const { mutate: updateProfile } = useCreateOrUpdateProfile();

  useEffect(() => {
    if (session?.discordId && walletAddress && profile && !profile.discord_id) {
      updateProfile({
        wallet_address: walletAddress,
        username: session.user?.name || profile.username,
        avatar_url: session.discordAvatar || profile.avatar_url,
        avatar_type: 'discord',
        discord_id: session.discordId,
        nft_mint_address: null,
      });
    }
  }, [session, walletAddress, profile, updateProfile]);

  if (!publicKey) return null;

  const handleDiscordConnect = () => {
    signIn('discord');
  };

  const handleDiscordDisconnect = () => {
    if (!walletAddress || !profile) return;
    
    updateProfile({
      wallet_address: walletAddress,
      username: profile.username,
      avatar_url: '',
      avatar_type: 'default',
      discord_id: null,
      nft_mint_address: profile.nft_mint_address,
    }, {
      onSuccess: () => {
        signOut({ redirect: false });
      },
    });
  };

  if (status === 'loading') {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (session && profile?.discord_id) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 border rounded-lg">
          {session.discordAvatar && (
            <Image
              src={session.discordAvatar}
              alt="Discord Avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium">{session.user?.name}</p>
            <p className="text-xs text-muted-foreground">Discord Connected</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDiscordDisconnect}
          className="w-full"
        >
          Disconnect Discord
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleDiscordConnect}
      className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white"
    >
      <svg
        className="w-5 h-5 mr-2"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
      </svg>
      Connect Discord
    </Button>
  );
} 