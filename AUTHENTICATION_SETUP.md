# Authentication Setup Guide

## Overview

The app now has authentication enabled. Users must:
1. Sign up / Log in to access the app
2. Can only edit their own distribution data
3. Cannot delete any data (as per requirements)
4. Can view all users' data (for leaderboard)

## Database Setup

### Step 1: Run Authentication Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the SQL from `database/schema_with_auth.sql`
3. This will:
   - Add `auth_user_id` column to `users` table
   - Update RLS policies to restrict access
   - Add trigger to auto-link profiles to auth users

### Step 2: Enable Email Auth in Supabase

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Make sure **Email** provider is enabled
3. Configure email settings if needed

## How It Works

### User Registration Flow

1. User signs up with email/password
2. Supabase Auth creates authentication record
3. User profile is created in `users` table with `auth_user_id` linked
4. User can now access the app

### Data Access Rules

- **View**: Anyone (authenticated or not) can view all users and activities
- **Create**: Only authenticated users can create their own profile
- **Update**: Users can only update their own profile and activities
- **Delete**: Not allowed (no delete policies)

### RLS Policies

The database uses Row Level Security (RLS) with these policies:

**Users Table:**
- `Anyone can view users` - Public read access
- `Users can create their own profile` - Only own profile
- `Users can update own profile` - Only own profile

**Activities Table:**
- `Anyone can view activities` - Public read access
- `Users can create activities for own profile` - Only for own user_id
- `Users can update own activities` - Only own activities

## Testing

1. **Sign Up:**
   - Go to `/signup`
   - Enter name, email, password
   - Profile is automatically created

2. **Login:**
   - Go to `/login`
   - Enter email and password
   - Access dashboard

3. **Submit Distribution:**
   - Only your own profile appears in form
   - Can only submit for yourself

4. **View Others:**
   - Can view all users in leaderboard
   - Can view any user's profile
   - Cannot edit others' data

## Troubleshooting

### "You can only update your own distribution data"
- This means you're trying to edit someone else's data
- Make sure you're logged in with the correct account
- Check that your profile is properly linked

### "Profile not found"
- User is logged in but no profile exists
- This shouldn't happen if signup worked correctly
- Can manually create profile via SQL if needed

### RLS Policy Errors
- Check that `schema_with_auth.sql` was run completely
- Verify policies exist in Supabase dashboard
- Check that `auth_user_id` column exists

## Security Notes

- Passwords are hashed by Supabase Auth
- RLS policies enforce data access at database level
- No delete operations are allowed
- Each user can only modify their own data

## Future Enhancements

- Password reset functionality
- Email verification
- Profile photo upload
- Admin role for managing users

