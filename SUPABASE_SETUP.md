# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: `gita-distribution-tracker` (or any name you prefer)
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created (takes 1-2 minutes)

## Step 2: Get API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** or **publishable key** (both are the same - long JWT token)
     - Look for: `anon` `public` key OR `publishable_default` key
     - Either one will work!

## Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `database/schema.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

This will create:
- `users` table - for storing devotee information
- `activities` table - for storing distribution history
- Sample data (3 users with activities)

## Step 4: Configure Environment Variables

1. In your project root, create a `.env` file:
```bash
cp .env.example .env
```

2. Open `.env` file and add your Supabase credentials:
```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** You can use EITHER:
- `VITE_SUPABASE_ANON_KEY` (if you see "anon public" key)
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (if you see "publishable_default" key)

Both are the same thing - just use whichever one you see in your Supabase dashboard!

3. Replace the values with your actual Supabase URL and anon key from Step 2

## Step 5: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` package.

## Step 6: Run the Application

```bash
npm run dev
```

The app should now connect to Supabase and load data from the database!

## Verify Connection

1. Open the app in browser
2. Check browser console (F12) - there should be no errors
3. You should see the 3 sample users loaded from database
4. Try submitting a distribution form - it should save to Supabase

## Database Structure

### Users Table
- `id` (UUID) - Primary key
- `name` (TEXT) - Devotee name
- `city` (TEXT) - Optional city
- `photo` (TEXT) - Photo URL
- `hindi_gita` (INTEGER) - Total Hindi Gita distributed
- `english_gita` (INTEGER) - Total English Gita distributed
- `small_books` (INTEGER) - Total small books distributed
- `total_money` (DECIMAL) - Total money collected
- `created_at` (TIMESTAMP) - Creation date
- `updated_at` (TIMESTAMP) - Last update date

### Activities Table
- `id` (UUID) - Primary key
- `user_id` (UUID) - Foreign key to users
- `date` (DATE) - Activity date
- `hindi_gita` (INTEGER) - Hindi Gita distributed
- `english_gita` (INTEGER) - English Gita distributed
- `small_books` (INTEGER) - Small books distributed
- `money_received` (DECIMAL) - Money received
- `money_online` (DECIMAL) - Money paid online
- `money_offline` (DECIMAL) - Money paid offline
- `created_at` (TIMESTAMP) - Creation date

## Row Level Security (RLS)

The schema includes RLS policies that allow:
- Public read access (anyone can view data)
- Public insert/update (anyone can add/update data)

**For production**, you should:
1. Add authentication (Supabase Auth)
2. Restrict RLS policies based on user roles
3. Use service role key for admin operations

## Troubleshooting

### "Supabase credentials not found" warning
- Make sure `.env` file exists in project root
- Check that variable names start with `VITE_`
- Restart dev server after changing `.env`

### "Failed to fetch" error
- Check your Supabase URL is correct
- Verify your anon key is correct
- Check Supabase project is active (not paused)

### Data not loading
- Check browser console for errors
- Verify tables exist in Supabase dashboard (Table Editor)
- Check RLS policies are enabled and allow public access

### Can't insert/update data
- Check RLS policies allow INSERT/UPDATE
- Verify user_id exists in users table
- Check browser console for specific error messages

## Next Steps

1. **Add Authentication**: Use Supabase Auth for user login
2. **Add Real-time**: Enable real-time subscriptions for live updates
3. **Add Storage**: Use Supabase Storage for user photos
4. **Add Analytics**: Use Supabase Analytics to track usage

## Support

For Supabase help:
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

