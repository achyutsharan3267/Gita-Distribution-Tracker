import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserList = () => {
  const users = useStore((state) => state.users);
  const leaderboard = useStore((state) => state.getLeaderboard());
  const { user: authUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query (name, mobile number, email)
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) {
      return leaderboard;
    }

    const query = searchQuery.toLowerCase().trim();
    return leaderboard.filter((user) => {
      const nameMatch = user.name?.toLowerCase().includes(query);
      const mobileMatch = user.mobileNumber?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      return nameMatch || mobileMatch || emailMatch;
    });
  }, [leaderboard, searchQuery]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-spiritual-800 mb-2">
          All Devotees
        </h1>
        <p className="text-gray-600">
          View all devotees and their distribution summary
        </p>
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, mobile number, or email..."
                className="input-field pl-10 w-full"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-500 mt-2">
            Found {filteredLeaderboard.length} devotee{filteredLeaderboard.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🕉️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Devotees found</h2>
          <p className="text-gray-600 mb-6">There are no devotees registered yet.</p>
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No results found</h2>
          <p className="text-gray-600 mb-6">No devotees match your search query.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-primary"
          >
            Clear Search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeaderboard.map((user) => {
            const totalDistributed = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
            return (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="group"
              >
                <div className="card hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-16 h-16 rounded-full border-2 border-spiritual-200 group-hover:border-spiritual-400 transition-colors"
                    />
                    <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 group-hover:text-spiritual-600 transition-colors">
                      {user.name}
                    </h3>
                    <div className="space-y-1">
                      {user.city && (
                        <p className="text-gray-600 text-sm">📍 {user.city}</p>
                      )}
                      {user.mobileNumber && (
                        <p className="text-gray-600 text-sm">📱 {user.mobileNumber}</p>
                      )}
                    </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-spiritual-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-spiritual-600">{user.hindiGita}</p>
                      <p className="text-xs text-gray-600">Hindi Gita</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-primary-600">{user.englishGita}</p>
                      <p className="text-xs text-gray-600">English Gita</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-600">{user.smallBooks}</p>
                      <p className="text-xs text-gray-600">Small Books</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Distributed</p>
                        <p className="text-2xl font-bold text-spiritual-600">
                          {totalDistributed}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Money Collected</p>
                        <p className="text-lg font-bold text-purple-600">
                          ₹{user.totalMoney.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-gray-500 text-center group-hover:text-spiritual-600 transition-colors">
                      Click to view full profile →
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserList;

