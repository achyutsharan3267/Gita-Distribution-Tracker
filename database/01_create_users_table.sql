-- ============================================
-- 01. Create Users Table
-- ============================================
-- This is the main users/devotees table
-- Run this FIRST
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  mobile_number TEXT,
  city TEXT,
  bace TEXT, -- Bace location (e.g., Mayapur Dham, Govind Dham, Other)
  photo TEXT, -- URL to user profile photo (can be Supabase Storage URL or external URL)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mobile_number ON users(mobile_number);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: auth_user_id column will be added in 02_add_auth_user_id.sql
-- These policies will be updated after auth_user_id is added

CREATE POLICY "Anyone can view users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can create profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Basic update policy (will be updated in step 02 after auth_user_id is added)
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

