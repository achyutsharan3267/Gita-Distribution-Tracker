-- CORRECT INSERT STATEMENT FOR ADMIN
-- Copy this and replace the values

INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');

-- Important Notes:
-- 1. Column names: auth_user_id, email (NOT the UID itself)
-- 2. UID goes in VALUES with quotes: 'YOUR-AUTH-USER-ID-HERE'
-- 3. Email goes in VALUES with quotes: 'your-email@example.com'

-- Replace 'YOUR-AUTH-USER-ID-HERE' with your actual User UID
-- Replace 'your-email@example.com' with your actual email address

-- Example format (DO NOT USE - Replace with your actual values):
-- INSERT INTO admin_users (auth_user_id, email) 
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 'admin@example.com');

