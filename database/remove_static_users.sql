-- Remove Static/Test Users from Database
-- This removes the sample users created by schema.sql

-- Step 1: Delete activities of static users
DELETE FROM activities 
WHERE user_id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Step 2: Delete static users
DELETE FROM users 
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003'
);

-- Step 3: Also remove any users without auth_user_id (not linked to real accounts)
DELETE FROM activities 
WHERE user_id IN (
  SELECT id FROM users WHERE auth_user_id IS NULL
);

DELETE FROM users 
WHERE auth_user_id IS NULL;

-- Step 4: Verify deletion
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as authenticated_users,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as static_users
FROM users;

SELECT COUNT(*) as total_activities FROM activities;

-- List remaining users
SELECT id, name, email, auth_user_id, created_at 
FROM users 
ORDER BY created_at DESC;

