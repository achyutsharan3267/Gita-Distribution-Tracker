import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatMobileNumber } from '../utils/maskMobileNumber';
import { getBookValue, mapBookIdToUserProperty } from '../utils/bookMapping';
import * as XLSX from 'xlsx';

const UserList = () => {
  const users = useStore((state) => state.users);
  const leaderboard = useStore((state) => state.getLeaderboard());
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);
  const { user: authUser, isAdmin } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  // Load books on mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

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

  // Export to Excel function
  const exportToExcel = () => {
    // Prepare data for Excel with all active books
    const excelData = filteredLeaderboard.map((user) => {
      // Calculate total using getBookValue to include all books (standard + new)
      const totalDistributed = books.reduce((sum, book) => {
        const bookId = book.id || book.bookId;
        return sum + getBookValue(user, bookId);
      }, 0);
      
      // Build base object with user info
      const rowData = {
        'Name': user.name || '',
        'Email': user.email || '',
        'Mobile Number': user.mobileNumber || '',
        'Bace': user.other || 'Other',
        'City': user.city || '',
      };
      
      // Add all active books dynamically
      books.forEach((book) => {
        const bookId = book.id || book.bookId;
        const value = getBookValue(user, bookId);
        rowData[book.name] = value || 0;
      });
      
      // Add totals
      rowData['Total Books Distributed'] = totalDistributed;
      rowData['Total Money Collected (₹)'] = user.totalMoney || 0;
      
      return rowData;
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devotees List');

    // Set column widths dynamically
    const columnWidths = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Mobile Number
      { wch: 15 }, // Bace
      { wch: 15 }, // City
    ];
    
    // Add widths for all books
    books.forEach(() => {
      columnWidths.push({ wch: 15 }); // Each book column
    });
    
    // Add widths for totals
    columnWidths.push({ wch: 20 }); // Total Books Distributed
    columnWidths.push({ wch: 20 }); // Total Money Collected
    
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const filename = `Devotees_List_${dateStr}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-5">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          All Devotees
        </h1>
        <p className="text-sm text-gray-600">
          View all devotees and their distribution summary
        </p>
      </div>

      {/* Search Bar, View Toggle, and Export Button */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, mobile, or email..."
                className="input-field pl-9 sm:pl-10 w-full text-sm sm:text-base"
              />
              <svg
                className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 items-center">
            {/* View Toggle Buttons */}
            <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-gray-50">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm transition-all flex items-center gap-2 ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                title="Grid View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden sm:inline font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm transition-all flex items-center gap-2 border-l border-gray-200 ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-transparent text-gray-600 hover:bg-gray-100'
                }`}
                title="List View"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden sm:inline font-medium">List</span>
              </button>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
            {filteredLeaderboard.length > 0 && isAdmin && (
              <button
                onClick={exportToExcel}
                className="px-4 py-2 text-sm bg-primary-600 hover:bg-primary-700 text-white rounded-2xl transition-all whitespace-nowrap flex items-center gap-2 font-medium active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Found {filteredLeaderboard.length} devotee{filteredLeaderboard.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-12 sm:py-16 p-4 sm:p-6">
          <div className="text-5xl sm:text-6xl mb-4">🕉️</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No Devotees found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">There are no devotees registered yet.</p>
        </div>
      ) : filteredLeaderboard.length === 0 ? (
        <div className="card text-center py-12 sm:py-16 p-4 sm:p-6">
          <div className="text-5xl sm:text-6xl mb-4">🔍</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">No results found</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">No devotees match your search query.</p>
          <button
            onClick={() => setSearchQuery('')}
            className="btn-primary text-sm sm:text-base"
          >
            Clear Search
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeaderboard.map((user) => {
            const totalDistributed = books.reduce((sum, book) => {
              const bookId = book.id || book.bookId;
              return sum + getBookValue(user, bookId);
            }, 0);
            return (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="group"
              >
                <div className="card p-5 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <div className="flex items-center space-x-3 mb-4">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-14 h-14 rounded-full border-2 border-gray-200 group-hover:border-primary-400 transition-colors flex-shrink-0 object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                        {user.name}
                      </h3>
                      <div className="space-y-0.5 mt-1">
                        <p className="text-gray-500 text-xs truncate">🏛️ {user.other || 'Other'}</p>
                        {user.city && (
                          <p className="text-gray-500 text-xs truncate">📍 {user.city}</p>
                        )}
                        {user.mobileNumber && (
                          <p className="text-gray-500 text-xs truncate">📱 {formatMobileNumber(user.mobileNumber, isAdmin, currentUserProfile?.id === user.id)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                  </div>

                  <div className={`grid gap-2 mb-4 ${books.length <= 3 ? 'grid-cols-3' : books.length <= 6 ? 'grid-cols-3' : 'grid-cols-3'}`}>
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      const value = getBookValue(user, bookId);
                      return (
                        <div key={bookId} className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <p className="text-base font-semibold text-gray-900">{value}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{book.name.split(' ')[0]}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Total Books</p>
                        <p className="text-lg font-bold text-gray-900">
                          {totalDistributed}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Money</p>
                        <p className="text-base font-semibold text-gray-900">
                          ₹{user.totalMoney.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-5">
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
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Money</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLeaderboard.map((user, index) => {
                    const totalDistributed = books.reduce((sum, book) => {
                      const bookId = book.id || book.bookId;
                      return sum + getBookValue(user, bookId);
                    }, 0);
                    return (
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
                              className="w-10 h-10 rounded-full border-2 border-gray-200 group-hover:border-primary-400 transition-colors flex-shrink-0 object-cover"
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
                              {user.mobileNumber && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">📱 {formatMobileNumber(user.mobileNumber, isAdmin, currentUserProfile?.id === user.id)} {user.city && `• ${user.city}`}</p>
                              )}
                              {!user.mobileNumber && user.city && (
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
                          {totalDistributed}
                        </td>
                        <td className="px-4 py-4 text-right font-medium text-sm text-gray-700 whitespace-nowrap">
                          ₹{user.totalMoney.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3 sm:hidden text-center font-medium">← Swipe to see all columns →</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;

