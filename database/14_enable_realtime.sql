-- ============================================
-- 14. Enable Realtime for Tables
-- ============================================
-- Enables Supabase Realtime for all tables that need real-time updates
-- Run this AFTER all tables are created
-- ============================================

-- Enable Realtime for users table
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Enable Realtime for activities table
ALTER PUBLICATION supabase_realtime ADD TABLE activities;

-- Enable Realtime for book_distributions table
ALTER PUBLICATION supabase_realtime ADD TABLE book_distributions;

-- Enable Realtime for payments_to_admin table
ALTER PUBLICATION supabase_realtime ADD TABLE payments_to_admin;

-- Enable Realtime for sadhna table
ALTER PUBLICATION supabase_realtime ADD TABLE sadhna;

-- Enable Realtime for books table
ALTER PUBLICATION supabase_realtime ADD TABLE books;

-- Enable Realtime for admin_users table
ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;

-- Note: If you get an error that publication doesn't exist, you may need to:
-- 1. Go to Supabase Dashboard → Database → Replication
-- 2. Enable Realtime for each table manually
-- OR
-- 3. Create the publication first:
-- CREATE PUBLICATION supabase_realtime FOR ALL TABLES;

