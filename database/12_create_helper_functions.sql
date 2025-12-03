-- ============================================
-- 12. Create Helper Functions
-- ============================================
-- Utility functions for the application
-- Run this AFTER 03_create_admin_users_table.sql
-- ============================================

-- Function to get users with email (joins auth.users)
CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  mobile_number TEXT,
  email TEXT,
  bace TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  auth_user_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.city,
    u.mobile_number,
    COALESCE(u.email, au.email, NULL) as email,
    u.bace,
    u.created_at,
    u.updated_at,
    u.auth_user_id
  FROM users u
  LEFT JOIN auth.users au ON u.auth_user_id = au.id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_users_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_email() TO anon;

-- Function to auto-set auth_user_id on user creation
CREATE OR REPLACE FUNCTION set_auth_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auth_user_id IS NULL THEN
    NEW.auth_user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-set auth_user_id
DROP TRIGGER IF EXISTS set_auth_user_id_trigger ON users;
CREATE TRIGGER set_auth_user_id_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_auth_user_id();

