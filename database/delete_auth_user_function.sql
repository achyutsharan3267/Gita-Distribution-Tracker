-- Create function to delete auth user
-- This function allows deletion from auth.users table
-- Run this in Supabase SQL Editor

-- Function to delete auth user (requires service role or admin permissions)
CREATE OR REPLACE FUNCTION delete_auth_user(user_auth_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_auth_id;
  
  -- Return success
  RAISE NOTICE 'Auth user % deleted successfully', user_auth_id;
END;
$$;

-- Grant execute permission to authenticated users (or adjust as needed)
-- Note: This function uses SECURITY DEFINER, so it runs with the creator's permissions
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;

-- Alternative: If the above doesn't work, you may need to use Supabase Admin API
-- Or create a database webhook/edge function to handle this

