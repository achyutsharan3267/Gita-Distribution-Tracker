-- ============================================
-- 02. Add Auth User ID to Users Table
-- ============================================
-- Links user profile to Supabase Auth user
-- Run this AFTER 01_create_users_table.sql
-- ============================================

-- Add auth_user_id column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create unique index (one profile per auth user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id_unique 
ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id 
ON users(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- Update RLS policy to use auth_user_id
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = users.id 
      AND users.auth_user_id = auth.uid()
    )
  );
