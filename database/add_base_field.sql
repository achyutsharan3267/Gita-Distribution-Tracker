-- Add Other Field
-- Run this in Supabase SQL Editor

-- Add other column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS other TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.other IS 'User other location (Mayapur Dham or Govind Dham)';

