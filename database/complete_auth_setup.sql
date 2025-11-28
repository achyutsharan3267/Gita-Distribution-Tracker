-- Complete Authentication Setup Script
-- Run this ENTIRE script in Supabase SQL Editor
-- This will set up everything needed for authentication

-- ============================================
-- STEP 1: Add auth_user_id column (if not exists)
-- ============================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index to ensure one profile per auth user
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================
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

-- ============================================
-- STEP 3: Create new RLS Policies for users table
-- ============================================

-- Anyone can read/view all users (for leaderboard, etc.)
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- Only authenticated users can create their own profile
-- The trigger will automatically set auth_user_id to auth.uid()
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- No delete policy (delete not allowed as per requirements)

-- ============================================
-- STEP 4: Create new RLS Policies for activities table
-- ============================================

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

-- ============================================
-- STEP 5: Create trigger function and trigger
-- ============================================

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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_set_auth_user_id ON users;

-- Create trigger to auto-set auth_user_id
CREATE TRIGGER trigger_set_auth_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

-- ============================================
-- DONE! All policies and triggers are set up
-- ============================================

