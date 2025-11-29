import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const totalStats = useStore((state) => state.getTotalStats());
  const leaderboard = useStore((state) => state.getLeaderboard());
  const activeDevotees = useStore((state) => state.getActiveDevotees());

  // Filter out users with 0 total books
  const activeLeaderboard = leaderboard.filter((user) => user.totalDistributed > 0);
  const top3 = activeLeaderboard.slice(0, 3);
  const top10 = activeLeaderboard.slice(0, 10);

  const StatCard = ({ title, value, icon, color }) => (
    <div className="card p-3 sm:p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 ${color}`}>{value.toLocaleString()}</p>
        </div>
        <div className={`text-2xl sm:text-3xl md:text-4xl ${color} flex-shrink-0 ml-2`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
          Distribution Dashboard
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">Track the divine service of book distribution</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatCard
          title="Hindi Gita Distributed"
          value={totalStats.hindiGita}
          icon="📖"
          color="text-spiritual-600"
        />
        <StatCard
          title="English Gita Distributed"
          value={totalStats.englishGita}
          icon="📚"
          color="text-primary-600"
        />
        <StatCard
          title="Small Books Distributed"
          value={totalStats.smallBooks}
          icon="📗"
          color="text-green-600"
        />
        <StatCard
          title="Total Distribution Count"
          value={totalStats.hindiGita + totalStats.englishGita + totalStats.smallBooks + (totalStats.bhagavatam || 0) + (totalStats.chaitanyaCharitamrita || 0) + (totalStats.otherBooks || 0)}
          icon="📊"
          color="text-purple-600"
        />
      </div>

      {/* Active Devotees Count */}
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-spiritual-100 text-xs sm:text-sm font-medium">Active Devotees</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 sm:mt-2">{activeDevotees.length}</p>
            <p className="text-spiritual-100 text-xs sm:text-sm mt-1">
              Devotees actively distributing books
            </p>
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl flex-shrink-0 ml-2">🕉️</div>
        </div>
      </div>

      {/* Top 3 Leaderboard */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <span className="mr-2">🏆</span>
          Top 3 Distributor
        </h2>
        {top3.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-gray-500 text-base sm:text-lg">No Devotees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {top3.map((user, index) => (
            <Link
              key={user.id}
              to={`/user/${user.id}`}
              className="group"
            >
              <div className="bg-gradient-to-br from-spiritual-50 to-primary-50 rounded-lg p-4 sm:p-6 text-center transition-transform hover:scale-105 border-2 border-transparent group-hover:border-spiritual-300">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="relative">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center font-bold text-xs sm:text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 truncate px-2">{user.name}</h3>
                {user.city && (
                  <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 truncate px-2">📍 {user.city}</p>
                )}
                <div className="bg-white rounded-lg p-2 sm:p-3 mt-2 sm:mt-3">
                  <p className="text-xl sm:text-2xl font-bold text-spiritual-600">
                    {user.totalDistributed}
                  </p>
                  <p className="text-xs text-gray-600">Total Books</p>
                </div>
              </div>
            </Link>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 Leaderboard */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <span className="mr-2">📋</span>
          <span className="hidden sm:inline">Top 10 Devotees Leaderboard</span>
          <span className="sm:hidden">Top 10 Leaderboard</span>
        </h2>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-[950px] sm:min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">#</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Rank</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-semibold text-gray-700 uppercase whitespace-nowrap min-w-[120px]">Devotee</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Hindi</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">English</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Small</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Bhagavatam</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Chaitanya</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Other</th>
                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-semibold text-gray-700 uppercase whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {top10.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 sm:py-12 text-center">
                      <p className="text-gray-500 text-base sm:text-lg">No Devotees found</p>
                    </td>
                  </tr>
                ) : (
                  top10.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-100 hover:bg-spiritual-50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/user/${user.id}`}
                        className="flex justify-center group"
                      >
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-spiritual-200 group-hover:border-spiritual-400 transition-colors flex-shrink-0"
                        />
                      </Link>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full font-bold text-xs sm:text-sm ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : index === 1
                            ? 'bg-gray-300 text-gray-800'
                            : index === 2
                            ? 'bg-orange-300 text-orange-900'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap min-w-[120px]">
                      <Link
                        to={`/user/${user.id}`}
                        className="group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm sm:text-base text-gray-800 group-hover:text-spiritual-600 truncate">
                            {user.name}
                          </p>
                          {user.city && (
                            <p className="text-xs text-gray-500 truncate">📍 {user.city}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.hindiGita}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.englishGita}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.smallBooks}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.bhagavatam || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.chaitanyaCharitamrita || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-medium text-sm sm:text-base whitespace-nowrap">{user.otherBooks || 0}</td>
                    <td className="px-3 sm:px-4 py-3 sm:py-4 text-right font-bold text-sm sm:text-base text-spiritual-600 whitespace-nowrap">
                      {user.totalDistributed}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 sm:hidden text-center">← Swipe to see all columns →</p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
        <Link
          to="/form"
          className="btn-primary text-center text-base sm:text-lg py-2.5 sm:py-3"
        >
          📝 Submit Daily Distribution
        </Link>
        <Link
          to="/users"
          className="btn-secondary text-center text-base sm:text-lg py-2.5 sm:py-3"
        >
          👥 View All Devotees
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

