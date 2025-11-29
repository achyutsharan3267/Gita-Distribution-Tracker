# User Deletion Setup Guide

## ✅ What's Already Done

1. ✅ Code updated to delete user completely
2. ✅ Login validation added (checks if user profile exists)
3. ✅ Error message added for deleted users

## 🔧 What You Need to Do

### Step 1: Run Database Function in Supabase

1. Go to your Supabase Dashboard
2. Click on **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the following SQL:

```sql
-- Create function to delete auth user
-- This function allows deletion from auth.users table

CREATE OR REPLACE FUNCTION delete_auth_user(user_auth_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = user_auth_id;
  
  -- Return success
  RAISE NOTICE 'Auth user % deleted successfully', user_auth_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
```

5. Click **Run** (or press Ctrl/Cmd + Enter)
6. You should see "Success. No rows returned"

### Step 2: Verify It Works

1. Test by deleting a test user from Admin Dashboard
2. Try to login with that deleted user's credentials
3. You should see: "User account not found. Please sign up again."

## ⚠️ Important Notes

- If the RPC function doesn't work (permissions issue), the user profile will still be deleted
- The auth account might remain, but login will fail with "User account not found"
- User will need to signup again in that case

## 🎯 That's It!

Once you run the SQL function, everything will work automatically. No other steps needed!

