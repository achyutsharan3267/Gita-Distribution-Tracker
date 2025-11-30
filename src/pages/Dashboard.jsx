import { useStore } from '../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getBookValue, getStatsBookValue } from '../utils/bookMapping';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// Prabhupada ji's quotes about book distribution
const quotes = [
  {
    text: "Books are the basis. Books are the foundation. Without books, there is no question of preaching.",
    source: "Srila Prabhupada"
  },
  {
    text: "The book distribution is the most important function. If you can distribute books, then you are doing the best service.",
    source: "Srila Prabhupada"
  },
  {
    text: "Book distribution is the most important activity. If you can distribute books, then you are doing the best service to Krishna.",
    source: "Srila Prabhupada"
  },
  {
    text: "The more books you distribute, the more you become Krishna conscious. That is the secret.",
    source: "Srila Prabhupada"
  },
  {
    text: "Books are the most important thing. Without books, there is no question of preaching. Books are the basis.",
    source: "Srila Prabhupada"
  },
  {
    text: "If you can distribute books, then you are doing the best service. Book distribution is the most important function.",
    source: "Srila Prabhupada"
  },
  {
    text: "The book distribution is the most important activity. If you can distribute books, then you are doing the best service.",
    source: "Srila Prabhupada"
  },
  {
    text: "Books are the basis. Without books, there is no question of preaching. Books are the foundation.",
    source: "Srila Prabhupada"
  }
];

const Dashboard = () => {
  const totalStats = useStore((state) => state.getTotalStats());
  const leaderboard = useStore((state) => state.getLeaderboard());
  const activeDevotees = useStore((state) => state.getActiveDevotees());
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);
  const initialize = useStore((state) => state.initialize);
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const getSadhnaForDate = useStore((state) => state.getSadhnaForDate);
  const { user: authUser } = useAuth();
  const navigate = useNavigate();

  const [currentQuote, setCurrentQuote] = useState(quotes[0]);
  const [isSadhnaPending, setIsSadhnaPending] = useState(false);
  const [checkingSadhna, setCheckingSadhna] = useState(true);
  const [todaySadhna, setTodaySadhna] = useState(null);

  // Rotate quotes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
    }, 10000); // Change quote every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Check if today's sadhna is pending
  useEffect(() => {
    const checkTodaySadhna = async () => {
      if (!currentUserProfile) {
        setCheckingSadhna(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];
        const sadhna = await getSadhnaForDate(currentUserProfile.id, today);
        setTodaySadhna(sadhna);
        setIsSadhnaPending(!sadhna);
      } catch (error) {
        console.error('Error checking sadhna:', error);
        setIsSadhnaPending(false);
        setTodaySadhna(null);
      } finally {
        setCheckingSadhna(false);
      }
    };

    checkTodaySadhna();
  }, [currentUserProfile, getSadhnaForDate]);

  // Filter out users with 0 total books
  const activeLeaderboard = leaderboard.filter((user) => user.totalDistributed > 0);
  const top3 = activeLeaderboard.slice(0, 3);
  const top10 = activeLeaderboard.slice(0, 10);

  // Calculate total books from active books
  // Use getStatsBookValue to handle both standard books and bookDistributions
  const totalBooks = books.reduce((sum, book) => {
    const bookId = book.id || book.bookId;
    return sum + getStatsBookValue(totalStats, bookId);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Greeting Section */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Hare Krishna {currentUserProfile?.name?.split(' ')[0] || 'Devotee'} 👋
          </h1>
          <p className="text-sm text-gray-600">
            Every book distributed brings us closer to spreading divine knowledge.
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              await initialize(authUser?.id);
              toast.success('Dashboard refreshed');
            } catch (error) {
              toast.error('Failed to refresh: ' + error.message);
            }
          }}
          className="btn-secondary text-sm px-3 py-2"
          title="Refresh Dashboard"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Today's Sadhna Status */}
      {!checkingSadhna && currentUserProfile && (
        <>
          {/* Pending Notification */}
          {isSadhnaPending && (
            <div className="card p-4 sm:p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">⏳</div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                      Today's Sadhna Pending
                    </h3>
                    <p className="text-sm text-gray-700 mb-3">
                      You haven't submitted your daily sadhna for today. Please fill it out to track your spiritual practices.
                    </p>
                    <Link
                      to="/sadhna"
                      className="inline-flex items-center gap-2 btn-primary text-sm px-4 py-2"
                    >
                      <span>🕉️</span>
                      <span>Submit Today's Sadhna</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completed Sadhna - Rounds Count */}
          {!isSadhnaPending && todaySadhna && todaySadhna.totalRounds > 0 && (() => {
            const targetRounds = 16;
            const completedRounds = todaySadhna.totalRounds;
            const percentage = Math.min((completedRounds / targetRounds) * 100, 100);
            const isExceeded = completedRounds > targetRounds;
            
            // Color based on percentage
            let bgGradient = '';
            let borderColor = '';
            let textColor = '';
            let progressColor = '';
            
            if (percentage < 25) {
              bgGradient = 'from-red-50 to-orange-50';
              borderColor = 'border-red-300';
              textColor = 'text-red-700';
              progressColor = 'bg-red-500';
            } else if (percentage < 50) {
              bgGradient = 'from-orange-50 to-yellow-50';
              borderColor = 'border-orange-300';
              textColor = 'text-orange-700';
              progressColor = 'bg-orange-500';
            } else if (percentage < 75) {
              bgGradient = 'from-yellow-50 to-green-50';
              borderColor = 'border-yellow-300';
              textColor = 'text-yellow-700';
              progressColor = 'bg-yellow-500';
            } else if (percentage < 100) {
              bgGradient = 'from-green-50 to-emerald-50';
              borderColor = 'border-green-300';
              textColor = 'text-green-700';
              progressColor = 'bg-green-500';
            } else {
              bgGradient = 'from-emerald-50 to-teal-50';
              borderColor = 'border-emerald-400';
              textColor = 'text-emerald-700';
              progressColor = 'bg-emerald-500';
            }
            
            return (
              <div className={`card p-4 sm:p-5 bg-gradient-to-r ${bgGradient} border-2 ${borderColor} relative overflow-hidden`}>
                {isExceeded && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                      <span>⭐</span>
                      <span>Exceeded Target!</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">📿</div>
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                        Today's Japa Rounds
                      </h3>
                      <p className="text-sm text-gray-700">
                        {isExceeded 
                          ? `Amazing! You've exceeded the daily target of ${targetRounds} rounds! 🙏`
                          : `You've completed your sadhna for today`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl sm:text-4xl font-bold ${textColor}`}>
                      {completedRounds}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      / {targetRounds} Rounds
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(percentage)}% Complete
                    </p>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-full ${progressColor} transition-all duration-500 ease-out rounded-full flex items-center justify-end pr-1`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    >
                      {percentage >= 50 && (
                        <span className="text-white text-xs font-bold">✓</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {(todaySadhna.firstRoundTiming || todaySadhna.lastRoundTiming) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-4 text-sm">
                    {todaySadhna.firstRoundTiming && (
                      <div>
                        <span className="text-gray-600">First Round:</span>
                        <span className="font-semibold text-gray-900 ml-2">{todaySadhna.firstRoundTiming}</span>
                      </div>
                    )}
                    {todaySadhna.lastRoundTiming && (
                      <div>
                        <span className="text-gray-600">Last Round:</span>
                        <span className="font-semibold text-gray-900 ml-2">{todaySadhna.lastRoundTiming}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {/* User's Personal Stats - Only if logged in */}
      {currentUserProfile && (() => {
        // Calculate Amount as per Books based on user's total books
        let amountAsPerBooks = 0;
        books.forEach(book => {
          const bookId = book.id || book.bookId;
          const count = getBookValue(currentUserProfile, bookId);
          const price = parseFloat(book.price || 0);
          amountAsPerBooks += count * price;
        });

        // Calculate Insufficient Funds (if Amount as per Books > Total Money Collected)
        const insufficientFunds = amountAsPerBooks > currentUserProfile.totalMoney 
          ? amountAsPerBooks - currentUserProfile.totalMoney 
          : 0;

        // Calculate Donation Amount (if Total Money Collected > Amount as per Books)
        const donationAmount = currentUserProfile.totalMoney > amountAsPerBooks 
          ? currentUserProfile.totalMoney - amountAsPerBooks 
          : 0;

        return (
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-primary-50 to-sage-50 border border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Your Contribution</h2>
              <span className="text-2xl">🙏</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white/60 rounded-xl p-3 sm:p-4 hover:bg-white/80 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📚</span>
                    <p className="text-xs text-gray-600 font-medium">Your Books</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {books.reduce((sum, book) => {
                      const bookId = book.id || book.bookId;
                      return sum + getBookValue(currentUserProfile, bookId);
                    }, 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total distributed</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 sm:p-4 hover:bg-white/80 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">💰</span>
                    <p className="text-xs text-gray-600 font-medium">Money Collected</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    ₹{currentUserProfile.totalMoney.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Total collected</p>
                </div>
                <div className="bg-white/60 rounded-xl p-3 sm:p-4 hover:bg-white/80 transition-colors col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📊</span>
                    <p className="text-xs text-gray-600 font-medium">Amount as per Books</p>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    ₹{amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Expected amount</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {insufficientFunds > 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">⚠️</span>
                      <p className="text-xs text-red-600 font-medium">Insufficient Funds</p>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 break-words">
                      ₹{insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-red-500 mt-1">Loss</p>
                  </div>
                ) : (
                  <div className={`rounded-xl p-3 sm:p-4 ${donationAmount > 0 ? 'bg-green-50 border border-green-200' : 'bg-white/60 hover:bg-white/80 transition-colors'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">✨</span>
                      <p className={`text-xs font-medium ${donationAmount > 0 ? 'text-green-600' : 'text-gray-600'}`}>Donation Amount</p>
                    </div>
                    <p className={`text-xl sm:text-2xl font-bold break-words ${donationAmount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                      ₹{donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs mt-1 ${donationAmount > 0 ? 'text-green-500' : 'text-gray-500'}`}>
                      {donationAmount > 0 ? 'Profit' : 'No profit'}
                    </p>
                  </div>
                )}
                <div className="bg-white/60 rounded-xl p-3 sm:p-4 hover:bg-white/80 transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🏆</span>
                    <p className="text-xs text-gray-600 font-medium">Your Rank</p>
                  </div>
                  {(() => {
                    // Calculate user's total books
                    const userTotalBooks = books.reduce((sum, book) => {
                      const bookId = book.id || book.bookId;
                      return sum + getBookValue(currentUserProfile, bookId);
                    }, 0);
                    
                    // If user has no books distributed, show "not yet participate"
                    if (userTotalBooks === 0) {
                      return (
                        <>
                          <p className="text-base sm:text-lg font-semibold text-gray-500 italic">
                            Not yet participate
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Start distributing books</p>
                        </>
                      );
                    }
                    
                    // Find rank in active leaderboard (only users with books > 0)
                    const rankIndex = activeLeaderboard.findIndex(u => u.id === currentUserProfile.id);
                    return (
                      <>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {rankIndex >= 0 ? `#${rankIndex + 1}` : '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Leaderboard position</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Books Card - Clickable */}
        <div 
          onClick={() => navigate('/books-prices')}
          className="card p-5 cursor-pointer active:scale-[0.98] transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Books</p>
              <p className="text-3xl font-bold text-gray-900">
                {books.length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tap to see prices →</p>
            </div>
            <span className="text-4xl">📖</span>
          </div>
        </div>

        {/* Total Books Card - Clickable */}
        <div 
          onClick={() => navigate('/books')}
          className="card p-5 cursor-pointer active:scale-[0.98] transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Books Distributed</p>
              <p className="text-3xl font-bold text-gray-900">
                {totalBooks.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Tap to see breakdown →</p>
            </div>
            <span className="text-4xl">📚</span>
          </div>
        </div>

        {/* Active Devotees Card */}
        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Devotees</p>
              <p className="text-3xl font-bold text-gray-900">{activeDevotees.length}</p>
              <p className="text-xs text-gray-500 mt-1">Actively distributing</p>
            </div>
            <span className="text-4xl">🕉️</span>
          </div>
        </div>

        {/* Total Money Collected Card */}
        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Money Collected</p>
              <p className="text-3xl font-bold text-gray-900">
                ₹{totalStats.totalMoney.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">From all distributions</p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>

        {/* Average per Devotee */}
        <div className="card p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Books per Devotee</p>
              <p className="text-3xl font-bold text-gray-900">
                {activeDevotees.length > 0 ? Math.round(totalBooks / activeDevotees.length) : 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average distribution</p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>
      </div>

      {/* Book Type Breakdown - Quick View */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Book Distribution Overview</h2>
          <Link 
            to="/books"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>
        {books.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">Loading books...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {books.slice(0, 6).map((book) => {
              const bookId = book.id || book.bookId;
              const value = getStatsBookValue(totalStats, bookId);
              const percentage = totalBooks > 0 ? ((value / totalBooks) * 100).toFixed(0) : 0;
              return (
                <div key={bookId} className="bg-gray-50 rounded-xl p-3 text-center hover:bg-gray-100 transition-colors">
                  <div className="text-2xl mb-1">{book.icon || '📖'}</div>
                  <p className="text-base font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{book.name.split(' ')[0]}</p>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{percentage}%</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspirational Quote Section */}
      <div className="card p-5 bg-gradient-to-br from-primary-50 to-sage-50 border border-primary-100">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 text-3xl">📖</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 italic leading-relaxed mb-2">
              "{currentQuote.text}"
            </p>
            <p className="text-xs text-gray-500 font-medium">
              — {currentQuote.source}
            </p>
          </div>
        </div>
      </div>

      {/* Top Distributors Section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top Distributors</h2>
          <span className="text-sm text-gray-500">{top3.length}</span>
        </div>
        {top3.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No Devotees found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {top3.map((user, index) => {
              const progress = user.totalDistributed > 0 ? Math.min((user.totalDistributed / Math.max(...top3.map(u => u.totalDistributed))) * 100, 100) : 0;
              const statusColor = progress >= 70 ? 'bg-primary-500' : progress >= 40 ? 'bg-yellow-400' : 'bg-gray-300';
              const statusText = progress >= 70 ? 'On track' : progress >= 40 ? 'Needs attention' : 'Getting started';
              
              return (
                <Link
                  key={user.id}
                  to={`/user/${user.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      <span className="text-2xl">
                        {index === 0 ? '🏆' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                        <p className="text-sm font-bold text-gray-900">{user.totalDistributed} books</p>
                      </div>
                      <div className="progress-bar mb-1">
                        <div 
                          className={`progress-fill ${statusColor}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{statusText}</span>
                        <span className="text-xs text-gray-500">{Math.round(progress)}%</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Top 10 Leaderboard */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Top 10 Leaderboard</h2>
          <span className="text-sm text-gray-500">{top10.length}</span>
        </div>
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 rounded-xl">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-[950px] sm:min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[120px]">Devotee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">Bace</th>
                  {books.map((book) => {
                    const bookId = book.id || book.bookId;
                    return (
                      <th key={bookId} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {book.name.split(' ')[0]}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {top10.length === 0 ? (
                  <tr>
                    <td colSpan={5 + books.length} className="py-12 text-center">
                      <p className="text-gray-400 text-base font-medium">No Devotees found</p>
                    </td>
                  </tr>
                ) : (
                  top10.map((user, index) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/user/${user.id}`}
                        className="flex justify-center group"
                      >
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-primary-500 transition-colors duration-200 flex-shrink-0"
                        />
                      </Link>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                            ? 'bg-gray-300 text-gray-800'
                            : index === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap min-w-[120px]">
                      <Link
                        to={`/user/${user.id}`}
                        className="group"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-900 group-hover:text-primary-600 truncate transition-colors">
                            {user.name}
                          </p>
                          {user.city && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">📍 {user.city}</p>
                          )}
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-left font-medium text-sm whitespace-nowrap min-w-[100px]">
                      <span className="text-gray-700">🏛️ {user.other || 'Other'}</span>
                    </td>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      return (
                        <td key={bookId} className="px-4 py-4 text-right font-medium text-sm whitespace-nowrap text-gray-700">
                          {getBookValue(user, bookId)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-right font-semibold text-sm text-gray-900 whitespace-nowrap">
                      {user.totalDistributed}
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 sm:hidden text-center font-medium">← Swipe to see all columns →</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/users"
          className="card p-5 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                👥 View All Devotees
              </p>
              <p className="text-xs text-gray-500 mt-1">See complete list</p>
            </div>
            <span className="text-2xl group-hover:scale-110 transition-transform">→</span>
          </div>
        </Link>
        
        <Link
          to="/books"
          className="card p-5 hover:shadow-md transition-all active:scale-[0.98] cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                📊 Book Breakdown
              </p>
              <p className="text-xs text-gray-500 mt-1">Detailed statistics</p>
            </div>
            <span className="text-2xl group-hover:scale-110 transition-transform">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;

