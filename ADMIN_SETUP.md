# Admin Role Setup Guide

## Overview

Admin role allows privileged users to:
- Delete user profiles
- Update any user's profile
- Change user passwords
- Delete activities
- Manage all system data

## Database Setup

### Step 1: Run Admin Schema

1. Go to Supabase Dashboard → **SQL Editor**
2. Run the SQL from `database/add_admin_role.sql`
3. This will:
   - Create `admin_users` table
   - Add admin check functions
   - Update RLS policies to allow admin operations

### Step 2: Add First Admin

After running the schema, add your first admin user:

```sql
-- Replace 'your-auth-user-id-here' with actual auth user ID
-- You can find auth user ID in Supabase Dashboard → Authentication → Users
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('your-auth-user-id-here', 'admin@example.com');
```

**How to find auth user ID:**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Find your user
3. Copy the **User UID** (UUID format)
4. Use it in the INSERT statement above

### Step 3: Verify Admin Access

1. Login with the admin account
2. You should see **Admin** link in navigation
3. Click to access Admin Dashboard

## Admin Features

### User Management
- **View All Users**: See complete list with stats
- **Edit User**: Update name, city, book counts, money
- **Delete User**: Remove user and all their data
- **Change Password**: Update user passwords (requires Supabase Admin API)

### Activity Management
- **Delete Activities**: Remove specific distribution entries
- **Auto-update Totals**: When activity deleted, user totals automatically adjust

### System Stats
- Total users count
- Total books distributed
- Total money collected
- Active devotees count

## Security Notes

### RLS Policies
- Admin operations are protected by Row Level Security
- Only users in `admin_users` table can perform admin actions
- Regular users cannot access admin routes

### Password Updates
- Password updates require Supabase Admin API (service role key)
- For now, use Supabase Dashboard to change passwords
- Future: Can implement with service role key

## Adding More Admins

To add additional admins:

```sql
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('another-user-id', 'another-admin@example.com');
```

## Removing Admin Access

To remove admin access:

```sql
DELETE FROM admin_users 
WHERE auth_user_id = 'user-id-to-remove';
```

## Troubleshooting

### Admin link not showing
- Check if user is in `admin_users` table
- Verify `auth_user_id` matches
- Refresh page after adding admin

### Cannot delete/update users
- Check RLS policies are applied
- Verify admin_users table exists
- Check browser console for errors

### Password update not working
- Password updates require Supabase Admin API
- Use Supabase Dashboard for password changes
- Or implement service role key in backend

## Admin Dashboard Access

- URL: `/admin`
- Protected by `AdminRoute` component
- Only accessible to users with admin role
- Shows "Access Denied" for non-admins

