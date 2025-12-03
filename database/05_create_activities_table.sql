-- ============================================
-- 05. Create Activities Table
-- ============================================
-- Stores distribution history/activities
-- Run this AFTER 04_create_books_table.sql
-- ============================================

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  money_received DECIMAL(10, 2) DEFAULT 0,
  money_online DECIMAL(10, 2) DEFAULT 0,
  money_offline DECIMAL(10, 2) DEFAULT 0,
  approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_date ON activities(date DESC);
CREATE INDEX idx_activities_approval_status ON activities(approval_status);

-- Enable RLS
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Users can create activities for own profile" ON activities
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own activities" ON activities
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = activities.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

