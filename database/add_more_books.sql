-- Add More Book Types to Database
-- Run this in Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bhagavatam INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chaitanya_charitamrita INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_books INTEGER DEFAULT 0;

-- Add new columns to activities table
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS bhagavatam INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chaitanya_charitamrita INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_books INTEGER DEFAULT 0;

-- Update existing records (optional - sets to 0 if not already set)
UPDATE users SET 
  bhagavatam = COALESCE(bhagavatam, 0),
  chaitanya_charitamrita = COALESCE(chaitanya_charitamrita, 0),
  other_books = COALESCE(other_books, 0)
WHERE bhagavatam IS NULL OR chaitanya_charitamrita IS NULL OR other_books IS NULL;

UPDATE activities SET 
  bhagavatam = COALESCE(bhagavatam, 0),
  chaitanya_charitamrita = COALESCE(chaitanya_charitamrita, 0),
  other_books = COALESCE(other_books, 0)
WHERE bhagavatam IS NULL OR chaitanya_charitamrita IS NULL OR other_books IS NULL;

