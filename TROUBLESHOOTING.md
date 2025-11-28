# Troubleshooting Guide - "Connecting to database" Issue

## Quick Checks

### 1. Check Browser Console
Open browser DevTools (F12) and check Console tab for errors:
- Red errors = Database connection issues
- Yellow warnings = Configuration issues

### 2. Verify .env File
Make sure `.env` file exists in project root with:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key-here
```

### 3. Check Supabase Connection
In browser console, type:
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```
Should show your Supabase URL (not undefined)

## Common Issues

### Issue 1: .env File Not Found
**Solution:**
1. Create `.env` file in project root
2. Add your Supabase credentials
3. **Restart dev server** (important!)

### Issue 2: Database Tables Don't Exist
**Solution:**
1. Go to Supabase Dashboard → SQL Editor
2. Run `database/schema.sql` or `database/complete_auth_setup.sql`
3. Verify tables exist in Table Editor

### Issue 3: RLS Policies Blocking
**Solution:**
1. Run `database/complete_fix.sql` in SQL Editor
2. Or temporarily disable RLS:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
```

### Issue 4: Network/CORS Issues
**Solution:**
1. Check internet connection
2. Check Supabase project is active (not paused)
3. Check browser console for CORS errors

## Debug Steps

1. **Check Console Logs:**
   - Look for "Fetching users from database..."
   - Look for "Loaded X users"
   - Look for any error messages

2. **Test Supabase Connection:**
   ```javascript
   // In browser console
   import { supabase } from './lib/supabase';
   supabase.from('users').select('count').then(console.log);
   ```

3. **Check Network Tab:**
   - Open DevTools → Network
   - Look for failed requests to Supabase
   - Check request URLs and status codes

## Quick Fix: Skip Loading

If stuck, click "Skip Loading" button to proceed with empty state, then:
1. Check error message
2. Fix the issue
3. Click "Retry" button

## Still Stuck?

1. Check Supabase Dashboard → Logs for errors
2. Verify API keys are correct
3. Check if project is paused
4. Try creating a new Supabase project

