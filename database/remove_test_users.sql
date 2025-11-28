-- Remove Test/Static Users Only
-- This script removes users that are likely test/static users
-- Keeps real authenticated users

-- Step 1: Delete activities of test users
DELETE FROM activities 
WHERE user_id IN (
  SELECT id FROM users 
  WHERE 
    -- Users without auth_user_id (not linked to real accounts)
    auth_user_id IS NULL
    OR
    -- Users with test/example emails
    email LIKE '%test%' 
    OR email LIKE '%example%' 
    OR email LIKE '%dummy%'
    OR email LIKE '%sample%'
    OR
    -- Users with very low distribution (likely test data)
    (hindi_gita = 0 AND english_gita = 0 AND small_books = 0 
     AND (bhagavatam IS NULL OR bhagavatam = 0)
     AND (chaitanya_charitamrita IS NULL OR chaitanya_charitamrita = 0)
     AND (other_books IS NULL OR other_books = 0))
);

-- Step 2: Delete test users
DELETE FROM users 
WHERE 
  -- Users without auth_user_id (not linked to real accounts)
  auth_user_id IS NULL
  OR
  -- Users with test/example emails
  email LIKE '%test%' 
  OR email LIKE '%example%' 
  OR email LIKE '%dummy%'
  OR email LIKE '%sample%'
  OR
  -- Users with very low distribution (likely test data)
  (hindi_gita = 0 AND english_gita = 0 AND small_books = 0 
   AND (bhagavatam IS NULL OR bhagavatam = 0)
   AND (chaitanya_charitamrita IS NULL OR chaitanya_charitamrita = 0)
   AND (other_books IS NULL OR other_books = 0));

-- Step 3: Verify what's left
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN auth_user_id IS NOT NULL THEN 1 END) as authenticated_users,
  COUNT(CASE WHEN auth_user_id IS NULL THEN 1 END) as static_users
FROM users;

SELECT COUNT(*) as total_activities FROM activities;

