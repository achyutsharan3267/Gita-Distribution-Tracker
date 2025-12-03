# Database Setup Guide

This folder contains all SQL scripts to set up the database. Run them in order.

## Installation Order

Run these files **one by one** in this exact order:

1. **01_create_users_table.sql** - Creates the main users table
2. **02_add_auth_user_id.sql** - Links users to Supabase Auth
3. **03_create_admin_users_table.sql** - Creates admin users table and functions
4. **04_create_books_table.sql** - Creates books table
5. **05_create_activities_table.sql** - Creates activities/distribution history table
6. **06_create_book_distributions_table.sql** - Creates book distributions table
7. **07_create_sadhna_table.sql** - Creates daily sadhna tracking table
8. **08_create_payments_to_admin_table.sql** - Creates payments to admin table
9. **09_create_app_config_table.sql** - Creates app configuration table
10. **10_add_user_approval_status.sql** - Adds approval status to users
11. **11_add_user_photo_column.sql** - Adds photo column to users table (ONLY if you already created users table without photo)
12. **12_create_helper_functions.sql** - Creates utility functions
13. **13_add_admin_user.sql** - Template to add admin access to users
14. **15_add_user_delete_policy.sql** - Adds DELETE policy for admins to delete users (required for reject functionality)

**Note:** If you're creating a fresh database, the `photo` column is already included in `01_create_users_table.sql`. Only run `11_add_user_photo_column.sql` if you have an existing database without the photo column.

**Real-time Updates:**
- To enable real-time updates, go to Supabase Dashboard → Database → Replication
- Enable Realtime for these tables: `users`, `activities`, `book_distributions`, `payments_to_admin`, `sadhna`, `books`, `admin_users`

## Quick Setup

If you want to run all at once, you can copy all files in order and run them together.

## After Setup

1. Add your first admin user:
   - Use **13_add_admin_user.sql** file
   - Follow the instructions in that file to add admin access
   - Or manually run:
   ```sql
   INSERT INTO admin_users (auth_user_id, email) 
   VALUES ('YOUR-AUTH-USER-ID', 'your-email@example.com');
   ```

2. Add default books (optional):
   - You can add books via the admin dashboard or SQL

3. Test the setup:
   - Try signing up a new user
   - Try logging in
   - Check admin dashboard

## Notes

- All tables have Row Level Security (RLS) enabled
- Foreign keys are properly set up with CASCADE delete
- Indexes are created for performance
- Triggers handle auto-updates for timestamps

