-- Bhagavad Gita Distribution Tracker Database Schema WITH AUTHENTICATION
-- Run this SQL in your Supabase SQL Editor
-- This updates the existing schema to add authentication support

-- First, add auth_user_id column to users table (if not exists)
-- This links each devotee profile to a Supabase Auth user
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one profile per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Drop ALL existing policies first (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow public insert on users" ON users;
DROP POLICY IF EXISTS "Allow public update on users" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow public read access on activities" ON activities;
DROP POLICY IF EXISTS "Allow public insert on activities" ON activities;
DROP POLICY IF EXISTS "Allow public update on activities" ON activities;
DROP POLICY IF EXISTS "Anyone can view activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities for own profile" ON activities;
DROP POLICY IF EXISTS "Users can update own activities" ON activities;

-- New RLS Policies for users table

-- Anyone can read/view all users (for leaderboard, etc.)
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- Only authenticated users can create their own profile
-- The trigger will automatically set auth_user_id to auth.uid()
-- Policy checks: user is authenticated AND (auth_user_id is NULL or matches)
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth_user_id IS NULL OR auth_user_id = auth.uid())
  );

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- No delete policy (delete not allowed as per requirements)

-- New RLS Policies for activities table

-- Anyone can read/view all activities (for viewing history)
CREATE POLICY "Anyone can view activities" ON activities
  FOR SELECT USING (true);

-- Only authenticated users can create activities for their own user_id
CREATE POLICY "Users can create activities for own profile" ON activities
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Users can only update their own activities
CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- No delete policy (delete not allowed as per requirements)

-- Function to automatically set auth_user_id on insert
CREATE OR REPLACE FUNCTION set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    NEW.auth_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-set auth_user_id
DROP TRIGGER IF EXISTS trigger_set_auth_user_id ON users;
CREATE TRIGGER trigger_set_auth_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

