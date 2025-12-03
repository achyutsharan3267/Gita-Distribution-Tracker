-- ============================================
-- 04. Create Books Table
-- ============================================
-- Stores book types and prices
-- Run this AFTER 03_create_admin_users_table.sql
-- ============================================

CREATE TABLE books (
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

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view books" ON books
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage books" ON books
  FOR ALL
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

-- Trigger for updated_at
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

