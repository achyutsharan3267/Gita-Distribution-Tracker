-- Fix RLS Policy for User Insert
-- Run this in Supabase SQL Editor if you're getting "new row violates row-level security policy" error

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Create a better insert policy that works with the trigger
-- The trigger will set auth_user_id automatically, so we just need to check user is authenticated
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (auth_user_id IS NULL OR auth.uid() = auth_user_id)
  );

-- Alternative: Even simpler policy - just check user is authenticated
-- The trigger will automatically set auth_user_id to auth.uid()
-- Uncomment below and comment above if the first one doesn't work

-- DROP POLICY IF EXISTS "Users can create their own profile" ON users;
-- CREATE POLICY "Users can create their own profile" ON users
--   FOR INSERT 
--   WITH CHECK (auth.uid() IS NOT NULL);

