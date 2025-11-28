# Profile Photo Upload Setup Guide

## Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `profile-photos`
   - **Public bucket**: ✅ Enable (check this)
4. Click **"Create bucket"**

## Step 2: Set Up Storage Policies

Run the SQL from `database/storage_setup.sql` in Supabase SQL Editor:

```sql
-- This will create all necessary policies for photo uploads
```

Or manually set up policies in Dashboard:
1. Go to **Storage** → **Policies** → `profile-photos`
2. Create these policies:

### Policy 1: Upload (INSERT)
- Policy name: `Users can upload own profile photo`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'profile-photos'`
- WITH CHECK expression: `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

### Policy 2: Update
- Policy name: `Users can update own profile photo`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`
- WITH CHECK expression: `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

### Policy 3: View (SELECT)
- Policy name: `Anyone can view profile photos`
- Allowed operation: `SELECT`
- Target roles: `public`
- USING expression: `bucket_id = 'profile-photos'`

### Policy 4: Delete
- Policy name: `Users can delete own profile photo`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression: `bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text`

## Step 3: Test Photo Upload

1. Sign up or log in to the app
2. Go to **Edit Profile** page
3. Click on photo area and select an image
4. Upload should work!

## Features

✅ **Signup**: Upload photo during account creation
✅ **Edit Profile**: Update photo anytime
✅ **Automatic Cleanup**: Old photos are deleted when new one is uploaded
✅ **File Validation**: Max 5MB, images only
✅ **Secure**: Users can only upload/delete their own photos
✅ **Public Access**: Anyone can view photos (for leaderboard)

## File Structure in Storage

Photos are stored as:
```
profile-photos/
  └── {user-id}/
      └── {timestamp}.{ext}
```

Example:
```
profile-photos/
  └── 123e4567-e89b-12d3-a456-426614174000/
      └── 1704067200000.jpg
```

## Troubleshooting

### "Bucket not found" error
- Make sure bucket `profile-photos` exists
- Check bucket name is exactly `profile-photos`

### "Policy violation" error
- Run `database/storage_setup.sql` again
- Check policies in Storage → Policies

### Photo not uploading
- Check file size (must be < 5MB)
- Check file type (must be image)
- Check browser console for errors

### Photo not displaying
- Check bucket is set to **Public**
- Check photo URL is correct
- Check CORS settings in Supabase

## Manual Bucket Creation (Alternative)

If SQL doesn't work, create bucket manually:
1. Storage → New bucket
2. Name: `profile-photos`
3. Public: ✅ Yes
4. File size limit: 5 MB
5. Allowed MIME types: `image/*`

