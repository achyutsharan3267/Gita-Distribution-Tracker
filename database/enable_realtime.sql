-- Enable Real-time for Tables
-- Run this in Supabase SQL Editor to enable real-time updates

-- Enable real-time for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable real-time for activities table
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- Verify real-time is enabled
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('users', 'activities');

