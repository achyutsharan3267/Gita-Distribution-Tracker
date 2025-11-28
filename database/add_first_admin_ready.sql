-- Add First Admin User - READY TO USE
-- Replace 'your-email@example.com' with your actual email address

INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');

-- Instructions:
-- 1. Replace 'YOUR-AUTH-USER-ID-HERE' with your actual User UID (which you already have)
-- 2. Replace 'your-email@example.com' with your actual email address
-- 3. Copy the INSERT statement
-- 4. Paste in Supabase SQL Editor
-- 5. Run it

-- Example (if your UID is already added in the column list):
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@example.com');

