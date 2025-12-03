import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import ProtectedRoute from './ProtectedRoute';
import { useEffect, useState } from 'react';

const AdminRoute = ({ children }) => {
  const { isAdmin: isAdminFromAuth, loading: authLoading, user } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const storeLoading = useStore((state) => state.loading);
  // Use isAdmin from profile if available, otherwise use from AuthContext
  const isAdmin = currentUserProfile?.isAdmin || isAdminFromAuth;
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  // Wait for both auth and store to be ready before checking admin status
  useEffect(() => {
    if (!authLoading && !storeLoading) {
      // Give a small delay to ensure admin check has completed
      const timer = setTimeout(() => {
        setAdminCheckComplete(true);
      }, 300);
      return () => clearTimeout(timer);
    } else if (!user) {
      // If no user, we can proceed immediately
      setAdminCheckComplete(true);
    }
  }, [authLoading, storeLoading, user, currentUserProfile?.isAdmin]);

  return (
    <ProtectedRoute>
      {authLoading || !adminCheckComplete ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50">
          <div className="text-center max-w-md px-4">
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
            <p className="text-lg text-gray-700 font-medium italic leading-relaxed">
              "Everything will come in due course of time. Be patient and continue your Krishna consciousness sincerely."
            </p>
          </div>
        </div>
      ) : isAdmin ? (
        children
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="text-6xl mb-4">🚫</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access this page. Admin access required.
            </p>
            <Navigate to="/" replace />
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default AdminRoute;

