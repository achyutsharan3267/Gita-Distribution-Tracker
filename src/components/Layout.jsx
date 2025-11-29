import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { useState, useRef, useEffect } from 'react';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/users', label: 'Devotees', icon: '👥' },
    ...(isAdmin ? [{ path: '/admin', label: 'Admin', icon: '🔐' }] : []),
  ];

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <span className="text-xl sm:text-2xl flex-shrink-0">🕉️</span>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-spiritual-700 truncate">
                <span className="hidden sm:inline">Gita Distribution Tracker</span>
                <span className="sm:hidden">Gita Tracker</span>
              </h1>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 lg:px-4 py-2 rounded-lg transition-colors text-sm lg:text-base ${
                      location.pathname === item.path
                        ? 'bg-spiritual-600 text-white'
                        : 'text-gray-700 hover:bg-spiritual-100'
                    }`}
                  >
                    <span className="mr-1 lg:mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </nav>
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-spiritual-500"
                  >
                    <img
                      src={currentUserProfile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=a855f7&color=fff&size=128`}
                      alt={currentUserProfile?.name || user.email}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-spiritual-300 object-cover flex-shrink-0"
                    />
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[120px]">
                        {currentUserProfile?.name || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs text-gray-500 truncate max-w-[120px]">
                        {user.email}
                      </p>
                    </div>
                    <svg
                      className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-500 transition-transform flex-shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* User Menu Dropdown */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {currentUserProfile?.name || user.email?.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/edit-profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-spiritual-50 transition-colors"
                        >
                          <span className="mr-3">👤</span>
                          Edit Profile
                        </Link>
                        <Link
                          to="/form"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-spiritual-50 transition-colors"
                        >
                          <span className="mr-3">📝</span>
                          Submit Daily Distribution
                        </Link>
                        {currentUserProfile && (
                          <Link
                            to={`/user/${currentUserProfile.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-spiritual-50 transition-colors"
                          >
                            <span className="mr-3">📊</span>
                            My Profile
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-spiritual-50 transition-colors"
                          >
                            <span className="mr-3">🔐</span>
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-200 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <span className="mr-3">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    to="/login"
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-spiritual-600 hover:bg-spiritual-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium whitespace-nowrap"
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
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

