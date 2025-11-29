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
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/users', label: 'Devotees', icon: '👥' },
    { path: '/books-prices', label: 'Books', icon: '📚' },
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
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 flex-1">
              <Link to="/" className="flex items-center space-x-2">
                <span className="text-xl">🕉️</span>
                <h1 className="text-lg font-semibold text-gray-900">
                  Gita Tracker
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              {user ? (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <img
                      src={currentUserProfile?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=22c55e&color=fff&size=128`}
                      alt={currentUserProfile?.name || user.email}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-gray-200 object-cover flex-shrink-0"
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
                    <>
                      {/* Backdrop overlay for mobile */}
                      <div 
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setShowUserMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                        <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {currentUserProfile?.name || user.email?.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>
                      
                      <div className="py-1 bg-white">
                        <Link
                          to="/edit-profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 rounded-lg mx-2 font-medium"
                        >
                          <span className="mr-3">👤</span>
                          Edit Profile
                        </Link>
                        <Link
                          to="/form"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 rounded-lg mx-2 font-medium"
                        >
                          <span className="mr-3">📝</span>
                          Submit Daily Distribution
                        </Link>
                        {currentUserProfile && (
                          <Link
                            to={`/user/${currentUserProfile.id}`}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 rounded-lg mx-2 font-medium"
                          >
                            <span className="mr-3">📊</span>
                            My Profile
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 rounded-lg mx-2 font-medium"
                          >
                            <span className="mr-3">🔐</span>
                            Admin Dashboard
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-200 py-1 bg-white rounded-b-2xl">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 transition-all duration-150 rounded-lg mx-2 font-medium"
                        >
                          <span className="mr-3">🚪</span>
                          Logout
                        </button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-2xl transition-all duration-200 font-semibold whitespace-nowrap"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 active:bg-gray-950 text-white rounded-2xl transition-all duration-200 font-semibold whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:hidden safe-area-inset-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.slice(0, 2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                location.pathname === item.path
                  ? 'text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
          {/* Add Button - Center */}
          {user && (
            <Link
              to="/form"
              className="flex items-center justify-center w-12 h-12 -mt-4 bg-primary-600 rounded-full shadow-md text-white text-xl transition-transform active:scale-95"
            >
              <span className="text-2xl">➕</span>
            </Link>
          )}
          {navItems.slice(2).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                location.pathname === item.path
                  ? 'text-primary-600'
                  : 'text-gray-500'
              }`}
            >
              <span className="text-2xl mb-0.5">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;

