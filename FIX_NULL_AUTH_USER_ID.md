# Fix NULL auth_user_id Issue

## Problem:
`auth_user_id` column में NULL दिख रहा है

## Solutions:

### Step 1: Check Current Data

Supabase SQL Editor में यह run करें:

```sql
SELECT * FROM admin_users;
```

यह देखें:
- क्या कोई record है?
- `auth_user_id` NULL है या नहीं?
- `email` क्या है?

### Step 2: Find Your Auth User ID

1. Supabase Dashboard → **Authentication** → **Users**
2. अपना user find करें
3. **User UID** copy करें (UUID format)

### Step 3: Fix Based on Situation

#### Situation A: Record exists but auth_user_id is NULL

```sql
-- Replace values:
-- 'YOUR-AUTH-USER-ID' → Your actual User UID
-- 'your-email@example.com' → Email from the record

UPDATE admin_users 
SET auth_user_id = 'YOUR-AUTH-USER-ID'
WHERE email = 'your-email@example.com';
```

#### Situation B: No record exists

```sql
-- Replace values:
-- 'YOUR-AUTH-USER-ID' → Your actual User UID  
-- 'your-email@example.com' → Your email

INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID', 'your-email@example.com');
```

#### Situation C: Wrong record, want to delete and re-insert

```sql
-- First delete
DELETE FROM admin_users WHERE email = 'wrong-email@example.com';

-- Then insert correct one
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID', 'your-email@example.com');
```

### Step 4: Verify Fix

```sql
SELECT * FROM admin_users;
```

अब `auth_user_id` NULL नहीं होना चाहिए।

## Example:

अगर:
- **Your User UID**: `76d3048a-2b58-4374-bb1f-cd1fb3f4ab2b`
- **Your Email**: `admin@example.com`
- **Current record has NULL auth_user_id**

तो:

```sql
UPDATE admin_users 
SET auth_user_id = '76d3048a-2b58-4374-bb1f-cd1fb3f4ab2b'
WHERE email = 'admin@example.com';
```

## After Fix:

1. App में logout करें
2. Login करें
3. Navigation में "Admin" link check करें
4. `/admin` route पर जाएं

## Troubleshooting:

### Still showing NULL after UPDATE
- Check User UID सही है या नहीं
- Verify email match हो रहा है या नहीं
- Run `SELECT * FROM admin_users;` to verify

### Admin link still not showing
- Logout और login करें
- Page refresh करें
- Browser console check करें

