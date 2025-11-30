import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { getStatsBookValue } from '../utils/bookMapping';

const BookBreakdown = () => {
  const navigate = useNavigate();
  const totalStats = useStore((state) => state.getTotalStats());
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const StatCard = ({ title, value, icon, color, isTopSelling = false }) => (
    <div className={`card p-5 relative ${isTopSelling ? 'ring-2 ring-yellow-400 ring-offset-2' : ''}`}>
      {isTopSelling && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <span>🏆</span>
          <span>Top Selling</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-500 text-xs font-medium truncate mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className="text-3xl flex-shrink-0 ml-3">{icon}</div>
      </div>
    </div>
  );

  // Calculate total books from active books
  const totalBooks = books.reduce((sum, book) => {
    const bookId = book.id || book.bookId;
    return sum + getStatsBookValue(totalStats, bookId);
  }, 0);

  // Create array of all active books with their data and sort by count (descending)
  const allBooks = books.map((book) => {
    const bookId = book.id || book.bookId;
    return {
      title: `${book.name} Distributed`,
      value: getStatsBookValue(totalStats, bookId),
      icon: book.icon || '📖',
      color: book.color || 'text-gray-600',
      bgColor: book.bgColor || 'bg-gray-600',
      key: bookId,
    };
  }).sort((a, b) => b.value - a.value); // Sort by count descending

  return (
    <div className="space-y-5">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          ← Back
        </button>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Book Distribution Breakdown
        </h1>
        <p className="text-sm text-gray-600">Detailed breakdown of all book types distributed</p>
      </div>

      {/* Total Books Summary */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs font-medium mb-1">Total Books Distributed</p>
            <p className="text-3xl font-bold text-gray-900">{totalBooks.toLocaleString()}</p>
            <p className="text-gray-500 text-xs mt-1">
              Across all book types
            </p>
          </div>
          <div className="text-5xl flex-shrink-0 ml-3">📚</div>
        </div>
      </div>

      {/* Stats Grid - Sorted by count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📊</span>
          Distribution Percentage
        </h2>
        <div className="space-y-3">
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
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isTopSelling ? 'bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4' : 'p-3'}`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-2xl flex-shrink-0">{book.icon}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate">{displayName}</span>
                        {isTopSelling && (
                          <span className="bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                            <span>🏆</span>
                            <span>Top</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 w-full sm:w-auto">
                      <div className="flex-1 sm:w-32 sm:flex-none h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 min-w-[45px] text-right">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <p className="text-center text-gray-400 py-4 text-sm">No books distributed yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookBreakdown;

