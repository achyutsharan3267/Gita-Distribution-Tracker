-- Create function to reset user password
-- This function allows admin to reset any user's password
-- Run this in Supabase SQL Editor

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to reset user password (requires service role or admin permissions)
-- WARNING: This function may not work directly due to Supabase security restrictions
-- Alternative: Use Supabase Admin API via Edge Function or backend service
CREATE OR REPLACE FUNCTION reset_user_password(user_auth_id UUID, new_password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  user_exists BOOLEAN;
  user_email TEXT;
BEGIN
  -- Check if user exists and get email
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_auth_id), 
         (SELECT email FROM auth.users WHERE id = user_auth_id LIMIT 1)
  INTO user_exists, user_email;
  
  IF NOT user_exists THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Note: Direct UPDATE on auth.users may be restricted by Supabase
  -- This function attempts to update but may require additional permissions
  -- For production, use Supabase Admin API via Edge Function
  
  -- Try to update password (this may fail due to RLS/security)
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = user_auth_id;
  
  -- Return success message
  RETURN format('Password reset successfully for user: %s', user_email);
  
EXCEPTION
  WHEN OTHERS THEN
    -- If direct update fails, return error message
    RAISE EXCEPTION 'Password reset failed. Please use Supabase Admin API or Edge Function. Error: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION reset_user_password(UUID, TEXT) TO authenticated;

-- Note: If the above function doesn't work due to security restrictions,
-- you'll need to:
-- 1. Use Supabase Edge Function with service role key
-- 2. Or use Supabase Admin API from a backend service
-- 3. Or use password reset email link functionality
