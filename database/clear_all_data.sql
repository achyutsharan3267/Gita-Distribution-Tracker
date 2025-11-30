-- Clear All Database Data
-- This script will delete ALL data from all tables
-- Table structure will remain intact
-- Run this in Supabase SQL Editor

-- ============================================
-- WARNING: This will delete ALL data!
-- Make sure you have backups if needed
-- ============================================

-- Step 1: Delete book_distributions (has foreign keys to activities and users)
-- This must be deleted first
DELETE FROM book_distributions;

-- Step 2: Delete activities (has foreign key to users)
DELETE FROM activities;

-- Step 3: Delete users (main table)
-- This will also cascade delete related data if CASCADE is set
DELETE FROM users;

-- Step 4: Delete admin_users (references auth.users)
-- Note: This won't delete auth users, just the admin_users table entries
DELETE FROM admin_users;

-- Step 5: Delete books (all book definitions)
-- If you want to keep default books, comment out this section
DELETE FROM books;

-- ============================================
-- Optional: Reset sequences if any
-- ============================================
-- If you have any sequences, reset them here
-- Example: ALTER SEQUENCE your_sequence_name RESTART WITH 1;

-- ============================================
-- Verification: Check if tables are empty
-- ============================================
-- Run these queries to verify:
-- SELECT COUNT(*) FROM book_distributions; -- Should be 0
-- SELECT COUNT(*) FROM activities; -- Should be 0
-- SELECT COUNT(*) FROM users; -- Should be 0
-- SELECT COUNT(*) FROM admin_users; -- Should be 0
-- SELECT COUNT(*) FROM books; -- Should be 0

-- ============================================
-- Step 6: Clear Storage (Profile Photos)
-- ============================================
-- Storage files cannot be deleted via SQL
-- You need to do this manually:

-- Option 1: Via Supabase Dashboard
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on 'profile-photos' bucket
-- 3. Select all files (or folders)
-- 4. Click "Delete" button

-- Option 2: Via SQL (if you have access to storage.objects)
-- Uncomment the following if you have proper permissions:
-- DELETE FROM storage.objects WHERE bucket_id = 'profile-photos';

-- ============================================
-- Step 7: Clear Auth Users (IMPORTANT!)
-- ============================================
-- ⚠️ CRITICAL: You MUST clear auth.users to avoid "User already registered" errors!
-- If you don't clear auth.users, users won't be able to sign up with the same email again.
-- 
-- Option 1: Via Supabase Dashboard (RECOMMENDED)
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Select all users (or specific test users)
-- 3. Click "Delete" button
-- 4. Confirm deletion
--
-- Option 2: Via SQL (Requires service_role key - NOT recommended for production)
-- WARNING: This requires superuser access. Use Dashboard method instead.
-- DELETE FROM auth.users;
--
-- ⚠️ IMPORTANT: After clearing auth.users, users will need to sign up again.
-- Their old passwords will be lost - they'll need to create new accounts.

-- ============================================
-- Verification Queries
-- ============================================
-- Run these to verify all data is cleared:
-- SELECT COUNT(*) FROM book_distributions; -- Should be 0
-- SELECT COUNT(*) FROM activities; -- Should be 0
-- SELECT COUNT(*) FROM users; -- Should be 0
-- SELECT COUNT(*) FROM admin_users; -- Should be 0
-- SELECT COUNT(*) FROM books; -- Should be 0

-- ============================================
-- After Clearing: Next Steps
-- ============================================
-- 1. Re-insert default books (if needed):
--    Run: database/create_books_table.sql
--
-- 2. Add your first admin user:
--    Run: database/add_admin_role.sql
--    Then manually insert your admin in admin_users table
--
-- 3. Test with a new signup to ensure everything works

