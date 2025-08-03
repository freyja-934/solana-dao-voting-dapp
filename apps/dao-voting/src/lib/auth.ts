import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { supabase } from './supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'identify email',
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        (session as any).user.id = token.sub!;
        (session as any).discordId = token.sub!;
        (session as any).discordAvatar = token.picture || null;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = account.providerAccountId;
        token.picture = (profile as any).image_url || (profile as any).avatar 
          ? `https://cdn.discordapp.com/avatars/${account.providerAccountId}/${(profile as any).avatar}.png`
          : null;
      }
      return token;
    },
    async signIn({ account, profile }) {
      if (account?.provider === 'discord') {
        try {
          const discordId = account.providerAccountId;
          const username = (profile as any).username || (profile as any).global_name || 'Discord User';
          const avatarUrl = (profile as any).avatar 
            ? `https://cdn.discordapp.com/avatars/${discordId}/${(profile as any).avatar}.png`
            : '';

          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('discord_id', discordId)
            .single();

          if (existingUser) {
            await supabase
              .from('users')
              .update({
                username,
                avatar_url: avatarUrl,
                avatar_type: 'discord',
              })
              .eq('discord_id', discordId);
          }

          return true;
        } catch (error) {
          console.error('Error in signIn callback:', error);
          return false;
        }
      }
      return false;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
};

declare module 'next-auth' {
  interface Session {
    discordId?: string;
    discordAvatar?: string | null;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
} 