import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
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
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

