-- ============================================
-- 07. Create Sadhna Table
-- ============================================
-- Stores daily spiritual practice tracking
-- Run this AFTER 01_create_users_table.sql
-- ============================================

CREATE TABLE sadhna (
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

-- Create indexes
CREATE INDEX idx_sadhna_user_id ON sadhna(user_id);
CREATE INDEX idx_sadhna_date ON sadhna(date);
CREATE INDEX idx_sadhna_user_date ON sadhna(user_id, date);

-- Enable RLS
ALTER TABLE sadhna ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own sadhna" ON sadhna
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sadhna" ON sadhna
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Users can insert own sadhna" ON sadhna
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own sadhna" ON sadhna
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = sadhna.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

