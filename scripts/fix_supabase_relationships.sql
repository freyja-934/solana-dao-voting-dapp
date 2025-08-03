-- First, drop the existing RLS policies that might be causing issues
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create more permissive RLS policies for users table
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE
  USING (true);

-- Add foreign key constraint from comments to users
ALTER TABLE comments 
ADD CONSTRAINT comments_author_wallet_fkey 
FOREIGN KEY (author_wallet) 
REFERENCES users(wallet_address) 
ON DELETE CASCADE;

-- Update the comments query to not require the foreign key hint
-- Instead, we'll modify the hook to do a manual join

-- Also ensure the RLS policies for comments are permissive enough
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;

CREATE POLICY "Anyone can update comments"
  ON comments FOR UPDATE
  USING (true);

-- Ensure user_reputation table can be inserted/updated by anyone
CREATE POLICY "Anyone can insert reputation"
  ON user_reputation FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update reputation"
  ON user_reputation FOR UPDATE
  USING (true);

-- Fix the comment votes RLS policies
DROP POLICY IF EXISTS "Users can update their own votes" ON comment_votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON comment_votes;

CREATE POLICY "Anyone can update votes"
  ON comment_votes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete votes"
  ON comment_votes FOR DELETE
  USING (true);

-- Create a default user for any wallet addresses that don't have profiles yet
CREATE OR REPLACE FUNCTION ensure_user_exists(wallet TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO users (wallet_address, username, avatar_url, avatar_type)
  VALUES (wallet, wallet, '', 'default')
  ON CONFLICT (wallet_address) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Update the comment insert to ensure user exists
CREATE OR REPLACE FUNCTION before_comment_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM ensure_user_exists(NEW.author_wallet);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_comment_author_exists
BEFORE INSERT ON comments
FOR EACH ROW
EXECUTE FUNCTION before_comment_insert(); 