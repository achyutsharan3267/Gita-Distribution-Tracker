import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useStore } from '../store/useStore';

const BooksAndPrices = () => {
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  return (
    <div className="max-w-6xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
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
          📚 Books & Prices
        </h1>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Complete list of all books and their prices
        </p>
      </div>

      {/* Books Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {books.map((book) => {
          const bookId = book.id || book.bookId;
          return (
            <div
              key={bookId}
              className="bg-slate-800 dark:bg-white rounded-lg border border-slate-700 dark:border-gray-300 transition-colors duration-500 p-3"
            >
              {/* Book Name and Price */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-300 dark:text-gray-800 transition-colors duration-500">
                  {book.name}
                </span>
                <span className="text-sm font-bold text-yellow-400 dark:text-yellow-600 transition-colors duration-500">
                  ₹ {book.price || 0}
                </span>
              </div>
              
              {/* Description */}
              {book.description && (
                <p className="text-xs text-gray-400 dark:text-gray-600 mb-2 transition-colors duration-500 line-clamp-2">
                  {book.description}
                </p>
              )}
              
              {/* Book ID */}
              {bookId && (
                <div className="pt-2 border-t border-slate-700 dark:border-gray-300">
                  <p className="text-xs text-gray-500 dark:text-gray-500 transition-colors duration-500">
                    <span className="text-gray-400 dark:text-gray-600">ID:</span>{' '}
                    <span className="font-mono">{bookId}</span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-bold mb-3">📊 Price Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {books.map((book) => {
            const bookId = book.id || book.bookId;
            return (
              <div key={bookId} className="text-center">
                <p className="text-xs text-spiritual-100 mb-1 truncate">
                  {book.name.split(' ')[0]}
                </p>
                <p className="text-base sm:text-lg font-bold">₹{book.price || 0}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-3 border-t border-spiritual-400/30">
          <p className="text-xs sm:text-sm text-spiritual-100">
            💡 <strong>Note:</strong> Prices are per book. Total amount collected may vary based on quantity distributed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BooksAndPrices;

