-- Create books table for managing book types and prices
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id TEXT UNIQUE NOT NULL, -- e.g., 'hindiGita', 'englishGita'
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📖',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  color TEXT DEFAULT 'text-gray-600',
  bg_color TEXT DEFAULT 'bg-gray-600',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read books (for public display)
CREATE POLICY "Anyone can view books" ON books
  FOR SELECT USING (true);

-- Only admins can insert/update/delete books
-- This will be handled by checking admin status in the application
CREATE POLICY "Admins can manage books" ON books
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
CREATE OR REPLACE FUNCTION update_books_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON books
  FOR EACH ROW
  EXECUTE FUNCTION update_books_updated_at();

-- Insert default books
INSERT INTO books (book_id, name, icon, price, description, color, bg_color) VALUES
  ('hindiGita', 'Hindi Bhagavad Gita', '📖', 50, 'Bhagavad Gita in Hindi', 'text-spiritual-600', 'bg-spiritual-600'),
  ('englishGita', 'English Bhagavad Gita', '📚', 50, 'Bhagavad Gita in English', 'text-primary-600', 'bg-primary-600'),
  ('smallBooks', 'Small Books', '📗', 20, 'Small spiritual books', 'text-green-600', 'bg-green-600'),
  ('bhagavatam', 'Bhagavatam', '📜', 100, 'Srimad Bhagavatam', 'text-yellow-600', 'bg-yellow-600'),
  ('chaitanyaCharitamrita', 'Chaitanya Charitamrita', '📖', 150, 'Chaitanya Charitamrita', 'text-purple-600', 'bg-purple-600'),
  ('otherBooks', 'Other Books', '📘', 30, 'Other Prabhupada ji''s books', 'text-blue-600', 'bg-blue-600')
ON CONFLICT (book_id) DO NOTHING;

