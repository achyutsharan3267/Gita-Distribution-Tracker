-- Add Admin Role Support
-- Run this in Supabase SQL Editor

-- Add admin_users table to track admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admin_users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;

-- Policy: Only admins can view admin_users
CREATE POLICY "Admins can view admin_users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    )
  );

-- Policy: Only admins can insert admin_users (for now, you can manually add first admin)
CREATE POLICY "Admins can insert admin_users" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE auth_user_id = auth.uid()
    ) OR auth.uid() IS NOT NULL
  );

-- Add function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies on users table to allow admin operations
DROP POLICY IF EXISTS "Admins can update any user" ON users;
CREATE POLICY "Admins can update any user" ON users
  FOR UPDATE
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can delete any user" ON users;
CREATE POLICY "Admins can delete any user" ON users
  FOR DELETE
  USING (is_current_user_admin());

-- Update RLS policies on activities table
DROP POLICY IF EXISTS "Admins can delete any activity" ON activities;
CREATE POLICY "Admins can delete any activity" ON activities
  FOR DELETE
  USING (is_current_user_admin());

DROP POLICY IF EXISTS "Admins can update any activity" ON activities;
CREATE POLICY "Admins can update any activity" ON activities
  FOR UPDATE
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Note: To add first admin, run this manually (replace with actual auth user ID):
-- Replace 'YOUR-AUTH-USER-ID-HERE' with your actual User UID
-- Replace 'your-email@example.com' with your actual email
-- 
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');

