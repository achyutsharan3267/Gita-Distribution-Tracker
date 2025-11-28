-- Remove All Users from Database
-- ⚠️ WARNING: This will delete ALL users and their activities
-- Use with caution! This cannot be undone.

-- Option 1: Delete all users and their activities (COMPLETE CLEANUP)
-- Uncomment the lines below to delete everything:

-- DELETE FROM activities;
-- DELETE FROM users;

-- Option 2: Delete only users without auth_user_id (test/static users)
-- This keeps real authenticated users
DELETE FROM activities 
WHERE user_id IN (
  SELECT id FROM users WHERE auth_user_id IS NULL
);

DELETE FROM users 
WHERE auth_user_id IS NULL;

-- Option 3: Delete specific test users by email pattern
-- Uncomment and modify as needed:
-- DELETE FROM activities 
-- WHERE user_id IN (
--   SELECT id FROM users 
--   WHERE email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%dummy%'
-- );
-- 
-- DELETE FROM users 
-- WHERE email LIKE '%test%' OR email LIKE '%example%' OR email LIKE '%dummy%';

-- Verify deletion
SELECT COUNT(*) as remaining_users FROM users;
SELECT COUNT(*) as remaining_activities FROM activities;

