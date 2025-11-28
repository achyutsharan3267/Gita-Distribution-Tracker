import { supabase } from '../lib/supabase';

/**
 * Upload profile photo to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
export const uploadProfilePhoto = async (file, userId) => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Validate file size (max 150 KB)
    const maxSize = 150 * 1024; // 150 KB in bytes
    if (file.size > maxSize) {
      const fileSizeKB = (file.size / 1024).toFixed(2);
      throw new Error(`Image size is ${fileSizeKB} KB. Maximum allowed size is 150 KB. Please compress your image.`);
    }

    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

/**
 * Delete old profile photo from storage
 * @param {string} photoUrl - URL of the photo to delete
 */
export const deleteProfilePhoto = async (photoUrl) => {
  try {
    // Extract path from URL
    if (!photoUrl || !photoUrl.includes('profile-photos')) {
      return; // Not a storage URL, skip deletion
    }

    const urlParts = photoUrl.split('/');
    const pathIndex = urlParts.findIndex(part => part === 'profile-photos');
    if (pathIndex === -1) return;

    const path = urlParts.slice(pathIndex + 1).join('/');

    // Delete from storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([path]);

    if (error) {
      console.error('Error deleting old photo:', error);
      // Don't throw - it's okay if old photo deletion fails
    }
  } catch (error) {
    console.error('Error in deleteProfilePhoto:', error);
    // Don't throw - it's okay if deletion fails
  }
};

