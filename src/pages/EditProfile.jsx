import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { uploadProfilePhoto, deleteProfilePhoto } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { getBookValue } from '../utils/bookMapping';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const initialize = useStore((state) => state.initialize);
  const getCurrentUserProfile = useStore((state) => state.getCurrentUserProfile);
  const loading = useStore((state) => state.loading);
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [other, setOther] = useState('');
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
      setOther(currentUserProfile.other || '');
      setPhotoPreview(currentUserProfile.photo || null);
    }
  }, [currentUserProfile]);

  // Load books from database on mount
  useEffect(() => {
    const initializeBooks = async () => {
      try {
        await loadBooks();
      } catch (error) {
        console.error('Error loading books:', error);
      }
    };
    
    initializeBooks();
  }, [loadBooks]);

  // Show loading state
  if (authLoading || loading || profileLoading || !user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12 px-4">
        <img 
          src="/prabhupada-loading.png" 
          alt="Srila Prabhupada" 
          className="w-48 h-48 mx-auto mb-6 object-contain animate-pulse"
          onError={(e) => {
            e.target.style.display = 'none';
            const fallback = e.target.nextElementSibling;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
        <div className="text-6xl mb-4 animate-bounce hidden">🕉️</div>
        <p className="text-gray-600 text-lg font-medium italic leading-relaxed">
          "Everything will come in due course of time. Be patient and continue your Krishna consciousness sincerely."
        </p>
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
          other: other || null,
          photo: photoUrl,
        })
        .eq('id', currentUserProfile.id);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message || 'Failed to update profile');
      }

      // Refresh store
      await initialize(user.id);

      toast.success('Profile updated successfully! 🙏', {
        position: "top-right",
        autoClose: 3000,
      });
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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Edit Profile
        </h1>
        <p className="text-sm text-gray-600">Update your profile information</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5 p-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Profile Photo
          </label>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={photoPreview || currentUserProfile.photo}
                alt="Profile"
                className="w-28 h-28 rounded-full object-cover border-2 border-gray-200"
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

        {/* Bace */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bace *
          </label>
          <select
            value={other}
            onChange={(e) => setOther(e.target.value)}
            className="input-field"
          >
            <option value="" disabled>Select your bace</option>
            <option value="Mayapur Dham">Mayapur Dham</option>
            <option value="Govind Dham">Govind Dham</option>
            <option value="Other">Other</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Select your bace (Required)
          </p>
        </div>

        {/* Current Stats (Read-only) */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Your Current Stats</h3>
          {!currentUserProfile ? (
            <p className="text-center text-gray-400 py-4 text-sm italic">
              "Everything will come in due course of time. Be patient and continue your Krishna consciousness sincerely."
            </p>
          ) : books.length === 0 ? (
            <p className="text-center text-gray-400 py-4 text-sm italic">
              "Everything will come in due course of time. Be patient and continue your Krishna consciousness sincerely."
            </p>
          ) : (
            <div className={`grid gap-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-4' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
              {books.map((book) => {
                const bookId = book.id || book.bookId;
                const value = getBookValue(currentUserProfile, bookId);
                return (
                  <div key={bookId} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-lg font-bold text-gray-900">{value || 0}</p>
                    <p className="text-xs text-gray-500 truncate mt-1">{book.name}</p>
                  </div>
                );
              })}
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">
                  ₹{currentUserProfile.totalMoney.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">Total Money</p>
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting || !currentUserProfile}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : '💾 Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;

