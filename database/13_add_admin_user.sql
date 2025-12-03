-- ============================================
-- 13. Add Admin User
-- ============================================
-- Use this to give admin access to a user
-- Run this AFTER 03_create_admin_users_table.sql
-- ============================================

-- ============================================
-- HOW TO USE:
-- ============================================
-- Step 1: Find the user's Auth User ID
--   - Go to Supabase Dashboard → Authentication → Users
--   - Find the user and copy their "User UID" (UUID format)
--
-- Step 2: Replace the values below:
--   - Replace 'YOUR-AUTH-USER-ID-HERE' with the actual User UID
--   - Replace 'user-email@example.com' with the user's email
--
-- Step 3: Run this SQL
-- ============================================

-- Add admin user
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'user-email@example.com')
ON CONFLICT (auth_user_id) DO UPDATE
SET email = EXCLUDED.email;

-- ============================================
-- EXAMPLE:
-- ============================================
-- If your:
--   - Auth User ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
--   - Email: admin@example.com
--
-- Then the INSERT would be:
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@example.com')
-- ON CONFLICT (auth_user_id) DO UPDATE
-- SET email = EXCLUDED.email;
-- ============================================

-- Verify admin was added
SELECT 
  au.id,
  au.email,
  au.auth_user_id,
  u.name as user_name
FROM admin_users au
LEFT JOIN users u ON u.auth_user_id = au.auth_user_id
WHERE au.auth_user_id = 'YOUR-AUTH-USER-ID-HERE';

-- To see all admins:
-- SELECT * FROM admin_users;

