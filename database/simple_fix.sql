-- Simple Fix for RLS Policy Error
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing policy
DROP POLICY IF EXISTS "Users can create their own profile" ON users;

-- Step 2: Create new policy
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (auth_user_id IS NULL OR auth_user_id = auth.uid())
  );

-- Step 3: Ensure function exists
CREATE OR REPLACE FUNCTION set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    NEW.auth_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure trigger exists
DROP TRIGGER IF EXISTS trigger_set_auth_user_id ON users;
CREATE TRIGGER trigger_set_auth_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

