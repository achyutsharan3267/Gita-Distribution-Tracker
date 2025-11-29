-- Create book_distributions table for storing dynamic book distributions
-- This table stores individual book distributions that don't have fixed columns
-- Run this in Supabase SQL Editor

-- Create book_distributions table
CREATE TABLE IF NOT EXISTS book_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL, -- References books.book_id
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_book_distributions_activity_id ON book_distributions(activity_id);
CREATE INDEX IF NOT EXISTS idx_book_distributions_user_id ON book_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_book_distributions_book_id ON book_distributions(book_id);

-- Enable Row Level Security
ALTER TABLE book_distributions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Anyone can view book distributions" ON book_distributions;
DROP POLICY IF EXISTS "Users can insert their own book distributions" ON book_distributions;
DROP POLICY IF EXISTS "Admins can manage book distributions" ON book_distributions;

-- Allow anyone to read book distributions (for public display)
CREATE POLICY "Anyone can view book distributions" ON book_distributions
  FOR SELECT USING (true);

-- Allow authenticated users to insert their own book distributions
CREATE POLICY "Users can insert their own book distributions" ON book_distributions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = book_distributions.user_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- Allow admins to manage all book distributions
CREATE POLICY "Admins can manage book distributions" ON book_distributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_book_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_book_distributions_updated_at ON book_distributions;

CREATE TRIGGER update_book_distributions_updated_at
  BEFORE UPDATE ON book_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_book_distributions_updated_at();

