-- Disable RLS temporarily to ensure we can make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reputation ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view all profiles" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;

-- Create simple, permissive policies for anonymous access
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON users
  FOR UPDATE USING (true);

-- Ensure other tables also have proper anonymous access
CREATE POLICY IF NOT EXISTS "Enable all access for proposal_activities" ON proposal_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for comments" ON comments
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for comment_votes" ON comment_votes
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Enable all access for user_reputation" ON user_reputation
  FOR ALL USING (true) WITH CHECK (true);

-- Test by creating a dummy user to ensure the table works
INSERT INTO users (wallet_address, username, avatar_url, avatar_type)
VALUES ('test-wallet-' || gen_random_uuid(), 'Test User', '', 'default')
ON CONFLICT DO NOTHING; 