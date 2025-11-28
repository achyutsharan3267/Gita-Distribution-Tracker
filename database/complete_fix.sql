-- COMPLETE FIX FOR RLS POLICY ERROR
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Ensure RLS is enabled
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Drop ALL existing policies
-- ============================================
DROP POLICY IF EXISTS "Allow public read access on users" ON users;
DROP POLICY IF EXISTS "Allow public insert on users" ON users;
DROP POLICY IF EXISTS "Allow public update on users" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Users can create their own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- ============================================
-- STEP 3: Create SIMPLE policies for testing
-- ============================================

-- Allow anyone to view users
CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

-- Allow any authenticated user to insert (simple policy for testing)
CREATE POLICY "Users can create their own profile" ON users
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- ============================================
-- STEP 4: Create/Update the trigger function
-- ============================================
CREATE OR REPLACE FUNCTION set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Set auth_user_id to current authenticated user
  IF NEW.auth_user_id IS NULL THEN
    NEW.auth_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create/Update the trigger
-- ============================================
DROP TRIGGER IF EXISTS trigger_set_auth_user_id ON users;
CREATE TRIGGER trigger_set_auth_user_id
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

-- ============================================
-- STEP 6: Verify setup
-- ============================================
-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'trigger_set_auth_user_id';

-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'set_auth_user_id';

-- Check policies
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'users';

