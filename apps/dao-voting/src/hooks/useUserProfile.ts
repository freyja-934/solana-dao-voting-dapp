import { Database, supabase } from '@/lib/supabase';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type UserProfile = Database['public']['Tables']['users']['Row'];
type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

export function useUserProfile(walletAddress: string | null) {
  return useQuery({
    queryKey: ['user-profile', walletAddress],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!walletAddress) return null;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('wallet_address', walletAddress)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
          // Return a default profile instead of null
          return {
            id: walletAddress,
            wallet_address: walletAddress,
            discord_id: null,
            username: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
            avatar_url: '',
            avatar_type: 'default',
            nft_mint_address: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        return data;
      } catch (e) {
        console.error('Supabase connection error:', e);
        // Return a default profile on connection errors
        return {
          id: walletAddress,
          wallet_address: walletAddress,
          discord_id: null,
          username: `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`,
          avatar_url: '',
          avatar_type: 'default',
          nft_mint_address: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
    },
    enabled: !!walletAddress,
  });
}

export function useCreateOrUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: {
      wallet_address: string;
      username: string;
      avatar_url: string;
      avatar_type: 'discord' | 'nft' | 'default';
      discord_id?: string | null;
      nft_mint_address?: string | null;
    }) => {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('wallet_address', profile.wallet_address)
        .single();

      if (existingProfile) {
        const { data, error } = await supabase
          .from('users')
          .update(profile)
          .eq('wallet_address', profile.wallet_address)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('users')
          .insert(profile)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', data.wallet_address] });
    },
  });
}

export function useUserProfiles(walletAddresses: string[]) {
  return useQuery({
    queryKey: ['user-profiles', walletAddresses],
    queryFn: async (): Promise<UserProfile[]> => {
      if (walletAddresses.length === 0) return [];

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('wallet_address', walletAddresses);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return [];
      }

      return data || [];
    },
    enabled: walletAddresses.length > 0,
  });
} 