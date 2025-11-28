-- Check Admin Users
-- Run this to see current admin_users table data

SELECT * FROM admin_users;

-- If auth_user_id is NULL, you need to update it
-- Replace 'YOUR-AUTH-USER-ID' with your actual User UID
-- Replace 'your-email@example.com' with the email in the table

-- Option 1: Update existing record (if record exists but auth_user_id is NULL)
-- UPDATE admin_users 
-- SET auth_user_id = 'YOUR-AUTH-USER-ID'
-- WHERE email = 'your-email@example.com';

-- Option 2: Delete and re-insert (if you want to start fresh)
-- DELETE FROM admin_users WHERE email = 'your-email@example.com';
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('YOUR-AUTH-USER-ID', 'your-email@example.com');

-- Option 3: If no record exists, insert new one
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('YOUR-AUTH-USER-ID', 'your-email@example.com');

