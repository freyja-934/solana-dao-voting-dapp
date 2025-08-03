-- Test if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'comments', 'comment_votes', 'user_reputation', 'proposal_activities');

-- Check if users table has any data
SELECT COUNT(*) as user_count
FROM users;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Test inserting a user
INSERT INTO users
  (wallet_address, username, avatar_url, avatar_type)
VALUES
  ('test-' || NOW()
::text, 'Test User', '', 'default')
RETURNING *;

-- Test selecting users
SELECT *
FROM users LIMIT
5; 