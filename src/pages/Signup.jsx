import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { uploadProfilePhoto } from '../utils/storage';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [other, setOther] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(null); // 'approved' or 'pending'
  const { signUp } = useAuth();
  const { addUser } = useStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!other) {
      setError('Please select your Bace location');
      return;
    }

    setLoading(true);

    // Sign up user
    const { data: authData, error: authError } = await signUp(email, password, name);

    if (authError) {
      // Better error message for "User already registered"
      let errorMessage = authError.message;
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already exists') ||
          authError.message?.includes('User already registered')) {
        errorMessage = 'User already exists. Please try logging in instead, or use a different email.';
        toast.error('User already exists! Please login or use a different email.', {
          position: "top-right",
          autoClose: 5000,
        });
      }
      setError(errorMessage);
      setLoading(false);
      return;
    }

      // Upload photo if provided
      let photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=a855f7&color=fff&size=128`;
      
      if (photo) {
        try {
          photoUrl = await uploadProfilePhoto(photo, authData.user.id);
        } catch (uploadError) {
          console.error('Photo upload failed:', uploadError);
          // Continue with default avatar if upload fails
        }
      }

      // Create user profile in database
    try {
      await addUser({
        name,
        email: email, // Store email in user profile
        city: city || null,
        mobileNumber: mobileNumber.trim() || null,
        other: other || null,
        photo: photoUrl,
        hindiGita: 0,
        englishGita: 0,
        smallBooks: 0,
        bhagavatam: 0,
        chaitanyaCharitamrita: 0,
        otherBooks: 0,
        totalMoney: 0,
      }, authData.user.id);

      // Check if user was approved or is pending
      // Get the created user to check approval_status
      let isApproved = false;
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('approval_status')
          .eq('auth_user_id', authData.user.id)
          .single();
        
        isApproved = userData?.approval_status === 'approved';
      } catch (err) {
        console.log('Could not check approval status:', err);
        // Default to pending if can't check
        isApproved = false;
      }

      setLoading(false);
      
      if (isApproved) {
        // Auto-approved, show success and redirect
        setSignupSuccess(true);
        setApprovalStatus('approved');
        toast.success('Account created successfully! Redirecting to dashboard...', {
          position: "top-right",
          autoClose: 2000,
        });
        // Redirect after showing message
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      } else {
        // Pending approval - sign out FIRST before showing success screen
        // This prevents auth state changes from triggering re-renders
        try {
          await supabase.auth.signOut();
          // Wait a bit for signout to complete
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (signOutError) {
          console.error('Sign out error:', signOutError);
          // Continue anyway
        }
        
        // Now show success message on page
        setSignupSuccess(true);
        setApprovalStatus('pending');
        toast.success('Account created successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
        // Redirect to login after showing message (longer delay so user can read)
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 6000);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Account created but profile setup failed. Please contact admin.');
      setLoading(false);
    }
  };

  // Show success message if signup was successful
  if (signupSuccess) {
    return (
      <div className="flex items-center justify-center py-4 sm:py-8 min-h-screen bg-gradient-to-br from-spiritual-50 to-primary-50">
        <div className="max-w-md w-full px-4">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-4xl">✅</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Account Created Successfully!
            </h1>
          </div>

          <div className="card p-6 shadow-lg">
            {approvalStatus === 'approved' ? (
              <div className="text-center space-y-4">
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-semibold text-lg mb-2">
                    🎉 Account Approved!
                  </p>
                  <p className="text-green-700 text-sm">
                    Your account has been approved! You can now access all features.
                  </p>
                </div>
                <p className="text-sm text-gray-600 animate-pulse">
                  Redirecting to dashboard...
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-5">
                  <div className="flex items-center justify-center mb-3">
                    <span className="text-4xl animate-bounce">⏳</span>
                  </div>
                  <p className="text-yellow-900 font-bold text-xl mb-3">
                    Approval Pending
                  </p>
                  <div className="space-y-2 text-left">
                    <p className="text-yellow-800 text-sm font-medium">
                      ✅ Your account has been created successfully!
                    </p>
                    <p className="text-yellow-700 text-sm">
                      ⏳ Your account is waiting for admin approval.
                    </p>
                    <p className="text-yellow-600 text-xs mt-3 pt-3 border-t border-yellow-200">
                      <strong>What happens next?</strong><br />
                      • Admin will review your account<br />
                      • You'll be able to login once approved<br />
                      • Please check back later
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Redirecting to login page in a few seconds...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-4 sm:py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-4 sm:mb-6">
          <img 
            src="/prabhupada-loading.png" 
            alt="Srila Prabhupada" 
            className="w-24 h-24 sm:w-40 sm:h-40 mx-auto mb-3 sm:mb-4 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
              const fallback = e.target.nextElementSibling;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="text-5xl mb-4 hidden">🕉️</div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Create Account</h1>
          <p className="text-xs sm:text-sm text-gray-600">Join the distribution service</p>
        </div>

        <div className="card p-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bace *
              </label>
              <select
                value={other}
                onChange={(e) => setOther(e.target.value)}
                className="input-field"
                required
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo (Optional)
              </label>
              <div className="space-y-3">
                {photoPreview && (
                  <div className="flex justify-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    />
                  </div>
                )}
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
                      e.target.value = ''; // Clear file input
                      return;
                    }
                    setPhoto(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setPhotoPreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                  className="input-field text-sm"
                />
                <p className="text-xs text-gray-500">
                  Max size: 150 KB. Supported formats: JPG, PNG, WebP
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="input-field"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

