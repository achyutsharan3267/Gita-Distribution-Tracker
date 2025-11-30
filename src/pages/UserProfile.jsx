import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { formatMobileNumber } from '../utils/maskMobileNumber';
import { useEffect, useState } from 'react';
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
  
  // Check if viewing own profile
  const isOwnProfile = currentUserProfile && currentUserProfile.id === userId;
  
  // Accordion state for rejected activities
  const [isRejectedExpanded, setIsRejectedExpanded] = useState(false);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Reload activities when user changes or component mounts to get latest book distributions
  // For own profile OR admin viewing, show all statuses (pending, approved, rejected)
  useEffect(() => {
    if (user?.id) {
      // Admin can see all activities, or user viewing their own profile
      const showAllStatuses = isAdmin || isOwnProfile;
      loadUserActivities(user.id, isAdmin, showAllStatuses).then(activities => {
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
  }, [user?.id, loadUserActivities, isAdmin, isOwnProfile]);
  
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
  
  // Separate approved, pending, and rejected activities
  // Admin can see all activities, regular users only see approved (except their own)
  const approvedActivities = user.activities.filter(a => a.approvalStatus === 'approved' || !a.approvalStatus);
  const pendingActivities = user.activities.filter(a => a.approvalStatus === 'pending');
  const rejectedActivities = user.activities.filter(a => a.approvalStatus === 'rejected');
  
  // Admin or own profile can see all activities
  const canViewAllActivities = isAdmin || isOwnProfile;
  
  const sortedActivities = [...approvedActivities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const sortedPendingActivities = [...pendingActivities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  const sortedRejectedActivities = [...rejectedActivities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Group approved activities by date and merge into single entry per date
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
        approvalStatuses: [], // Track all approval statuses for this date
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
    // Track approval status
    const status = activity.approvalStatus || 'approved';
    if (!acc[dateKey].approvalStatuses.includes(status)) {
      acc[dateKey].approvalStatuses.push(status);
    }
    return acc;
  }, {});

  // Convert to array and sort by date (newest first)
  const mergedActivities = Object.values(activitiesByDate).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
  
  // Group pending activities by date (but keep them separate, don't merge with approved)
  const pendingActivitiesByDate = sortedPendingActivities.reduce((acc, activity) => {
    const dateKey = activity.date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        activities: [],
      };
    }
    acc[dateKey].activities.push(activity);
    return acc;
  }, {});
  
  const groupedPendingActivities = Object.values(pendingActivitiesByDate).sort(
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
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm sm:text-base text-spiritual-600 hover:text-spiritual-700 font-medium"
        >
          ← Back
        </button>
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
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={user.photo}
            alt={user.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gray-200 flex-shrink-0 object-cover"
          />
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 break-words flex items-center justify-center md:justify-start gap-2 flex-wrap">
              {user.name}
              {user.isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-900 text-white">
                  Admin
                </span>
              )}
            </h1>
            <div className="space-y-1 mb-3 sm:mb-4">
              {user.city && (
                <p className="text-xs sm:text-sm text-gray-600 break-words">📍 {user.city}</p>
              )}
              {user.mobileNumber && (
                <p className="text-xs sm:text-sm text-gray-600 break-words">📱 {formatMobileNumber(user.mobileNumber, isAdmin, isOwnProfile)}</p>
              )}
              <p className="text-xs sm:text-sm text-gray-600 break-words">🏛️ {user.other || 'Other'}</p>
            </div>
            {(() => {
              // Calculate Amount as per Books based on user's total books
              let amountAsPerBooks = 0;
              books.forEach(book => {
                const bookId = book.id || book.bookId;
                const count = getBookValue(user, bookId);
                const price = parseFloat(book.price || 0);
                amountAsPerBooks += count * price;
              });

              // Calculate Insufficient Funds (if Amount as per Books > Total Money Collected)
              const insufficientFunds = amountAsPerBooks > user.totalMoney 
                ? amountAsPerBooks - user.totalMoney 
                : 0;

              // Calculate Donation Amount (if Total Money Collected > Amount as per Books)
              const donationAmount = user.totalMoney > amountAsPerBooks 
                ? user.totalMoney - amountAsPerBooks 
                : 0;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                      <p className="text-xs text-gray-500 mb-0.5">Total Books</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">{totalDistributed}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                      <p className="text-xs text-gray-500 mb-0.5">Money Collected</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        ₹{user.totalMoney.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 col-span-2 lg:col-span-1">
                      <p className="text-xs text-gray-500 mb-0.5">Amount as per Books</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900 break-words">
                        ₹{amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {insufficientFunds > 0 ? (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 sm:px-4 sm:py-3">
                        <p className="text-xs text-red-600 mb-0.5">Insufficient Funds</p>
                        <p className="text-lg sm:text-xl font-bold text-red-600 break-words">
                          ₹{insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ) : (
                      <div className={`rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 ${donationAmount > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <p className={`text-xs mb-0.5 ${donationAmount > 0 ? 'text-green-600' : 'text-gray-600'}`}>Donation Amount</p>
                        <p className={`text-lg sm:text-xl font-bold break-words ${donationAmount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          ₹{donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
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
          {isAdmin && !isOwnProfile && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Admin View
            </span>
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
                  className="border border-gray-200 rounded-xl p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                          {formatDate(mergedActivity.date)}
                        </p>
                        {/* Approval Status Badge */}
                        {canViewAllActivities && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            ✅ Approved
                          </span>
                        )}
                      </div>
                      {hasMultipleEntries && (
                        <p className="text-xs text-gray-500 mt-1">
                          {mergedActivity.entryCount} entries merged
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {totalBooks} books
                      </p>
                      {mergedActivity.moneyReceived > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5 break-words">
                          ₹{mergedActivity.moneyReceived.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={`grid gap-2 mb-2 sm:mb-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      const value = mergedActivity.bookValues?.[bookId] || 0;
                      return (
                        <div key={bookId} className="bg-gray-50 rounded-xl p-2 sm:p-2.5">
                          <p className="text-xs text-gray-500 mb-0.5 sm:mb-1 break-words line-clamp-2">{book.name}</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {mergedActivity.moneyReceived > 0 && (() => {
                    // Calculate Amount as per Books based on books distributed in THIS activity
                    let amountAsPerBooks = 0;
                    books.forEach(book => {
                      const bookId = book.id || book.bookId;
                      const count = mergedActivity.bookValues?.[bookId] || 0;
                      const price = parseFloat(book.price || 0);
                      amountAsPerBooks += count * price;
                    });

                    // Calculate Total Received Amount (Online + Offline)
                    const onlineAmount = mergedActivity.moneyOnline || 0;
                    const offlineAmount = mergedActivity.moneyOffline || 0;
                    const totalReceivedAmount = onlineAmount + offlineAmount;

                    // Calculate Insufficient Funds (if Amount as per Books > Total Received)
                    const insufficientFunds = amountAsPerBooks > totalReceivedAmount 
                      ? amountAsPerBooks - totalReceivedAmount 
                      : 0;

                    // Calculate Donation Amount (if Total Received > Amount as per Books)
                    const donationAmount = totalReceivedAmount > amountAsPerBooks 
                      ? totalReceivedAmount - amountAsPerBooks 
                      : 0;

                    return (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-3">
                          Money Details
                        </p>
                        
                        {/* Input Fields Display */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Online Amount (₹)</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                              ₹{onlineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3">
                            <p className="text-xs text-gray-500 mb-0.5">Offline Amount (₹)</p>
                            <p className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                              ₹{offlineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>

                        {/* Calculated Fields */}
                        <div className="bg-gray-50 rounded-xl p-2.5 sm:p-3 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Total Received Amount (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                              ₹{totalReceivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Amount as per Books (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900 break-words">
                              ₹{amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>

                          {insufficientFunds > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-red-600">Insufficient Funds (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-red-600 break-words">
                                ₹{insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}

                          {donationAmount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-green-600">Donation Amount (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-green-600 break-words">
                                ₹{donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Activities Section - For own profile or admin viewing */}
      {canViewAllActivities && sortedPendingActivities.length > 0 && (
        <div className="card p-5 border-2 border-yellow-200 bg-yellow-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <span className="mr-2">⏳</span>
              Pending Activities
            </h2>
            <span className="text-xs font-medium text-yellow-800 bg-yellow-200 px-2 py-1 rounded">
              {sortedPendingActivities.length} {sortedPendingActivities.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>

          <div className="space-y-3">
            {sortedPendingActivities.map((activity) => {
              const totalBooks = books.reduce((sum, book) => {
                const bookId = book.id || book.bookId;
                return sum + getActivityBookValue(activity, bookId);
              }, 0);

              return (
                <div
                  key={activity.id}
                  className="border-2 border-yellow-300 bg-white rounded-xl p-3 sm:p-4"
                >
                  {/* Header with Date and Status */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          📅 {formatDate(activity.date)}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-200 text-yellow-900">
                          ⏳ Pending Approval
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        {isAdmin ? 'This activity is pending approval.' : 'Waiting for admin approval. Your submission will be reviewed soon.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {totalBooks} books
                      </p>
                      {activity.moneyReceived > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          ₹{activity.moneyReceived.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Books Distribution */}
                  <div className={`grid gap-2 mb-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      const value = getActivityBookValue(activity, bookId);
                      if (value === 0) return null;
                      return (
                        <div key={bookId} className="rounded-xl p-2 sm:p-2.5 bg-yellow-100">
                          <p className="text-xs text-gray-700 mb-0.5 sm:mb-1 break-words line-clamp-2">{book.name}</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Money Details */}
                  {activity.moneyReceived > 0 && (() => {
                    // Calculate Amount as per Books
                    let amountAsPerBooks = 0;
                    books.forEach(book => {
                      const bookId = book.id || book.bookId;
                      const count = getActivityBookValue(activity, bookId);
                      const price = parseFloat(book.price || 0);
                      amountAsPerBooks += count * price;
                    });

                    const onlineAmount = activity.moneyOnline || 0;
                    const offlineAmount = activity.moneyOffline || 0;
                    const totalReceivedAmount = onlineAmount + offlineAmount;
                    const insufficientFunds = amountAsPerBooks > totalReceivedAmount 
                      ? amountAsPerBooks - totalReceivedAmount 
                      : 0;
                    const donationAmount = totalReceivedAmount > amountAsPerBooks 
                      ? totalReceivedAmount - amountAsPerBooks 
                      : 0;

                    return (
                      <div className="border-t border-yellow-200 pt-3 mt-3">
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Total Money Received (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{totalReceivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Amount as per Books (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {insufficientFunds > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-red-600">Insufficient Funds (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-red-600">
                                ₹{insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {donationAmount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-green-600">Donation Amount (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-green-600">
                                ₹{donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejected Activities Section - Accordion - For own profile or admin viewing */}
      {canViewAllActivities && sortedRejectedActivities.length > 0 && (
        <div className="card p-0 border-2 border-red-300 bg-red-50 overflow-hidden">
          {/* Accordion Header */}
          <button
            onClick={() => setIsRejectedExpanded(!isRejectedExpanded)}
            className="w-full flex items-center justify-between p-5 hover:bg-red-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">❌</span>
                Rejected Activities
              </h2>
              <span className="text-xs font-medium text-red-800 bg-red-200 px-2 py-1 rounded">
                {sortedRejectedActivities.length} {sortedRejectedActivities.length === 1 ? 'activity' : 'activities'}
              </span>
            </div>
            <span className={`text-red-600 transition-transform duration-200 ${isRejectedExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Accordion Content */}
          {isRejectedExpanded && (
            <div className="px-5 pb-5 space-y-3 border-t border-red-200 pt-4">
            {sortedRejectedActivities.map((activity) => {
              const totalBooks = books.reduce((sum, book) => {
                const bookId = book.id || book.bookId;
                return sum + getActivityBookValue(activity, bookId);
              }, 0);

              return (
                <div
                  key={activity.id}
                  className="border-2 border-red-400 bg-white rounded-xl p-3 sm:p-4"
                >
                  {/* Header with Date and Status */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          📅 {formatDate(activity.date)}
                        </p>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900">
                          ❌ Rejected
                        </span>
                      </div>
                      <p className="text-xs text-red-700 mt-1">
                        {isAdmin ? 'This activity was rejected.' : 'This submission was rejected by admin. Please check and resubmit if needed.'}
                      </p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {totalBooks} books
                      </p>
                      {activity.moneyReceived > 0 && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          ₹{activity.moneyReceived.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Books Distribution */}
                  <div className={`grid gap-2 mb-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-3' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      const value = getActivityBookValue(activity, bookId);
                      if (value === 0) return null;
                      return (
                        <div key={bookId} className="rounded-xl p-2 sm:p-2.5 bg-red-100">
                          <p className="text-xs text-gray-700 mb-0.5 sm:mb-1 break-words line-clamp-2">{book.name}</p>
                          <p className="text-sm sm:text-base font-semibold text-gray-900">
                            {value}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Money Details */}
                  {activity.moneyReceived > 0 && (() => {
                    // Calculate Amount as per Books
                    let amountAsPerBooks = 0;
                    books.forEach(book => {
                      const bookId = book.id || book.bookId;
                      const count = getActivityBookValue(activity, bookId);
                      const price = parseFloat(book.price || 0);
                      amountAsPerBooks += count * price;
                    });

                    const onlineAmount = activity.moneyOnline || 0;
                    const offlineAmount = activity.moneyOffline || 0;
                    const totalReceivedAmount = onlineAmount + offlineAmount;
                    const insufficientFunds = amountAsPerBooks > totalReceivedAmount 
                      ? amountAsPerBooks - totalReceivedAmount 
                      : 0;
                    const donationAmount = totalReceivedAmount > amountAsPerBooks 
                      ? totalReceivedAmount - amountAsPerBooks 
                      : 0;

                    return (
                      <div className="border-t border-red-200 pt-3 mt-3">
                        <div className="space-y-2 text-xs sm:text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Total Money Received (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{totalReceivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                            <span className="text-xs font-medium text-gray-700">Amount as per Books (₹)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-900">
                              ₹{amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          {insufficientFunds > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-red-600">Insufficient Funds (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-red-600">
                                ₹{insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                          {donationAmount > 0 && (
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 pt-2 border-t border-gray-200">
                              <span className="text-xs font-medium text-green-600">Donation Amount (₹)</span>
                              <span className="text-xs sm:text-sm font-semibold text-green-600">
                                ₹{donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

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

