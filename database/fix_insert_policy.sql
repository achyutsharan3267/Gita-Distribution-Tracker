-- Fix INSERT Policy for Users Table
-- Run this in Supabase SQL Editor to fix the RLS policy error

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create a new policy that works with the trigger
-- The trigger sets auth_user_id BEFORE the policy check
-- So we check that either:
-- 1. auth_user_id is NULL (trigger will set it) OR
-- 2. auth_user_id matches the authenticated user
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth_user_id IS NULL OR auth_user_id = auth.uid())
  );

-- Verify and create the function if it doesn't exist
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

-- Create the trigger
CREATE TRIGGER trigger_set_auth_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

