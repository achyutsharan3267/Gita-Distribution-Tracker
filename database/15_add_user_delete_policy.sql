-- ============================================
-- 15. Add DELETE Policy for Users Table
-- ============================================
-- Allows admins to delete users from the database
-- Run this AFTER 03_create_admin_users_table.sql
-- ============================================

-- Add DELETE policy for admins
CREATE POLICY "Admins can delete users" ON users
  FOR DELETE
  USING (is_current_user_admin());

-- Grant necessary permissions
GRANT DELETE ON users TO authenticated;

