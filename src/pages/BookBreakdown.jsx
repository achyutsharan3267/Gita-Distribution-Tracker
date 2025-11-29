import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

const BookBreakdown = () => {
  const totalStats = useStore((state) => state.getTotalStats());

  const StatCard = ({ title, value, icon, color, isTopSelling = false }) => (
    <div className={`card p-3 sm:p-4 md:p-6 relative ${isTopSelling ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
      {isTopSelling && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1">
          <span>🏆</span>
          <span>Top Selling</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 ${color}`}>{value.toLocaleString()}</p>
        </div>
        <div className={`text-2xl sm:text-3xl md:text-4xl ${color} flex-shrink-0 ml-2`}>{icon}</div>
      </div>
    </div>
  );

  const totalBooks = totalStats.hindiGita + 
    totalStats.englishGita + 
    totalStats.smallBooks + 
    (totalStats.bhagavatam || 0) + 
    (totalStats.chaitanyaCharitamrita || 0) + 
    (totalStats.otherBooks || 0);

  // Create array of all books with their data and sort by count (descending)
  const allBooks = [
    {
      title: 'Hindi Gita Distributed',
      value: totalStats.hindiGita,
      icon: '📖',
      color: 'text-spiritual-600',
      bgColor: 'bg-spiritual-600',
      key: 'hindiGita',
    },
    {
      title: 'English Gita Distributed',
      value: totalStats.englishGita,
      icon: '📚',
      color: 'text-primary-600',
      bgColor: 'bg-primary-600',
      key: 'englishGita',
    },
    {
      title: 'Small Books Distributed',
      value: totalStats.smallBooks,
      icon: '📗',
      color: 'text-green-600',
      bgColor: 'bg-green-600',
      key: 'smallBooks',
    },
    {
      title: 'Bhagavatam Distributed',
      value: totalStats.bhagavatam || 0,
      icon: '📜',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-600',
      key: 'bhagavatam',
    },
    {
      title: 'Chaitanya Charitamrita',
      value: totalStats.chaitanyaCharitamrita || 0,
      icon: '📖',
      color: 'text-purple-600',
      bgColor: 'bg-purple-600',
      key: 'chaitanyaCharitamrita',
    },
    {
      title: 'Other Books Distributed',
      value: totalStats.otherBooks || 0,
      icon: '📘',
      color: 'text-blue-600',
      bgColor: 'bg-blue-600',
      key: 'otherBooks',
    },
  ].sort((a, b) => b.value - a.value); // Sort by count descending

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center text-sm sm:text-base text-spiritual-600 hover:text-spiritual-700 font-medium"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
          Book Distribution Breakdown
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">Detailed breakdown of all book types distributed</p>
      </div>

      {/* Total Books Summary */}
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-spiritual-100 text-xs sm:text-sm font-medium">Total Books Distributed</p>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold mt-1 sm:mt-2">{totalBooks.toLocaleString()}</p>
            <p className="text-spiritual-100 text-xs sm:text-sm mt-1">
              Across all book types
            </p>
          </div>
          <div className="text-4xl sm:text-5xl md:text-6xl flex-shrink-0 ml-2">📚</div>
        </div>
      </div>

      {/* Stats Grid - Sorted by count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {allBooks.map((book, index) => (
          <StatCard
            key={book.key}
            title={book.title}
            value={book.value}
            icon={book.icon}
            color={book.color}
            isTopSelling={index === 0 && book.value > 0}
          />
        ))}
      </div>

      {/* Percentage Breakdown */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
          <span className="mr-2">📊</span>
          Distribution Percentage
        </h2>
        <div className="space-y-3 sm:space-y-4">
          {totalBooks > 0 ? (
            <>
              {allBooks.map((book, index) => {
                const percentage = totalBooks > 0 ? ((book.value / totalBooks) * 100).toFixed(1) : 0;
                const isTopSelling = index === 0 && book.value > 0;
                // Get display name (shorter version for percentage section)
                const displayName = book.title
                  .replace(' Distributed', '')
                  .replace('Chaitanya Charitamrita', 'Chaitanya Charitamrita');
                
                return (
                  <div 
                    key={book.key} 
                    className={`flex items-center justify-between ${isTopSelling ? 'bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 sm:p-4' : ''}`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className="text-xl sm:text-2xl">{book.icon}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-medium text-gray-700">{displayName}</span>
                        {isTopSelling && (
                          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span>🏆</span>
                            <span>Top</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-32 sm:w-48 h-3 sm:h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${book.bgColor} rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-sm sm:text-base font-semibold ${book.color} min-w-[50px] text-right`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-center text-gray-500 py-4">No books distributed yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookBreakdown;

