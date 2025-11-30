-- Create sadhna table for daily spiritual practice tracking
CREATE TABLE IF NOT EXISTS sadhna (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  wake_up_time TIME,
  mangla_arti BOOLEAN DEFAULT false,
  tulsi_arti BOOLEAN DEFAULT false,
  guru_puja BOOLEAN DEFAULT false,
  sandhya_arti BOOLEAN DEFAULT false,
  first_round_timing TIME,
  last_round_timing TIME,
  total_rounds INTEGER DEFAULT 0,
  lecture_hearing TEXT,
  book_reading TEXT,
  services_done TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date) -- One entry per user per day
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sadhna_user_id ON sadhna(user_id);
CREATE INDEX IF NOT EXISTS idx_sadhna_date ON sadhna(date);
CREATE INDEX IF NOT EXISTS idx_sadhna_user_date ON sadhna(user_id, date);

-- Enable Row Level Security
ALTER TABLE sadhna ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sadhna entries
CREATE POLICY "Users can view own sadhna" ON sadhna
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own sadhna entries
CREATE POLICY "Users can insert own sadhna" ON sadhna
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Policy: Users can update their own sadhna entries
CREATE POLICY "Users can update own sadhna" ON sadhna
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own sadhna entries
CREATE POLICY "Users can delete own sadhna" ON sadhna
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Policy: Admins can view all sadhna entries
CREATE POLICY "Admins can view all sadhna" ON sadhna
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sadhna_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_sadhna_updated_at
  BEFORE UPDATE ON sadhna
  FOR EACH ROW
  EXECUTE FUNCTION update_sadhna_updated_at();

