import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/storage';
import { supabase } from '../lib/supabase';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const initialize = useStore((state) => state.initialize);
  const getCurrentUserProfile = useStore((state) => state.getCurrentUserProfile);
  const loading = useStore((state) => state.loading);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load profile if not available
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      // If currentUserProfile is not loaded, try to load it
      if (!currentUserProfile && !profileLoading) {
        setProfileLoading(true);
        try {
          const profile = await getCurrentUserProfile(user.id);
          if (profile) {
            // Update store with profile
            useStore.setState({ currentUserProfile: profile });
          }
        } catch (err) {
          console.error('Error loading profile:', err);
          setError('Failed to load profile. Please refresh the page.');
        } finally {
          setProfileLoading(false);
        }
      }
    };

    if (!authLoading && user?.id) {
      loadProfile();
    }
  }, [user?.id, currentUserProfile, authLoading, getCurrentUserProfile, profileLoading]);

  useEffect(() => {
    if (currentUserProfile) {
      setName(currentUserProfile.name || '');
      setCity(currentUserProfile.city || '');
      setMobileNumber(currentUserProfile.mobileNumber || '');
      setPhotoPreview(currentUserProfile.photo || null);
    }
  }, [currentUserProfile]);

  // Show loading state
  if (authLoading || loading || profileLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4 animate-bounce">🕉️</div>
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  // Show error if no profile found after loading
  if (!currentUserProfile && !profileLoading && !loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
        <p className="text-gray-600 mb-6">
          Your profile could not be loaded. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!currentUserProfile || !currentUserProfile.id) {
        throw new Error('Profile not loaded. Please refresh the page.');
      }

      if (!user?.id) {
        throw new Error('User not authenticated. Please login again.');
      }

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
          setIsSubmitting(false);
          return;
        }
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          city: city.trim() || null,
          mobile_number: mobileNumber.trim() || null,
          photo: photoUrl,
        })
        .eq('id', currentUserProfile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      // Refresh store
      await initialize(user.id);

      alert('Profile updated successfully! 🙏');
      navigate('/');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
          Edit Profile
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6 p-4 sm:p-6">
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

        {/* Mobile Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number (Optional)
          </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            className="input-field"
            placeholder="+91 9876543210"
            pattern="[0-9+\s-]*"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter your mobile/phone number
          </p>
        </div>

        {/* Current Stats (Read-only) */}
        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Your Current Stats</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center bg-spiritual-50 rounded-lg p-2 sm:p-3">
              <p className="text-xl sm:text-2xl font-bold text-spiritual-600">{currentUserProfile.hindiGita}</p>
              <p className="text-xs text-gray-600">Hindi Gita</p>
            </div>
            <div className="text-center bg-primary-50 rounded-lg p-2 sm:p-3">
              <p className="text-xl sm:text-2xl font-bold text-primary-600">{currentUserProfile.englishGita}</p>
              <p className="text-xs text-gray-600">English Gita</p>
            </div>
            <div className="text-center bg-green-50 rounded-lg p-2 sm:p-3">
              <p className="text-xl sm:text-2xl font-bold text-green-600">{currentUserProfile.smallBooks}</p>
              <p className="text-xs text-gray-600">Small Books</p>
            </div>
            <div className="text-center bg-purple-50 rounded-lg p-2 sm:p-3">
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                ₹{currentUserProfile.totalMoney.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Money</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !currentUserProfile}
            className="btn-primary flex-1 text-base sm:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : '💾 Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 text-base sm:text-lg py-2.5 sm:py-3"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

