import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          discord_id: string | null;
          username: string;
          avatar_url: string;
          avatar_type: 'discord' | 'nft' | 'default';
          nft_mint_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          discord_id?: string | null;
          username: string;
          avatar_url: string;
          avatar_type: 'discord' | 'nft' | 'default';
          nft_mint_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          discord_id?: string | null;
          username?: string;
          avatar_url?: string;
          avatar_type?: 'discord' | 'nft' | 'default';
          nft_mint_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      proposal_activities: {
        Row: {
          id: string;
          proposal_id: number;
          user_wallet: string;
          activity_type: 'vote' | 'comment' | 'status_change';
          metadata: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: number;
          user_wallet: string;
          activity_type: 'vote' | 'comment' | 'status_change';
          metadata?: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: number;
          user_wallet?: string;
          activity_type?: 'vote' | 'comment' | 'status_change';
          metadata?: Record<string, any>;
          created_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          proposal_id: number;
          parent_comment_id: string | null;
          author_wallet: string;
          content: string;
          upvotes: number;
          downvotes: number;
          depth: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_id: number;
          parent_comment_id?: string | null;
          author_wallet: string;
          content: string;
          upvotes?: number;
          downvotes?: number;
          depth?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          proposal_id?: number;
          parent_comment_id?: string | null;
          author_wallet?: string;
          content?: string;
          upvotes?: number;
          downvotes?: number;
          depth?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comment_votes: {
        Row: {
          id: string;
          comment_id: string;
          voter_wallet: string;
          vote_type: 'upvote' | 'downvote';
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          voter_wallet: string;
          vote_type: 'upvote' | 'downvote';
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          voter_wallet?: string;
          vote_type?: 'upvote' | 'downvote';
          created_at?: string;
        };
      };
      user_reputation: {
        Row: {
          wallet_address: string;
          comment_upvotes_received: number;
          proposals_created: number;
          votes_cast: number;
          comments_made: number;
          voting_power: number;
          last_calculated: string;
        };
        Insert: {
          wallet_address: string;
          comment_upvotes_received?: number;
          proposals_created?: number;
          votes_cast?: number;
          comments_made?: number;
          voting_power?: number;
          last_calculated?: string;
        };
        Update: {
          wallet_address?: string;
          comment_upvotes_received?: number;
          proposals_created?: number;
          votes_cast?: number;
          comments_made?: number;
          voting_power?: number;
          last_calculated?: string;
        };
      };
    };
  };
}; 