-- Fix RLS Policy for Admin Badge Display
-- This allows checking admin status for badge display
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;

-- Create new policy that allows anyone to check admin status (read-only)
-- This is safe because we're only reading auth_user_id, not sensitive data
CREATE POLICY "Anyone can check admin status" ON admin_users
  FOR SELECT
  USING (true);

-- Note: This allows anyone to see which users are admins (for badge display)
-- This is intentional and safe - admin status is not sensitive information
-- If you want to keep it more restricted, you can use the RPC function instead

