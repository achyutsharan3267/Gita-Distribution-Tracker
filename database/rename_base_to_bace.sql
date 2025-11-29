-- Rename base column to other
-- Run this in Supabase SQL Editor

-- Rename the column from base to other
ALTER TABLE users 
RENAME COLUMN base TO other;

-- Update comment
COMMENT ON COLUMN users.other IS 'User other location (Mayapur Dham or Govind Dham)';

