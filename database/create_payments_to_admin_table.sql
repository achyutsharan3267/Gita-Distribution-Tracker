-- Create payments_to_admin table for storing user-to-admin payment transactions
-- This is separate from activities table which is for user-customer transactions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payments_to_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  money_online DECIMAL(10, 2) DEFAULT 0,
  money_offline DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_to_admin_user_id ON payments_to_admin(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_to_admin_date ON payments_to_admin(date DESC);

-- Enable Row Level Security
ALTER TABLE payments_to_admin ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own payments" ON payments_to_admin;
DROP POLICY IF EXISTS "Users can insert their own payments" ON payments_to_admin;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments_to_admin;

-- Users can view their own payments
CREATE POLICY "Users can view their own payments" ON payments_to_admin
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = payments_to_admin.user_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- Users can insert their own payments
CREATE POLICY "Users can insert their own payments" ON payments_to_admin
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = payments_to_admin.user_id
      AND users.auth_user_id = auth.uid()
    )
  );

-- Create or replace is_current_user_admin function (if it doesn't exist from add_admin_role.sql)
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE auth_user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON payments_to_admin
  FOR SELECT
  USING (is_current_user_admin());

-- Create trigger to update updated_at
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

