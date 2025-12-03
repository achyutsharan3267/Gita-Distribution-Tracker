-- ============================================
-- 08. Create Payments to Admin Table
-- ============================================
-- Stores user-to-admin payment transactions
-- Separate from activities (which are user-customer transactions)
-- Run this AFTER 01_create_users_table.sql
-- ============================================

CREATE TABLE payments_to_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  money_online DECIMAL(10, 2) DEFAULT 0,
  money_offline DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_payments_to_admin_user_id ON payments_to_admin(user_id);
CREATE INDEX idx_payments_to_admin_date ON payments_to_admin(date DESC);

-- Enable RLS
ALTER TABLE payments_to_admin ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own payments" ON payments_to_admin
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = payments_to_admin.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON payments_to_admin
  FOR SELECT
  USING (is_current_user_admin());

CREATE POLICY "Users can insert own payments" ON payments_to_admin
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = payments_to_admin.user_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_payments_to_admin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payments_to_admin_updated_at
  BEFORE UPDATE ON payments_to_admin
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_to_admin_updated_at();

