-- Add Mobile Number Field
-- Run this in Supabase SQL Editor

-- Add mobile_number column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mobile_number TEXT;

-- Update existing records (optional - sets to NULL if not already set)
UPDATE users SET mobile_number = COALESCE(mobile_number, NULL) WHERE mobile_number IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.mobile_number IS 'User mobile/phone number';

