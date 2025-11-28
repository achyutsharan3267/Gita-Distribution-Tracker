import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';

const UserList = () => {
  const users = useStore((state) => state.users);
  const leaderboard = useStore((state) => state.getLeaderboard());

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaderboard.map((user) => {
          const totalDistributed = user.hindiGita + user.englishGita + user.smallBooks;
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
                    {user.city && (
                      <p className="text-gray-600 text-sm">📍 {user.city}</p>
                    )}
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

      {users.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">No devotees found</p>
        </div>
      )}
    </div>
  );
};

export default UserList;

