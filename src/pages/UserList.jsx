import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';

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

  // Export to Excel function
  const exportToExcel = () => {
    // Prepare data for Excel
    const excelData = filteredLeaderboard.map((user) => {
      const totalDistributed = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
      
      return {
        'Name': user.name || '',
        'Email': user.email || '',
        'Mobile Number': user.mobileNumber || '',
        'City': user.city || '',
        'Hindi Gita': user.hindiGita || 0,
        'English Gita': user.englishGita || 0,
        'Small Books': user.smallBooks || 0,
        'Bhagavatam': user.bhagavatam || 0,
        'Chaitanya Charitamrita': user.chaitanyaCharitamrita || 0,
        'Other Books': user.otherBooks || 0,
        'Total Books Distributed': totalDistributed,
        'Total Money Collected (₹)': user.totalMoney || 0,
      };
    });

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Devotees List');

    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 15 }, // Mobile Number
      { wch: 15 }, // City
      { wch: 12 }, // Hindi Gita
      { wch: 13 }, // English Gita
      { wch: 12 }, // Small Books
      { wch: 12 }, // Bhagavatam
      { wch: 20 }, // Chaitanya Charitamrita
      { wch: 12 }, // Other Books
      { wch: 20 }, // Total Books Distributed
      { wch: 20 }, // Total Money Collected
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const filename = `Devotees_List_${dateStr}.xlsx`;

    // Write file and trigger download
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8">
      <div className="text-center px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
          All Devotees
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          View all devotees and their distribution summary
        </p>
      </div>

      {/* Search Bar and Export Button */}
      <div className="card p-4 sm:p-6">
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
          <div className="flex gap-2 sm:gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
            {filteredLeaderboard.length > 0 && (
              <button
                onClick={exportToExcel}
                className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export to Excel
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
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredLeaderboard.map((user) => {
            const totalDistributed = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
            return (
              <Link
                key={user.id}
                to={`/user/${user.id}`}
                className="group"
              >
                <div className="card p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
                  <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                    <img
                      src={user.photo}
                      alt={user.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-spiritual-200 group-hover:border-spiritual-400 transition-colors flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 group-hover:text-spiritual-600 transition-colors truncate">
                      {user.name}
                    </h3>
                    <div className="space-y-0.5 sm:space-y-1">
                      {user.city && (
                        <p className="text-gray-600 text-xs sm:text-sm truncate">📍 {user.city}</p>
                      )}
                      {user.mobileNumber && (
                        <p className="text-gray-600 text-xs sm:text-sm truncate">📱 {user.mobileNumber}</p>
                      )}
                    </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-4">
                    <div className="bg-spiritual-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-base sm:text-lg font-bold text-spiritual-600">{user.hindiGita}</p>
                      <p className="text-xs text-gray-600">Hindi Gita</p>
                    </div>
                    <div className="bg-primary-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-base sm:text-lg font-bold text-primary-600">{user.englishGita}</p>
                      <p className="text-xs text-gray-600">English Gita</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-base sm:text-lg font-bold text-green-600">{user.smallBooks}</p>
                      <p className="text-xs text-gray-600">Small Books</p>
                    </div>
                  </div>

                  <div className="border-t pt-3 sm:pt-4">
                    <div className="flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Total Distributed</p>
                        <p className="text-xl sm:text-2xl font-bold text-spiritual-600">
                          {totalDistributed}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-xs sm:text-sm text-gray-600">Money Collected</p>
                        <p className="text-base sm:text-lg font-bold text-purple-600">
                          ₹{user.totalMoney.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t">
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

