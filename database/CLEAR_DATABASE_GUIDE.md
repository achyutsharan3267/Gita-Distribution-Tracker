# Database Clear Guide

## Complete Database Reset for Production

This guide will help you completely clear all test data from your database before going live with real users.

---

## ⚠️ WARNING

**This will delete ALL data from:**
- All users/devotees
- All activities/distributions
- All books
- All admin users
- All book distributions

**Table structure will remain intact** - only data will be deleted.

---

## Step 1: Clear Database Tables

1. Open **Supabase Dashboard** → **SQL Editor**
2. Open the file: `database/clear_all_data.sql`
3. Copy and paste the entire script
4. Click **Run** or press `Ctrl+Enter`

This will delete all data from:
- `book_distributions`
- `activities`
- `users`
- `admin_users`
- `books`

---

## Step 2: Clear Storage (Profile Photos)

1. Go to **Supabase Dashboard** → **Storage**
2. Click on **`profile-photos`** bucket
3. Select all files/folders (or use the "Select All" option)
4. Click **Delete** button
5. Confirm deletion

---

## Step 3: Clear Auth Users (⚠️ IMPORTANT!)

**⚠️ CRITICAL:** You MUST clear auth users to avoid "User already registered" errors!

If you don't clear `auth.users`, users won't be able to sign up with the same email again.

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Select all users (or specific test users)
3. Click **Delete** button
4. Confirm deletion

**Note:** 
- After clearing auth users, they will need to sign up again
- Old passwords will be lost - users will need to create new accounts
- If you skip this step, you'll get "User already registered" errors during signup

---

## Step 4: Verify Everything is Cleared

Run these queries in SQL Editor to verify:

```sql
SELECT COUNT(*) FROM book_distributions; -- Should be 0
SELECT COUNT(*) FROM activities; -- Should be 0
SELECT COUNT(*) FROM users; -- Should be 0
SELECT COUNT(*) FROM admin_users; -- Should be 0
SELECT COUNT(*) FROM books; -- Should be 0
```

---

## Step 5: Re-setup Default Books

After clearing, you need to re-insert default books:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open: `database/create_books_table.sql`
3. Copy and paste the script
4. Click **Run**

This will insert default books:
- Hindi Bhagavad Gita
- English Bhagavad Gita
- Small Books
- Bhagavatam
- Chaitanya Charitamrita
- Other Books

---

## Step 6: Add Your First Admin

1. Sign up with your admin email in the app
2. Note your User UID from **Authentication** → **Users**
3. Go to **SQL Editor** and run:

```sql
-- Replace with your actual email and auth user ID
INSERT INTO admin_users (auth_user_id, email) 
VALUES ('YOUR-AUTH-USER-ID-HERE', 'your-email@example.com');
```

Or use the script: `database/add_first_admin.sql` (update it with your details first)

---

## Step 7: Test Everything

1. Test signup with a new user
2. Test login
3. Test submitting a distribution
4. Test admin features (if you're admin)
5. Verify Dashboard shows correct data

---

## Quick Checklist

- [ ] Run `clear_all_data.sql` in SQL Editor
- [ ] Clear `profile-photos` bucket in Storage
- [ ] (Optional) Delete auth users
- [ ] Verify all tables are empty
- [ ] Re-insert default books (`create_books_table.sql`)
- [ ] Add your admin user
- [ ] Test signup/login
- [ ] Test distribution submission
- [ ] Verify Dashboard

---

## Troubleshooting

### "Foreign key constraint" error
- Make sure you're deleting in the correct order
- The script handles this automatically

### "Permission denied" error
- Make sure you're logged in as the project owner
- Check RLS policies aren't blocking the delete

### Books not showing after re-insert
- Refresh the app
- Check if `is_active = true` for all books
- Verify books table has data: `SELECT * FROM books;`

### Admin features not working
- Verify admin_users table has your entry
- Check your auth_user_id matches
- Try logging out and back in

---

## Need Help?

If something goes wrong:
1. Check Supabase logs in Dashboard
2. Check browser console for errors
3. Verify all SQL scripts ran successfully
4. Make sure table structure is intact (schemas should still exist)

