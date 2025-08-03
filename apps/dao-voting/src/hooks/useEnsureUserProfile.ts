import { supabase } from '@/lib/supabase';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export function useEnsureUserProfile() {
  const { publicKey, connected } = useWallet();

  useEffect(() => {
    async function ensureProfile() {
      if (!connected || !publicKey) return;

      const walletAddress = publicKey.toBase58();
      console.log('Checking/creating profile for wallet:', walletAddress);

      try {
        // Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('id')
          .eq('wallet_address', walletAddress)
          .single();

        console.log('Fetch result:', { existingUser, fetchError });

        // If user doesn't exist (PGRST116 = no rows returned), create one
        if (fetchError && fetchError.code === 'PGRST116') {
          console.log('User not found, creating new profile...');
          
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              wallet_address: walletAddress,
              username: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
              avatar_url: '',
              avatar_type: 'default',
            })
            .select()
            .single();

          if (insertError) {
            console.error('Error creating user profile:', insertError);
            
            // If it's a 406 error, it might be an RLS issue
            if (insertError.message?.includes('406')) {
              console.error('Supabase RLS policy may be blocking inserts. Check your Supabase dashboard.');
            }
          } else {
            console.log('User profile created successfully:', newUser);
            
            // Also initialize reputation
            const { data: repData, error: repError } = await supabase
              .from('user_reputation')
              .insert({
                wallet_address: walletAddress,
                comment_upvotes_received: 0,
                proposals_created: 0,
                votes_cast: 0,
                comments_made: 0,
                voting_power: 1,
              })
              .select()
              .single();

            if (repError) {
              console.error('Error creating reputation:', repError);
            } else {
              console.log('User reputation initialized:', repData);
            }
          }
        } else if (!fetchError && existingUser) {
          console.log('User profile already exists:', existingUser.id);
        } else if (fetchError) {
          console.error('Unexpected error fetching user:', fetchError);
        }
      } catch (error) {
        console.error('Error in ensureProfile:', error);
      }
    }

    ensureProfile();
  }, [connected, publicKey]);
} 