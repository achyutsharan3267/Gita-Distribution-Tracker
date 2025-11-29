import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { uploadProfilePhoto } from '../utils/storage';

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
  const { signUp } = useAuth();
  const { addUser, initialize } = useStore();
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
      setError(authError.message);
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

      // Refresh store to include new user in all lists
      await initialize(authData.user.id);

      // Small delay to ensure everything is loaded before redirecting
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 500);
    } catch (err) {
      setError('Account created but profile setup failed. Please try logging in.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕉️</div>
          <h1 className="text-4xl font-bold text-spiritual-800 mb-2">Create Account</h1>
          <p className="text-gray-600">Join the distribution service</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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
                      className="w-24 h-24 rounded-full object-cover border-2 border-spiritual-300"
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
              className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-spiritual-600 hover:text-spiritual-700 font-semibold">
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

