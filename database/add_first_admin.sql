-- Add First Admin User
-- Run this AFTER running add_admin_role.sql
-- Replace the values below with your actual data

-- Step 1: Find your Auth User ID
-- Go to Supabase Dashboard → Authentication → Users
-- Find your user and copy the "User UID" (it's a UUID like: 123e4567-e89b-12d3-a456-426614174000)

-- Step 2: Replace 'YOUR-AUTH-USER-ID-HERE' with your actual User UID
-- Step 3: Replace 'your-email@example.com' with your actual email

INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');

-- Example (DO NOT USE THIS - Replace with your actual values):
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 'admin@example.com');

-- To verify admin was added:
SELECT * FROM admin_users;

