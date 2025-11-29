import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { formatMobileNumber } from '../utils/maskMobileNumber';
import { useEffect } from 'react';
import { getBookValue, getActivityBookValue, mapBookIdToUserProperty } from '../utils/bookMapping';

const UserProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: authUser, isAdmin } = useAuth();
  const users = useStore((state) => state.users);
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);
  const loadUserActivities = useStore((state) => state.loadUserActivities);
  const user = users.find((u) => u.id === userId);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Reload activities when user changes or component mounts to get latest book distributions
  useEffect(() => {
    if (user?.id) {
      loadUserActivities(user.id).then(activities => {
        // Update user's activities in store
        const store = useStore.getState();
        useStore.setState({
          users: store.users.map(u => 
            u.id === user.id ? { ...u, activities } : u
          )
        });
      }).catch(err => {
        console.warn('Could not reload activities:', err);
      });
    }
  }, [user?.id, loadUserActivities]);
  
  // Check if viewing own profile
  const isOwnProfile = currentUserProfile && currentUserProfile.id === userId;
  
  const handleSubmitDistribution = () => {
    console.log('Submit Distribution button clicked');
    navigate('/form');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">User not found</h2>
        <Link to="/users" className="btn-primary">
          Back to Devotees List
        </Link>
      </div>
    );
  }

  const totalDistributed = books.reduce((sum, book) => {
    const bookId = book.id || book.bookId;
    return sum + getBookValue(user, bookId);
  }, 0);
  const sortedActivities = [...user.activities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Group activities by date and merge into single entry per date
  const activitiesByDate = sortedActivities.reduce((acc, activity) => {
    const dateKey = activity.date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        moneyReceived: 0,
        moneyOnline: 0,
        moneyOffline: 0,
        entryCount: 0,
        activityIds: [],
        bookValues: {}, // Store book values by bookId (works for both standard and new books)
      };
    }
    // Add book values dynamically using bookId directly
    books.forEach((book) => {
      const bookId = book.id || book.bookId;
      if (!acc[dateKey].bookValues[bookId]) {
        acc[dateKey].bookValues[bookId] = 0;
      }
      acc[dateKey].bookValues[bookId] += getActivityBookValue(activity, bookId);
    });
    acc[dateKey].moneyReceived += activity.moneyReceived || 0;
    acc[dateKey].moneyOnline += activity.moneyOnline || 0;
    acc[dateKey].moneyOffline += activity.moneyOffline || 0;
    acc[dateKey].entryCount += 1;
    acc[dateKey].activityIds.push(activity.id);
    return acc;
  }, {});

  // Convert to array and sort by date (newest first)
  const mergedActivities = Object.values(activitiesByDate).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      {/* Back Button and Edit Button */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <Link
          to="/users"
          className="inline-flex items-center text-sm sm:text-base text-spiritual-600 hover:text-spiritual-700 font-medium"
        >
          ← Back to Devotees List
        </Link>
        {isOwnProfile && (
          <Link
            to="/edit-profile"
            className="btn-primary text-sm sm:text-base text-center sm:text-left"
          >
            ✏️ Edit Profile
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={user.photo}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 flex-shrink-0 object-cover"
          />
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2 break-words flex items-center justify-center md:justify-start gap-2 flex-wrap">
              {user.name}
              {user.isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-900 text-white">
                  Admin
                </span>
              )}
            </h1>
            <div className="space-y-1 mb-4">
              {user.city && (
                <p className="text-sm text-gray-600 break-words">📍 {user.city}</p>
              )}
              {user.mobileNumber && (
                <p className="text-sm text-gray-600 break-words">📱 {formatMobileNumber(user.mobileNumber, isAdmin, isOwnProfile)}</p>
              )}
              <p className="text-sm text-gray-600 break-words">🏛️ {user.other || 'Other'}</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Total Books</p>
                <p className="text-xl font-bold text-gray-900">{totalDistributed}</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 mb-0.5">Money Collected</p>
                <p className="text-xl font-bold text-gray-900">₹{user.totalMoney.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
        {books.map((book) => {
          const bookId = book.id || book.bookId;
          const value = getBookValue(user, bookId);
          return (
            <div key={bookId} className="card p-4">
              <div className="text-center">
                <div className="text-2xl mb-2">{book.icon || '📖'}</div>
                <p className="text-gray-600 text-xs font-medium mb-1 break-words">{book.name}</p>
                <p className="text-lg font-bold text-gray-900">
                  {value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity History */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📅</span>
            Activity History
          </h2>
          {isOwnProfile && (
            <button
              onClick={handleSubmitDistribution}
              className="btn-primary text-sm py-2 px-4"
            >
              ➕ Add
            </button>
          )}
        </div>

        {sortedActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">No distribution activities recorded yet.</p>
            {isOwnProfile && (
              <button
                onClick={handleSubmitDistribution}
                className="btn-primary text-sm py-2.5 px-5"
              >
                Submit Your First Distribution
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {mergedActivities.map((mergedActivity) => {
              const totalBooks = books.reduce((sum, book) => {
                const bookId = book.id || book.bookId;
                return sum + (mergedActivity.bookValues?.[bookId] || 0);
              }, 0);
              const hasMultipleEntries = mergedActivity.entryCount > 1;
              
              return (
                <div
                  key={mergedActivity.date}
                  className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-base break-words">
                        {formatDate(mergedActivity.date)}
                      </p>
                      {hasMultipleEntries && (
                        <p className="text-xs text-gray-500 mt-1">
                          {mergedActivity.entryCount} entries merged
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-lg font-bold text-gray-900">
                        {totalBooks} books
                      </p>
                      {mergedActivity.moneyReceived > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          ₹{mergedActivity.moneyReceived.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`grid gap-2 mb-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      const value = mergedActivity.bookValues?.[bookId] || 0;
                      return (
                        <div key={bookId} className="bg-gray-50 rounded-xl p-2.5">
                          <p className="text-xs text-gray-500 mb-1 break-words">{book.name}</p>
                          <p className="text-base font-semibold text-gray-900">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {mergedActivity.moneyReceived > 0 && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Money Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Total Received</p>
                          <p className="font-semibold text-gray-900">
                            ₹{mergedActivity.moneyReceived.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Online</p>
                          <p className="font-semibold text-gray-900">
                            ₹{mergedActivity.moneyOnline.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-0.5">Offline</p>
                          <p className="font-semibold text-gray-900">
                            ₹{mergedActivity.moneyOffline.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {isOwnProfile && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmitDistribution}
            className="btn-primary text-sm py-3 px-6"
          >
            📝 Submit New Distribution
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

