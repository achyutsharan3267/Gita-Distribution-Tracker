-- ============================================
-- 10. Add User Approval Status
-- ============================================
-- Adds approval_status column to users table
-- Run this AFTER 01_create_users_table.sql
-- ============================================

-- Add approval_status column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);

-- Update existing users to 'approved' (so they can still login)
UPDATE users 
SET approval_status = 'approved' 
WHERE approval_status IS NULL OR approval_status = '';

