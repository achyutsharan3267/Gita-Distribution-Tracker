-- ============================================
-- 06. Create Book Distributions Table
-- ============================================
-- Stores dynamic book distributions linked to activities
-- Run this AFTER 05_create_activities_table.sql
-- ============================================

CREATE TABLE book_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  book_id TEXT NOT NULL, -- References books.book_id
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, book_id)
);

-- Create indexes
CREATE INDEX idx_book_distributions_activity_id ON book_distributions(activity_id);
CREATE INDEX idx_book_distributions_user_id ON book_distributions(user_id);
CREATE INDEX idx_book_distributions_book_id ON book_distributions(book_id);

-- Enable RLS
ALTER TABLE book_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view book_distributions" ON book_distributions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own book_distributions" ON book_distributions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = book_distributions.activity_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_book_distributions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_book_distributions_updated_at
  BEFORE UPDATE ON book_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_book_distributions_updated_at();

