-- ============================================
-- 11. Add Photo Column to Users Table
-- ============================================
-- Adds photo URL column to users table
-- Run this AFTER 01_create_users_table.sql
-- ============================================

-- Add photo column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add comment
COMMENT ON COLUMN users.photo IS 'URL to user profile photo (can be Supabase Storage URL or external URL)';

-- Note: Photo can be:
-- 1. Supabase Storage URL (recommended for uploaded photos)
-- 2. External URL (if user provides their own photo URL)
-- 3. NULL (will use generated avatar based on name)

