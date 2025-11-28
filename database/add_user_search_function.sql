-- Add Function to Get Users with Email for Search
-- This function allows searching users with their email from auth.users

CREATE OR REPLACE FUNCTION get_users_with_email()
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  mobile_number TEXT,
  email TEXT,
  photo TEXT,
  hindi_gita INTEGER,
  english_gita INTEGER,
  small_books INTEGER,
  bhagavatam INTEGER,
  chaitanya_charitamrita INTEGER,
  other_books INTEGER,
  total_money DECIMAL,
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
    COALESCE(au.email, NULL) as email,
    u.photo,
    u.hindi_gita,
    u.english_gita,
    u.small_books,
    u.bhagavatam,
    u.chaitanya_charitamrita,
    u.other_books,
    u.total_money,
    u.created_at,
    u.updated_at,
    u.auth_user_id
  FROM users u
  LEFT JOIN auth.users au ON u.auth_user_id = au.id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_email() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_with_email() TO anon;

