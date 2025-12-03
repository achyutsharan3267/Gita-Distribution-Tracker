-- ============================================
-- 09. Create App Config Table
-- ============================================
-- Stores system-wide configuration settings
-- Run this AFTER 03_create_admin_users_table.sql
-- ============================================

CREATE TABLE app_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_app_config_key ON app_config(key);

-- Enable RLS
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view config" ON app_config
  FOR SELECT USING (true);

CREATE POLICY "Admins can update config" ON app_config
  FOR UPDATE
  USING (is_current_user_admin())
  WITH CHECK (is_current_user_admin());

CREATE POLICY "Admins can insert config" ON app_config
  FOR INSERT
  WITH CHECK (is_current_user_admin());

-- Insert default config
INSERT INTO app_config (key, value, description)
VALUES ('require_admin_approval', 'true', 'If true, new users need admin approval before login. If false, users can login immediately after signup.')
ON CONFLICT (key) DO NOTHING;

