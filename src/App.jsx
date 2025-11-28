import { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import UserProfile from './pages/UserProfile';
import DistributionForm from './pages/DistributionForm';
import EditProfile from './pages/EditProfile';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';

function AppContent() {
  const initialize = useStore((state) => state.initialize);
  const cleanupRealtimeSubscriptions = useStore((state) => state.cleanupRealtimeSubscriptions);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const { loading: authLoading, user } = useAuth();
  const initializedRef = useRef(false);
  const lastUserIdRef = useRef(null);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [cleanupRealtimeSubscriptions]);

  useEffect(() => {
    // Only initialize once auth is loaded and user state is stable
    if (authLoading) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }
    
    // Check if we need to re-initialize (user changed or first time)
    const currentUserId = user?.id || null;
    const shouldInitialize = 
      !initializedRef.current || 
      lastUserIdRef.current !== currentUserId;

    if (shouldInitialize) {
      console.log('🔄 Initializing store...', { currentUserId, wasInitialized: initializedRef.current });
      initializedRef.current = true;
      lastUserIdRef.current = currentUserId;
      
      // Reset loading state before initializing to prevent stuck state
      useStore.setState({ loading: false });
      
      // Small delay to ensure state is reset
      setTimeout(() => {
        initialize(currentUserId).catch((err) => {
          console.error('❌ Initialization error:', err);
          // Set error state so user can see what went wrong
          useStore.setState({ 
            error: err.message || 'Failed to load data', 
            loading: false 
          });
        });
      }, 100);
    } else {
      console.log('✅ Already initialized for this user, skipping...');
    }
  }, [authLoading, user?.id]); // Only depend on authLoading and user.id, not the whole user object

  // Timeout fallback - if loading takes too long, show error
  useEffect(() => {
    if (loading && !authLoading) {
      const timeout = setTimeout(() => {
        console.warn('Loading timeout - forcing stop');
        useStore.setState({ 
          loading: false, 
          error: 'Connection timeout. Please check your internet connection and Supabase configuration.' 
        });
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [loading, authLoading]);

  // Show loading only if auth is still loading OR store is loading
  // But allow app to proceed if auth is done (even if store has error)
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🕉️</div>
          <p className="text-xl text-gray-700 font-semibold">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication</p>
        </div>
      </div>
    );
  }

  // If store is loading but auth is done, show loading with option to proceed
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50 px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4 animate-bounce">🕉️</div>
          <p className="text-xl text-gray-700 font-semibold">Loading data...</p>
          <p className="text-sm text-gray-500 mt-2 mb-4">Connecting to database</p>
          <button
            onClick={() => {
              useStore.setState({ loading: false, error: null });
            }}
            className="btn-secondary text-sm"
          >
            Skip Loading
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">
            Please check your Supabase configuration in the .env file
          </p>
          <button
            onClick={() => initialize()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          {/* Public routes - no login required */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserList />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          {/* Protected routes - login required */}
          <Route path="/form" element={<ProtectedRoute><DistributionForm /></ProtectedRoute>} />
          <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

