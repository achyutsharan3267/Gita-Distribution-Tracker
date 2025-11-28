import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const AdminRoute = ({ children }) => {
  const { isAdmin, loading } = useAuth();

  return (
    <ProtectedRoute>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🕉️</div>
            <p className="text-xl text-gray-700 font-semibold">Loading...</p>
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

