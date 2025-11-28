-- Bhagavad Gita Distribution Tracker Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create users/devotees table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  photo TEXT,
  hindi_gita INTEGER DEFAULT 0,
  english_gita INTEGER DEFAULT 0,
  small_books INTEGER DEFAULT 0,
  total_money DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table for distribution history
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hindi_gita INTEGER DEFAULT 0,
  english_gita INTEGER DEFAULT 0,
  small_books INTEGER DEFAULT 0,
  money_received DECIMAL(10, 2) DEFAULT 0,
  money_online DECIMAL(10, 2) DEFAULT 0,
  money_offline DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write access
-- Note: In production, you should restrict these based on authentication
CREATE POLICY "Allow public read access on users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on users" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read access on activities" ON activities
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on activities" ON activities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on activities" ON activities
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (id, name, city, photo, hindi_gita, english_gita, small_books, total_money) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Krishna Das', 'Vrindavan', 'https://ui-avatars.com/api/?name=Krishna+Das&background=a855f7&color=fff&size=128', 150, 120, 300, 45000),
  ('00000000-0000-0000-0000-000000000002', 'Radha Devi', 'Mathura', 'https://ui-avatars.com/api/?name=Radha+Devi&background=dc2626&color=fff&size=128', 200, 180, 400, 60000),
  ('00000000-0000-0000-0000-000000000003', 'Gopal Krishna', 'Delhi', 'https://ui-avatars.com/api/?name=Gopal+Krishna&background=9333ea&color=fff&size=128', 100, 90, 200, 30000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample activities
INSERT INTO activities (user_id, date, hindi_gita, english_gita, small_books, money_received, money_online, money_offline) VALUES
  ('00000000-0000-0000-0000-000000000001', '2024-01-15', 10, 8, 20, 3000, 2000, 1000),
  ('00000000-0000-0000-0000-000000000002', '2024-01-15', 15, 12, 30, 4500, 3000, 1500),
  ('00000000-0000-0000-0000-000000000003', '2024-01-14', 8, 7, 15, 2250, 1500, 750)
ON CONFLICT DO NOTHING;

