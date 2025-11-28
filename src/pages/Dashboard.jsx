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
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value.toLocaleString()}</p>
        </div>
        <div className={`text-4xl ${color}`}>{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-spiritual-800 mb-2">
          Distribution Dashboard
        </h1>
        <p className="text-gray-600">Track the divine service of book distribution</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-spiritual-100 text-sm font-medium">Active Devotees</p>
            <p className="text-4xl font-bold mt-2">{activeDevotees.length}</p>
            <p className="text-spiritual-100 text-sm mt-1">
              Devotees actively distributing books
            </p>
          </div>
          <div className="text-6xl">🕉️</div>
        </div>
      </div>

      {/* Top 3 Leaderboard */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="mr-2">🏆</span>
          Top 3 Devotees
        </h2>
        {top3.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No Devotees found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {top3.map((user, index) => (
            <Link
              key={user.id}
              to={`/user/${user.id}`}
              className="group"
            >
              <div className="bg-gradient-to-br from-spiritual-50 to-primary-50 rounded-lg p-6 text-center transition-transform hover:scale-105 border-2 border-transparent group-hover:border-spiritual-300">
                <div className="flex justify-center mb-4">
                  <div className="relative">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                    />
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-1">{user.name}</h3>
                {user.city && (
                  <p className="text-gray-600 text-sm mb-3">📍 {user.city}</p>
                )}
                <div className="bg-white rounded-lg p-3 mt-3">
                  <p className="text-2xl font-bold text-spiritual-600">
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
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="mr-2">📋</span>
          Top 10 Devotees Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Devotee</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Hindi Gita</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">English Gita</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Small Books</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              {top10.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center">
                    <p className="text-gray-500 text-lg">No Devotees found</p>
                  </td>
                </tr>
              ) : (
                top10.map((user, index) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-100 hover:bg-spiritual-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
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
                  <td className="py-4 px-4">
                    <Link
                      to={`/user/${user.id}`}
                      className="flex items-center space-x-3 group"
                    >
                      <img
                        src={user.photo}
                        alt={user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-spiritual-600">
                          {user.name}
                        </p>
                        {user.city && (
                          <p className="text-xs text-gray-500">📍 {user.city}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-4 px-4 text-right font-medium">{user.hindiGita}</td>
                  <td className="py-4 px-4 text-right font-medium">{user.englishGita}</td>
                  <td className="py-4 px-4 text-right font-medium">{user.smallBooks}</td>
                  <td className="py-4 px-4 text-right font-bold text-spiritual-600">
                    {user.totalDistributed}
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/form"
          className="btn-primary text-center text-lg py-3"
        >
          📝 Submit Daily Distribution
        </Link>
        <Link
          to="/users"
          className="btn-secondary text-center text-lg py-3"
        >
          👥 View All Devotees
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

