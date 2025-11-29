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
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {books.map((book) => {
          const bookId = book.id || book.bookId;
          return (
            <div
              key={bookId}
              className="card p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl sm:text-4xl ${book.color || 'text-gray-600'}`}>
                    {book.icon || '📖'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {book.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      {book.description || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Section */}
              <div className={`${book.bgColor || 'bg-gray-600'} text-white rounded-lg p-4 sm:p-5 mt-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-white/80 font-medium mb-1">
                      Price per Book
                    </p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                      ₹{book.price || 0}
                    </p>
                  </div>
                  <div className="text-3xl sm:text-4xl opacity-80">
                    💰
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Book ID:</span>
                  <span className="font-mono text-xs text-gray-500">{bookId}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4">📊 Price Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {books.map((book) => {
            const bookId = book.id || book.bookId;
            return (
              <div key={bookId} className="text-center">
                <p className="text-xs sm:text-sm text-spiritual-100 mb-1 truncate">
                  {book.name.split(' ')[0]}
                </p>
                <p className="text-lg sm:text-xl font-bold">₹{book.price || 0}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-spiritual-400/30">
          <p className="text-sm text-spiritual-100">
            💡 <strong>Note:</strong> Prices are per book. Total amount collected may vary based on quantity distributed.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BooksAndPrices;

