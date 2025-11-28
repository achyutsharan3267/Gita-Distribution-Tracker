# How to Add Admin User - Step by Step

## Step 1: Find Your Auth User ID

1. **Supabase Dashboard** खोलें: https://app.supabase.com
2. **Authentication** → **Users** पर जाएं
3. अपना user account find करें
4. **User UID** copy करें (यह एक UUID है, जैसे: `123e4567-e89b-12d3-a456-426614174000`)

## Step 2: Run Admin Schema (अगर नहीं किया है)

1. Supabase Dashboard → **SQL Editor**
2. `database/add_admin_role.sql` file open करें
3. Copy करके SQL Editor में paste करें
4. **Run** button click करें

## Step 3: Add Admin User

### Option 1: Use SQL File (Easy)

1. `database/add_first_admin.sql` file open करें
2. `YOUR-AUTH-USER-ID-HERE` को अपने actual User UID से replace करें
3. `your-email@example.com` को अपने actual email से replace करें
4. Supabase SQL Editor में paste करें
5. **Run** करें

### Option 2: Direct SQL (Quick)

Supabase SQL Editor में यह run करें:

```sql
-- Replace these values:
-- 1. 'YOUR-AUTH-USER-ID-HERE' → Your actual User UID from Step 1
-- 2. 'your-email@example.com' → Your actual email

INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');
```

## Step 4: Verify Admin Added

```sql
SELECT * FROM admin_users;
```

यह query run करें - आपको अपना admin record दिखना चाहिए।

## Step 5: Test Admin Access

1. App में login करें (admin account से)
2. Navigation में **"Admin"** link दिखना चाहिए
3. `/admin` route पर जाएं
4. Admin Dashboard दिखना चाहिए

## Example:

अगर आपका:
- **User UID**: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- **Email**: `admin@example.com`

तो INSERT statement होगा:

```sql
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@example.com');
```

## Troubleshooting:

### Error: "relation admin_users does not exist"
- **Solution**: पहले `add_admin_role.sql` run करें

### Error: "duplicate key value violates unique constraint"
- **Solution**: Admin already exists, check with `SELECT * FROM admin_users;`

### Admin link नहीं दिख रहा
- **Solution**: 
  1. Logout करें
  2. Login करें
  3. Page refresh करें

### Cannot access /admin
- **Solution**: 
  1. Verify admin_users table में आपका record है
  2. auth_user_id सही है या नहीं check करें
  3. Browser console में errors check करें

## Quick Reference:

**Files:**
- `database/add_admin_role.sql` - Admin schema (पहले run करें)
- `database/add_first_admin.sql` - Admin add करने के लिए template

**SQL Editor Location:**
- Supabase Dashboard → SQL Editor → New Query

