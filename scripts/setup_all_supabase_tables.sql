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
  EXECUTE FUNCTION update_updated_at_column(); -- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id INTEGER NOT NULL,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_wallet TEXT NOT NULL,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0 CHECK (depth <= 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comment votes table to track who voted
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  voter_wallet TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, voter_wallet)
);

-- Create user reputation table
CREATE TABLE IF NOT EXISTS user_reputation (
  wallet_address TEXT PRIMARY KEY,
  comment_upvotes_received INTEGER DEFAULT 0,
  proposals_created INTEGER DEFAULT 0,
  votes_cast INTEGER DEFAULT 0,
  comments_made INTEGER DEFAULT 0,
  voting_power INTEGER DEFAULT 1,
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comments_proposal_id ON comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON comments(author_wallet);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_voter ON comment_votes(voter_wallet);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (author_wallet = auth.uid()::text);

-- RLS Policies for comment votes
CREATE POLICY "Anyone can view comment votes"
  ON comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON comment_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own votes"
  ON comment_votes FOR UPDATE
  USING (voter_wallet = auth.uid()::text);

CREATE POLICY "Users can delete their own votes"
  ON comment_votes FOR DELETE
  USING (voter_wallet = auth.uid()::text);

-- RLS Policies for user reputation
CREATE POLICY "Anyone can view reputation"
  ON user_reputation FOR SELECT
  USING (true);

-- Function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE comments SET upvotes = upvotes + 1 WHERE id = NEW.comment_id;
      UPDATE user_reputation 
      SET comment_upvotes_received = comment_upvotes_received + 1
      WHERE wallet_address = (SELECT author_wallet FROM comments WHERE id = NEW.comment_id);
    ELSE
      UPDATE comments SET downvotes = downvotes + 1 WHERE id = NEW.comment_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE comments SET upvotes = upvotes - 1 WHERE id = OLD.comment_id;
      UPDATE user_reputation 
      SET comment_upvotes_received = comment_upvotes_received - 1
      WHERE wallet_address = (SELECT author_wallet FROM comments WHERE id = OLD.comment_id);
    ELSE
      UPDATE comments SET downvotes = downvotes - 1 WHERE id = OLD.comment_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote counting
CREATE TRIGGER update_comment_votes_trigger
AFTER INSERT OR DELETE ON comment_votes
FOR EACH ROW
EXECUTE FUNCTION update_comment_votes();

-- Function to calculate voting power
CREATE OR REPLACE FUNCTION calculate_voting_power(wallet TEXT)
RETURNS INTEGER AS $$
DECLARE
  reputation RECORD;
  power INTEGER;
BEGIN
  SELECT * INTO reputation FROM user_reputation WHERE wallet_address = wallet;
  
  IF NOT FOUND THEN
    RETURN 1;
  END IF;
  
  -- Base voting power of 1
  power := 1;
  
  -- Add power based on comment upvotes (1 power per 10 upvotes, max 10)
  power := power + LEAST(reputation.comment_upvotes_received / 10, 10);
  
  -- Add power based on proposals created (2 power per proposal, max 10)
  power := power + LEAST(reputation.proposals_created * 2, 10);
  
  -- Add power based on participation (1 power per 5 votes cast, max 5)
  power := power + LEAST(reputation.votes_cast / 5, 5);
  
  -- Add power based on comments (1 power per 10 comments, max 5)
  power := power + LEAST(reputation.comments_made / 10, 5);
  
  -- Update the calculated voting power
  UPDATE user_reputation 
  SET voting_power = power, last_calculated = NOW()
  WHERE wallet_address = wallet;
  
  RETURN power;
END;
$$ LANGUAGE plpgsql; 