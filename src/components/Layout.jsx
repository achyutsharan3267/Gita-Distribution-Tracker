import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'Devotees', icon: '👥' },
    // Only show protected routes if user is logged in
    ...(user ? [
      { path: '/form', label: 'Submit Form', icon: '📝' },
      { path: '/edit-profile', label: 'Edit Profile', icon: '👤' },
    ] : []),
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: '🔐' }] : []),
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl">🕉️</span>
              <h1 className="text-xl font-bold text-spiritual-700">
                Gita Distribution Tracker
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-spiritual-600 text-white'
                        : 'text-gray-700 hover:bg-spiritual-100'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {user.email}
                  </span>
                  <button
                    onClick={signOut}
                    className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm bg-spiritual-600 hover:bg-spiritual-700 text-white rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        <nav className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-spiritual-600 text-white'
                    : 'text-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-600 text-sm">
            🕉️ Serving the Lord through book distribution 🕉️
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

