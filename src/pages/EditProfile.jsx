import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/storage';
import { supabase } from '../lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const initialize = useStore((state) => state.initialize);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUserProfile) {
      setName(currentUserProfile.name || '');
      setCity(currentUserProfile.city || '');
      setPhotoPreview(currentUserProfile.photo || null);
    }
  }, [currentUserProfile]);

  if (!currentUserProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let photoUrl = currentUserProfile.photo;

      // Upload new photo if provided
      if (photo) {
        try {
          // Delete old photo if it's from storage
          if (currentUserProfile.photo && currentUserProfile.photo.includes('profile-photos')) {
            await deleteProfilePhoto(currentUserProfile.photo);
          }
          
          photoUrl = await uploadProfilePhoto(photo, user.id);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          setError('Failed to upload photo. Please try again.');
          setLoading(false);
          return;
        }
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          city: city.trim() || null,
          photo: photoUrl,
        })
        .eq('id', currentUserProfile.id);

      if (updateError) throw updateError;

      // Refresh store
      await initialize(user.id);

      alert('Profile updated successfully! 🙏');
      navigate('/');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-spiritual-800 mb-2">
          Edit Profile
        </h1>
        <p className="text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </label>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={photoPreview || currentUserProfile.photo}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-spiritual-200 shadow-lg"
              />
            </div>
            <div className="w-full">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate file size (150 KB max)
                    const maxSize = 150 * 1024; // 150 KB in bytes
                    if (file.size > maxSize) {
                      const fileSizeKB = (file.size / 1024).toFixed(2);
                      setError(`Image size is ${fileSizeKB} KB. Maximum allowed size is 150 KB. Please compress your image.`);
                      return;
                    }
                    setPhoto(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                    setError('');
                  }
                }}
                className="input-field text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max size: 150 KB. Supported: JPG, PNG, WebP
              </p>
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input-field"
            placeholder="Your Name"
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City (Optional)
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input-field"
            placeholder="Your City"
          />
        </div>

        {/* Current Stats (Read-only) */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Current Stats</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center bg-spiritual-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-spiritual-600">{currentUserProfile.hindiGita}</p>
              <p className="text-xs text-gray-600">Hindi Gita</p>
            </div>
            <div className="text-center bg-primary-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-primary-600">{currentUserProfile.englishGita}</p>
              <p className="text-xs text-gray-600">English Gita</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-600">{currentUserProfile.smallBooks}</p>
              <p className="text-xs text-gray-600">Small Books</p>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-600">
                ₹{currentUserProfile.totalMoney.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Money</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : '💾 Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 text-lg py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

