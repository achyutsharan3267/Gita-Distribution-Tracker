import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';

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
      setError(error.message);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🕉️</div>
          <h1 className="text-4xl font-bold text-spiritual-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your account</p>
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
              className="btn-primary w-full text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link to="/signup" className="text-spiritual-600 hover:text-spiritual-700 font-semibold">
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

