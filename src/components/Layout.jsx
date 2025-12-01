import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../store/useStore';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import introJs from 'intro.js';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const loadPendingActivities = useStore((state) => state.loadPendingActivities);
  const loadUserActivities = useStore((state) => state.loadUserActivities);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [userNotifications, setUserNotifications] = useState([]);
  const menuRef = useRef(null);
  const notificationRef = useRef(null);

  // Load seen notification IDs from localStorage
  const getSeenNotificationIds = () => {
    try {
      const stored = localStorage.getItem('seenNotificationIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      return new Set();
    }
  };

  // Save seen notification IDs to localStorage
  const saveSeenNotificationIds = (ids) => {
    try {
      localStorage.setItem('seenNotificationIds', JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Error saving seen notifications:', error);
    }
  };

  // Load seen pending notification IDs from localStorage
  const getSeenPendingIds = () => {
    try {
      const stored = localStorage.getItem('seenPendingIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      return new Set();
    }
  };

  // Save seen pending notification IDs to localStorage
  const saveSeenPendingIds = (ids) => {
    try {
      localStorage.setItem('seenPendingIds', JSON.stringify(Array.from(ids)));
    } catch (error) {
      console.error('Error saving seen pending notifications:', error);
    }
  };

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
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showUserMenu || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showNotifications]);

  // Auto-start tour on first visit (optional - can be enabled)
  // useEffect(() => {
  //   if (user && !localStorage.getItem('tourCompleted')) {
  //     // Small delay to ensure DOM is ready
  //     const timer = setTimeout(() => {
  //       startTour();
  //     }, 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [user]);

  // Load pending activities count and notifications for admin
  useEffect(() => {
    if (!user || !isAdmin) return;

    const loadPendingCount = async () => {
      try {
        const activities = await loadPendingActivities();
        const count = activities?.length || 0;
        setPendingCount(count);
        
        if (activities && activities.length > 0) {
          // Get seen pending IDs from localStorage
          const seenPendingIds = getSeenPendingIds();
          
          // Create notifications for ALL pending activities (so admin can see them in dropdown)
          const allNotifications = activities.map(a => ({
            id: `pending-${a.id}`,
            activityId: a.id,
            message: `${a.user?.name || 'A user'} submitted a new activity for ${new Date(a.date).toLocaleDateString()}`,
            date: a.date,
            userName: a.user?.name || 'Unknown',
            type: 'pending'
          }));
          
          // Update notifications list (avoid duplicates)
          setAdminNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.activityId));
            const uniqueNew = allNotifications.filter(n => !existingIds.has(n.activityId));
            const updated = [...uniqueNew, ...prev];
            // Keep only notifications for activities that still exist
            const currentActivityIds = new Set(activities.map(a => a.id));
            return updated.filter(n => currentActivityIds.has(n.activityId)).slice(0, 20);
          });
          
          // Activities are auto-approved now, no pending activities to show
          // Removed pending activities toast since all activities are auto-approved
        } else {
          // No pending activities - clear notifications
          setAdminNotifications([]);
        }
      } catch (error) {
        console.error('Error loading pending count:', error);
      }
    };

    loadPendingCount();
    // Refresh every 10 seconds
    const interval = setInterval(loadPendingCount, 10000);
    return () => clearInterval(interval);
  }, [user, isAdmin, loadPendingActivities]);

  // Check for approved and rejected activities for user
  useEffect(() => {
    if (!user || !currentUserProfile || isAdmin) return;

    const checkActivities = async () => {
      try {
        const activities = await loadUserActivities(currentUserProfile.id, false, true);
        const approvedActivities = activities.filter(a => a.approvalStatus === 'approved');
        const rejectedActivities = activities.filter(a => a.approvalStatus === 'rejected');
        
        // Get seen notification IDs from localStorage
        const seenActivityIds = getSeenNotificationIds();
        
        // Check for truly new approved activities (not yet seen)
        const newApproved = approvedActivities.filter(a => {
          return !seenActivityIds.has(`approved-${a.id}`);
        });
        
        // Check for truly new rejected activities (not yet seen)
        const newRejected = rejectedActivities.filter(a => {
          return !seenActivityIds.has(`rejected-${a.id}`);
        });
        
        // Activities are auto-approved now, no need to notify about approval
        // Removed approval notification toast since all activities are auto-approved
        
        // Handle new rejected activities
        if (newRejected.length > 0) {
          // Mark these as seen and save to localStorage
          const updatedSeenIds = new Set(seenActivityIds);
          newRejected.forEach(a => updatedSeenIds.add(`rejected-${a.id}`));
          saveSeenNotificationIds(updatedSeenIds);
          
          // Show toast for rejected activities
          if (newRejected.length === 1) {
            toast.error(`❌ Your activity from ${new Date(newRejected[0].date).toLocaleDateString()} has been rejected. Please check and resubmit.`, {
              position: "top-right",
              autoClose: 6000,
            });
          } else {
            toast.error(`❌ ${newRejected.length} activities rejected. Please check your profile.`, {
              position: "top-right",
              autoClose: 6000,
            });
          }
          
          // Add new rejected notifications (avoid duplicates)
          const newRejectedNotifications = newRejected.map(a => {
            const totalBooks = a.bookDistributions ? 
              Object.values(a.bookDistributions).reduce((sum, count) => sum + (count || 0), 0) :
              (a.hindiGita || 0) + (a.englishGita || 0) + (a.smallBooks || 0);
            
            return {
              id: `rejected-${a.id}`,
              activityId: a.id,
              message: `❌ Your activity from ${new Date(a.date).toLocaleDateString()} has been rejected. Please check and resubmit. (${totalBooks} books)`,
              date: a.date,
              type: 'rejected'
            };
          });
          
          setUserNotifications(prev => {
            // Avoid duplicates
            const existingIds = new Set(prev.map(n => n.activityId));
            const uniqueNew = newRejectedNotifications.filter(n => !existingIds.has(n.activityId));
            return [...uniqueNew, ...prev].slice(0, 20); // Keep last 20 notifications
          });
        }
      } catch (error) {
        console.error('Error checking activities:', error);
      }
    };

    // Initial load - don't show notifications for old activities
    checkActivities();
    // Check every 15 seconds for new approvals/rejections
    const interval = setInterval(checkActivities, 15000);
    return () => clearInterval(interval);
  }, [user, currentUserProfile, isAdmin, loadUserActivities]);

  const handleLogout = async () => {
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  const startTour = () => {
    console.log('Tour button clicked');
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      const tourSteps = [];
      
      // Helper function to check if element exists
      const elementExists = (selector) => {
        const element = document.querySelector(selector);
        const exists = element !== null;
        if (!exists) {
          console.log(`Element not found: ${selector}`);
        }
        return exists;
      };
      
      // Get current page and add appropriate steps
      const currentPath = location.pathname;
      console.log('Current path:', currentPath);
      
      if (currentPath === '/') {
        // Dashboard tour - Comprehensive
        if (elementExists('.tour-logo')) {
          tourSteps.push({
            element: '.tour-logo',
            intro: '🕉️ Welcome to Gita Tracker! Your dashboard for tracking book distribution and spiritual progress.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-sadhna-status')) {
          tourSteps.push({
            element: '.tour-sadhna-status',
            intro: '📿 Daily Sadhna Status: Check if you\'ve submitted today\'s sadhna. Click to submit or view your rounds.',
            position: 'top'
          });
        }
        if (elementExists('.tour-your-contribution')) {
          tourSteps.push({
            element: '.tour-your-contribution',
            intro: '📊 Your Contribution: See your total books distributed, money collected, rank, and financial summary (Amount as per Books, Donation/Insufficient Funds).',
            position: 'top'
          });
        }
        if (elementExists('.tour-quotes')) {
          tourSteps.push({
            element: '.tour-quotes',
            intro: '💬 Inspirational Quotes: Read Srila Prabhupada\'s teachings about book distribution. Quotes rotate automatically.',
            position: 'top'
          });
        }
        if (elementExists('.tour-top-3')) {
          tourSteps.push({
            element: '.tour-top-3',
            intro: '🏆 Top 3 Distributors: See the leading devotees in book distribution with their photos and stats.',
            position: 'top'
          });
        }
        if (elementExists('.tour-leaderboard')) {
          tourSteps.push({
            element: '.tour-leaderboard',
            intro: '📈 Top 10 Leaderboard: Complete ranking of all devotees. Click on any devotee to view their profile.',
            position: 'top'
          });
        }
        if (elementExists('.tour-active-books')) {
          tourSteps.push({
            element: '.tour-active-books',
            intro: '📚 Active Books: Click here to see all available books, their prices, and descriptions.',
            position: 'top'
          });
        }
        if (elementExists('.tour-notifications')) {
          tourSteps.push({
            element: '.tour-notifications',
            intro: '🔔 Notifications: Get notified when your submissions are approved or when new activities need your attention.',
            position: 'left'
          });
        }
        if (elementExists('.tour-profile-menu')) {
          tourSteps.push({
            element: '.tour-profile-menu',
            intro: '👤 Profile Menu: Access your profile, submit daily distribution, view/edit sadhna, and manage your account.',
            position: 'left'
          });
        }
      } else if (currentPath === '/users') {
        // User List tour
        if (elementExists('.tour-logo')) {
          tourSteps.push({
            element: '.tour-logo',
            intro: '👥 All Devotees: Browse all devotees and their distribution statistics.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-search')) {
          tourSteps.push({
            element: '.tour-search',
            intro: '🔍 Search: Find devotees by name, email, or mobile number. Type to filter results instantly.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-view-toggle')) {
          tourSteps.push({
            element: '.tour-view-toggle',
            intro: '👁️ View Toggle: Switch between Grid View (cards) and List View (table) to see devotees in different formats.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-user-list')) {
          tourSteps.push({
            element: '.tour-user-list',
            intro: '📋 Devotees List: Click on any devotee card to view their detailed profile and activity history.',
            position: 'top'
          });
        }
      } else if (currentPath.startsWith('/user/')) {
        // User Profile tour
        if (elementExists('.tour-profile-header')) {
          tourSteps.push({
            element: '.tour-profile-header',
            intro: '👤 Profile Header: View devotee\'s photo, name, location, and contact information.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-profile-stats')) {
          tourSteps.push({
            element: '.tour-profile-stats',
            intro: '📊 Statistics: See total books distributed, money collected, and financial breakdown (Amount as per Books, Donation/Insufficient Funds).',
            position: 'top'
          });
        }
        if (elementExists('.tour-sadhna-graph')) {
          tourSteps.push({
            element: '.tour-sadhna-graph',
            intro: '📈 Sadhna Graph: Visual representation of daily japa rounds for the last 30 days. Track your spiritual progress.',
            position: 'top'
          });
        }
        if (elementExists('.tour-activity-history')) {
          tourSteps.push({
            element: '.tour-activity-history',
            intro: '📅 Activity History: View all distribution submissions grouped by date. See approved, pending, and rejected activities.',
            position: 'top'
          });
        }
      } else if (currentPath === '/form') {
        // Distribution Form tour
        if (elementExists('.tour-form-header')) {
          tourSteps.push({
            element: '.tour-form-header',
            intro: '📝 Daily Distribution Form: Submit your daily book distribution and money collection.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-current-totals')) {
          tourSteps.push({
            element: '.tour-current-totals',
            intro: '📊 Current Totals: See your existing distribution counts before submitting new entries.',
            position: 'top'
          });
        }
        if (elementExists('.tour-book-inputs')) {
          tourSteps.push({
            element: '.tour-book-inputs',
            intro: '📚 Book Distribution: Enter the number of books distributed for each active book type.',
            position: 'top'
          });
        }
        if (elementExists('.tour-money-section')) {
          tourSteps.push({
            element: '.tour-money-section',
            intro: '💰 Money Details: Enter online and offline amounts. The system calculates total received, amount as per books, and donation/insufficient funds.',
            position: 'top'
          });
        }
        if (elementExists('.tour-submit-button')) {
          tourSteps.push({
            element: '.tour-submit-button',
            intro: '✅ Submit: After submission, your activity will be sent to admin for approval. You\'ll be notified once approved.',
            position: 'top'
          });
        }
      } else if (currentPath === '/books-prices') {
        // Books & Prices tour
        if (elementExists('.tour-books-header')) {
          tourSteps.push({
            element: '.tour-books-header',
            intro: '📚 Active Books: View all available books for distribution with their details.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-books-list')) {
          tourSteps.push({
            element: '.tour-books-list',
            intro: '📖 Book Cards: Each card shows book name, ID, price, and description. Click to see more details.',
            position: 'top'
          });
        }
        if (elementExists('.tour-price-summary')) {
          tourSteps.push({
            element: '.tour-price-summary',
            intro: '💰 Price Summary: Quick overview of all book prices and total value calculation.',
            position: 'top'
          });
        }
      } else if (currentPath === '/books') {
        // Book Breakdown tour
        if (elementExists('.tour-breakdown-header')) {
          tourSteps.push({
            element: '.tour-breakdown-header',
            intro: '📊 Book Distribution Breakdown: See detailed statistics for each book type.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-breakdown-stats')) {
          tourSteps.push({
            element: '.tour-breakdown-stats',
            intro: '📈 Statistics: View total distribution count, percentage, and progress bars for each book type.',
            position: 'top'
          });
        }
      } else if (currentPath === '/sadhna') {
        // Sadhna Form tour
        if (elementExists('.tour-sadhna-header')) {
          tourSteps.push({
            element: '.tour-sadhna-header',
            intro: '🕉️ Daily Sadhna Chart: Track your daily spiritual practices including arti attendance, japa rounds, and study.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-sadhna-arti')) {
          tourSteps.push({
            element: '.tour-sadhna-arti',
            intro: '🔔 Arti & Puja: Mark which artis and pujas you attended today (Mangla, Tulsi, Guru Puja, Sandhya).',
            position: 'top'
          });
        }
        if (elementExists('.tour-sadhna-rounds')) {
          tourSteps.push({
            element: '.tour-sadhna-rounds',
            intro: '📿 Japa Rounds: Enter your first and last round timings, and total rounds completed today.',
            position: 'top'
          });
        }
        if (elementExists('.tour-sadhna-study')) {
          tourSteps.push({
            element: '.tour-sadhna-study',
            intro: '📚 Study & Service: Record lecture hearing, book reading, and any services performed. Check "Yes" to add details.',
            position: 'top'
          });
        }
      } else if (currentPath === '/edit-profile') {
        // Edit Profile tour
        if (elementExists('.tour-edit-header')) {
          tourSteps.push({
            element: '.tour-edit-header',
            intro: '✏️ Edit Profile: Update your personal information, photo, location, and contact details.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-edit-photo')) {
          tourSteps.push({
            element: '.tour-edit-photo',
            intro: '📷 Profile Photo: Upload or change your profile picture. Maximum file size is 150 KB.',
            position: 'top'
          });
        }
        if (elementExists('.tour-edit-details')) {
          tourSteps.push({
            element: '.tour-edit-details',
            intro: '📝 Personal Details: Update your name, email, mobile number, city, and base location.',
            position: 'top'
          });
        }
      } else if (currentPath === '/admin') {
        // Admin Dashboard tour - Comprehensive
        if (elementExists('.tour-logo')) {
          tourSteps.push({
            element: '.tour-logo',
            intro: '⚙️ Admin Dashboard: Manage users, books, approvals, and system settings.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-admin-tiles')) {
          tourSteps.push({
            element: '.tour-admin-tiles',
            intro: '🎯 Admin Tiles: Access different sections - Manage Users, Manage Books, Pending Approvals, and Sadhna Management.',
            position: 'top'
          });
        }
        if (elementExists('.tour-admin-users')) {
          tourSteps.push({
            element: '.tour-admin-users',
            intro: '👥 User Management: View all users, edit profiles, reset passwords, and manage user data.',
            position: 'top'
          });
        }
        if (elementExists('.tour-admin-pending')) {
          tourSteps.push({
            element: '.tour-admin-pending',
            intro: '⏳ Pending Approvals: Review and approve/reject user submissions. Activities are pending until approved.',
            position: 'top'
          });
        }
        if (elementExists('.tour-admin-books')) {
          tourSteps.push({
            element: '.tour-admin-books',
            intro: '📚 Book Management: Add new books, edit existing books, or delete books from the system.',
            position: 'top'
          });
        }
        if (elementExists('.tour-admin-sadhna')) {
          tourSteps.push({
            element: '.tour-admin-sadhna',
            intro: '🕉️ Sadhna Management: View all users\' sadhna entries, search, filter by date, and export to Excel.',
            position: 'top'
          });
        }
      } else {
        // Generic tour
        if (elementExists('.tour-logo')) {
          tourSteps.push({
            element: '.tour-logo',
            intro: '🕉️ Welcome to Gita Tracker! Use the navigation to explore different features.',
            position: 'bottom'
          });
        }
        if (elementExists('.tour-profile-menu')) {
          tourSteps.push({
            element: '.tour-profile-menu',
            intro: '👤 Profile Menu: Access your profile, submit distribution, and view your sadhna from here.',
            position: 'left'
          });
        }
      }

      console.log('Tour steps:', tourSteps);
      
      if (tourSteps.length > 0) {
        try {
          console.log('Starting intro.js tour...');
          console.log('introJs available:', typeof introJs);
          
          // Check if introJs is available
          if (!introJs || typeof introJs !== 'function') {
            console.error('introJs is not available');
            toast.error('Tour feature is not available. Please refresh the page.');
            return;
          }
          
          const intro = introJs();
          console.log('intro instance created:', intro);
          
          intro.setOptions({
            steps: tourSteps,
            showProgress: true,
            showBullets: true,
            exitOnOverlayClick: true,
            exitOnEsc: true,
            nextLabel: 'Next →',
            prevLabel: '← Previous',
            skipLabel: 'Skip Tour',
            doneLabel: 'Done ✓',
            tooltipClass: 'customTooltip',
            highlightClass: 'customHighlight',
          });
          
          console.log('Options set, starting tour...');
          intro.start();
          console.log('Tour started successfully');
        } catch (error) {
          console.error('Error starting tour:', error);
          console.error('Error details:', error.message, error.stack);
          toast.error('Unable to start tour. Please check console for details.');
        }
      } else {
        console.log('No tour steps found');
        toast.info('No tour steps available for this page.');
      }
    }, 100);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3 flex-1">
              <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity tour-logo">
                <img 
                  src="/prabhupada-loading.png" 
                  alt="Srila Prabhupada" 
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border-2 border-purple-200"
                />
                <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Gita Tracker
                </h1>
              </Link>
            </div>
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Help/Tour Button */}
              {user && (
                <button
                  onClick={startTour}
                  className="p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Take a tour of the app"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}
              {user ? (
                <>
                  {/* Notification Bell Icon */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setShowUserMenu(false);
                        // Mark all current notifications as seen when opening dropdown
                        if (!showNotifications) {
                          if (isAdmin && adminNotifications.length > 0) {
                            const seenIds = getSeenPendingIds();
                            adminNotifications.forEach(n => {
                              if (n.activityId) seenIds.add(n.activityId);
                            });
                            saveSeenPendingIds(seenIds);
                          } else if (!isAdmin && userNotifications.length > 0) {
                            const seenIds = getSeenNotificationIds();
                            userNotifications.forEach(n => {
                              if (n.activityId) seenIds.add(n.activityId);
                            });
                            saveSeenNotificationIds(seenIds);
                          }
                        }
                      }}
                      className="relative p-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title={isAdmin ? `${pendingCount} pending approvals` : `${userNotifications.length} notifications`}
                    >
                      <svg
                        className="w-6 h-6 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      {(() => {
                        if (isAdmin) {
                          // Show pending count badge
                          return pendingCount > 0 ? (
                            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {pendingCount}
                            </span>
                          ) : null;
                        } else {
                          // Count only unseen approved activities
                          const seenIds = getSeenNotificationIds();
                          const unseenCount = userNotifications.filter(n => !seenIds.has(n.activityId)).length;
                          return unseenCount > 0 ? (
                            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                              {unseenCount}
                            </span>
                          ) : null;
                        }
                      })()}
                    </button>

                    {/* Notifications Dropdown - For Admin */}
                    {isAdmin && showNotifications && (
                      <>
                        <div 
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                          onClick={() => setShowNotifications(false)}
                        />
                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                          <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl flex items-center justify-between">
                            <p className="text-sm font-semibold text-gray-900">Pending Approvals</p>
                            <button
                              onClick={async () => {
                                navigate('/admin');
                                setShowNotifications(false);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View All →
                            </button>
                          </div>
                          <div className="py-1 bg-white">
                            {adminNotifications.length > 0 ? (
                              adminNotifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                                  onClick={async () => {
                                    navigate('/admin');
                                    setShowNotifications(false);
                                  }}
                                >
                                  <p className="text-sm text-gray-900">{notification.message}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {new Date(notification.date).toLocaleDateString()}
                                  </p>
                                </div>
                              ))
                            ) : pendingCount > 0 ? (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                Loading notifications...
                              </div>
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No pending approvals
                              </div>
                            )}
                          </div>
                          {adminNotifications.length > 0 && (
                            <div className="border-t border-gray-200 py-2 bg-white rounded-b-2xl">
                              <button
                                onClick={() => {
                                  // Mark all as seen
                                  const seenIds = getSeenPendingIds();
                                  adminNotifications.forEach(n => {
                                    if (n.activityId) seenIds.add(n.activityId);
                                  });
                                  saveSeenPendingIds(seenIds);
                                  setAdminNotifications([]);
                                  setShowNotifications(false);
                                }}
                                className="w-full text-center text-xs text-gray-600 hover:text-gray-900 py-2"
                              >
                                Mark all as seen
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Notifications Dropdown - For Users */}
                    {!isAdmin && showNotifications && userNotifications.length > 0 && (
                      <>
                        <div 
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                          onClick={() => setShowNotifications(false)}
                        />
                        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                          <div className="px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl">
                            <p className="text-sm font-semibold text-gray-900">Notifications</p>
                          </div>
                          <div className="py-1 bg-white">
                            {userNotifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                                  notification.type === 'rejected' ? 'bg-red-50' : ''
                                }`}
                              >
                                <p className={`text-sm ${
                                  notification.type === 'rejected' ? 'text-red-900' : 'text-gray-900'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notification.date).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 py-2 bg-white rounded-b-2xl">
                            <button
                              onClick={() => {
                                setUserNotifications([]);
                                setShowNotifications(false);
                              }}
                              className="w-full text-center text-xs text-gray-600 hover:text-gray-900 py-2"
                            >
                              Clear all
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="tour-profile-menu flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        <Link
                          to="/sadhna"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-all duration-150 rounded-lg mx-2 font-medium"
                        >
                          <span className="mr-3">🕉️</span>
                          Daily Sadhna Chart
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
                </>
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

