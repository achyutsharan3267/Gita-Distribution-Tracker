import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const initialize = useStore((state) => state.initialize);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error, data } = await signIn(email, password);

    if (error) {
      // Check if error is about pending approval
      let errorMessage = error.message;
      if (error.message?.includes('pending admin approval') || 
          error.message?.includes('pending approval')) {
        errorMessage = 'Your approval is pending. Please try after some time.';
        toast.warning('Approval pending. Please try after some time.', {
          position: "top-right",
          autoClose: 5000,
        });
      } else if (error.message?.includes('rejected')) {
        toast.error('Your account has been rejected. Please contact admin.', {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.error(error.message, {
          position: "top-right",
          autoClose: 4000,
        });
      }
      setError(errorMessage);
      setLoading(false);
    } else {
      // Wait for store to initialize before redirecting
      if (data?.user?.id) {
        try {
          await initialize(data.user.id);
          // Small delay to ensure everything is loaded
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 500);
        } catch (err) {
          console.error('Initialization error:', err);
          // Still redirect even if initialization fails
          navigate('/', { replace: true });
        }
      } else {
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <div className=" flex items-center justify-center py-4 sm:py-8">
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
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">Hare Krishna</h1>
          <p className="text-xs sm:text-sm text-gray-600">Sign in to your account</p>
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
                Email Address
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
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

