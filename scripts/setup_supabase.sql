-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  discord_id TEXT UNIQUE,
  username TEXT NOT NULL,
  avatar_url TEXT NOT NULL,
  avatar_type TEXT NOT NULL CHECK (avatar_type IN ('discord', 'nft', 'default')),
  nft_mint_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create proposal_activities table
CREATE TABLE IF NOT EXISTS proposal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id INTEGER NOT NULL,
  user_wallet TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('vote', 'comment', 'status_change')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_discord_id ON users(discord_id);
CREATE INDEX IF NOT EXISTS idx_activities_proposal_id ON proposal_activities(proposal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_wallet ON proposal_activities(user_wallet);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON proposal_activities(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view all profiles"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = wallet_address);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = wallet_address);

-- RLS Policies for proposal_activities table
CREATE POLICY "Anyone can view activities"
  ON proposal_activities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert activities"
  ON proposal_activities FOR INSERT
  WITH CHECK (auth.uid()::text = user_wallet);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 