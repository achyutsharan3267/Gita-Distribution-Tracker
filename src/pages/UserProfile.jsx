import { useParams, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { userId } = useParams();
  const { user: authUser } = useAuth();
  const users = useStore((state) => state.users);
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const user = users.find((u) => u.id === userId);
  
  // Check if viewing own profile
  const isOwnProfile = currentUserProfile && currentUserProfile.id === userId;

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

  const totalDistributed = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
  const sortedActivities = [...user.activities].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  // Group activities by date and merge into single entry per date
  const activitiesByDate = sortedActivities.reduce((acc, activity) => {
    const dateKey = activity.date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        hindiGita: 0,
        englishGita: 0,
        smallBooks: 0,
        bhagavatam: 0,
        chaitanyaCharitamrita: 0,
        otherBooks: 0,
        moneyReceived: 0,
        moneyOnline: 0,
        moneyOffline: 0,
        entryCount: 0,
        activityIds: [],
      };
    }
    // Merge all activities for same date
    acc[dateKey].hindiGita += activity.hindiGita || 0;
    acc[dateKey].englishGita += activity.englishGita || 0;
    acc[dateKey].smallBooks += activity.smallBooks || 0;
    acc[dateKey].bhagavatam += activity.bhagavatam || 0;
    acc[dateKey].chaitanyaCharitamrita += activity.chaitanyaCharitamrita || 0;
    acc[dateKey].otherBooks += activity.otherBooks || 0;
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back Button and Edit Button */}
      <div className="flex justify-between items-center">
        <Link
          to="/users"
          className="inline-flex items-center text-spiritual-600 hover:text-spiritual-700 font-medium"
        >
          ← Back to Devotees List
        </Link>
        {isOwnProfile && (
          <Link
            to="/edit-profile"
            className="btn-primary"
          >
            ✏️ Edit Profile
          </Link>
        )}
      </div>

      {/* Profile Header */}
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          <img
            src={user.photo}
            alt={user.name}
            className="w-32 h-32 rounded-full border-4 border-white shadow-xl"
          />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
            {user.city && (
              <p className="text-xl text-spiritual-100 mb-4">📍 {user.city}</p>
            )}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-spiritual-100">Total Books</p>
                <p className="text-2xl font-bold">{totalDistributed}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <p className="text-sm text-spiritual-100">Money Collected</p>
                <p className="text-2xl font-bold">₹{user.totalMoney.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card bg-spiritual-50 border-2 border-spiritual-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📖</div>
            <p className="text-gray-600 text-xs font-medium mb-1">Hindi Gita</p>
            <p className="text-2xl font-bold text-spiritual-600">
              {user.hindiGita}
            </p>
          </div>
        </div>

        <div className="card bg-primary-50 border-2 border-primary-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-gray-600 text-xs font-medium mb-1">English Gita</p>
            <p className="text-2xl font-bold text-primary-600">
              {user.englishGita}
            </p>
          </div>
        </div>

        <div className="card bg-green-50 border-2 border-green-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📗</div>
            <p className="text-gray-600 text-xs font-medium mb-1">Small Books</p>
            <p className="text-2xl font-bold text-green-600">
              {user.smallBooks}
            </p>
          </div>
        </div>

        <div className="card bg-indigo-50 border-2 border-indigo-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📿</div>
            <p className="text-gray-600 text-xs font-medium mb-1">Bhagavatam</p>
            <p className="text-2xl font-bold text-indigo-600">
              {user.bhagavatam || 0}
            </p>
          </div>
        </div>

        <div className="card bg-pink-50 border-2 border-pink-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📿</div>
            <p className="text-gray-600 text-xs font-medium mb-1">Chaitanya Charitamrita</p>
            <p className="text-2xl font-bold text-pink-600">
              {user.chaitanyaCharitamrita || 0}
            </p>
          </div>
        </div>

        <div className="card bg-amber-50 border-2 border-amber-200">
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-gray-600 text-xs font-medium mb-1">Other Books</p>
            <p className="text-2xl font-bold text-amber-600">
              {user.otherBooks || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Activity History */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="mr-2">📅</span>
          Distribution Activity History
        </h2>

        {sortedActivities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No distribution activities recorded yet.</p>
            <Link to="/form" className="btn-primary mt-4 inline-block">
              Submit Your First Distribution
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mergedActivities.map((mergedActivity) => {
              const totalBooks = mergedActivity.hindiGita + mergedActivity.englishGita + mergedActivity.smallBooks;
              const hasMultipleEntries = mergedActivity.entryCount > 1;
              
              return (
                <div
                  key={mergedActivity.date}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-spiritual-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold text-gray-800 text-lg">
                        {formatDate(mergedActivity.date)}
                      </p>
                      {hasMultipleEntries && (
                        <p className="text-sm text-gray-500 mt-1">
                          {mergedActivity.entryCount} entries merged
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-spiritual-600">
                        {totalBooks} books
                      </p>
                      {mergedActivity.moneyReceived > 0 && (
                        <p className="text-sm text-gray-600">
                          ₹{mergedActivity.moneyReceived.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                    <div className="bg-spiritual-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Hindi Gita</p>
                      <p className="text-lg font-bold text-spiritual-600">
                        {mergedActivity.hindiGita}
                      </p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">English Gita</p>
                      <p className="text-lg font-bold text-primary-600">
                        {mergedActivity.englishGita}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Small Books</p>
                      <p className="text-lg font-bold text-green-600">
                        {mergedActivity.smallBooks}
                      </p>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Bhagavatam</p>
                      <p className="text-lg font-bold text-indigo-600">
                        {mergedActivity.bhagavatam || 0}
                      </p>
                    </div>
                    <div className="bg-pink-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Chaitanya Charitamrita</p>
                      <p className="text-lg font-bold text-pink-600">
                        {mergedActivity.chaitanyaCharitamrita || 0}
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-xs text-gray-600 mb-1">Other Books</p>
                      <p className="text-lg font-bold text-amber-600">
                        {mergedActivity.otherBooks || 0}
                      </p>
                    </div>
                  </div>

                  {mergedActivity.moneyReceived > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">
                        Money Details:
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Total Received</p>
                          <p className="font-bold text-purple-600">
                            ₹{mergedActivity.moneyReceived.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Online</p>
                          <p className="font-bold text-blue-600">
                            ₹{mergedActivity.moneyOnline.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-1">Offline</p>
                          <p className="font-bold text-orange-600">
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
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/form" className="btn-primary text-center text-lg py-3">
          📝 Submit New Distribution
        </Link>
        <Link to="/" className="btn-secondary text-center text-lg py-3">
          🏠 Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default UserProfile;

