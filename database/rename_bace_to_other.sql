-- Rename bace column to other
-- Run this in Supabase SQL Editor

-- Rename the column from bace to other (if bace exists)
ALTER TABLE users 
RENAME COLUMN bace TO other;

-- Or if base column exists, rename it to other
-- ALTER TABLE users 
-- RENAME COLUMN base TO other;

-- Update comment
COMMENT ON COLUMN users.other IS 'User other location (Mayapur Dham or Govind Dham)';

