import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const users = useStore((state) => state.users);
  const totalStats = useStore((state) => state.getTotalStats());
  const { updateUserPassword } = useAuth();
  const deleteUser = useStore((state) => state.deleteUser);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const deleteActivity = useStore((state) => state.deleteActivity);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteUser(userId);
      alert('User deleted successfully');
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      // Note: This requires Supabase Admin API or a database function
      // For now, we'll show a message
      alert('Password update requires Supabase Admin API. Please use Supabase Dashboard to update passwords.');
      setShowPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditData({
      name: user.name,
      city: user.city || '',
      mobileNumber: user.mobileNumber || '',
      hindiGita: user.hindiGita,
      englishGita: user.englishGita,
      smallBooks: user.smallBooks,
      bhagavatam: user.bhagavatam || 0,
      chaitanyaCharitamrita: user.chaitanyaCharitamrita || 0,
      otherBooks: user.otherBooks || 0,
      totalMoney: user.totalMoney,
    });
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      setLoading(true);
      await updateUserProfile(selectedUser.id, {
        ...editData,
        mobileNumber: editData.mobileNumber,
      });
      alert('User profile updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
            🔐 Admin Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Manage users, profiles, and system settings</p>
        </div>
        <Link to="/" className="btn-secondary text-sm sm:text-base text-center sm:text-left whitespace-nowrap">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Total Users</p>
          <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
        </div>
        <div className="card bg-green-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Total Books Distributed</p>
          <p className="text-2xl sm:text-3xl font-bold">
            {totalStats.hindiGita + totalStats.englishGita + totalStats.smallBooks + 
             (totalStats.bhagavatam || 0) + (totalStats.chaitanyaCharitamrita || 0) + 
             (totalStats.otherBooks || 0)}
          </p>
        </div>
        <div className="card bg-purple-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Total Money Collected</p>
          <p className="text-2xl sm:text-3xl font-bold">₹{totalStats.totalMoney.toLocaleString()}</p>
        </div>
        <div className="card bg-blue-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Active Devotees</p>
          <p className="text-2xl sm:text-3xl font-bold">
            {users.filter(u => {
              const total = u.hindiGita + u.englishGita + u.smallBooks + 
                           (u.bhagavatam || 0) + (u.chaitanyaCharitamrita || 0) + 
                           (u.otherBooks || 0);
              return total > 0;
            }).length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">User Management</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">City</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Books</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Money</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => {
                    const totalBooks = user.hindiGita + user.englishGita + user.smallBooks + 
                                     (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + 
                                     (user.otherBooks || 0);
                    return (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={user.photo}
                              alt={user.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3 flex-shrink-0"
                            />
                            <span className="font-medium text-sm sm:text-base text-gray-900 truncate max-w-[120px] sm:max-w-none">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-600 text-sm sm:text-base hidden sm:table-cell">
                          {user.city || '-'}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-900 font-semibold text-sm sm:text-base">
                          {totalBooks}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-gray-900 text-sm sm:text-base hidden md:table-cell">
                          ₹{user.totalMoney.toLocaleString()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                              disabled={loading}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => setSelectedUser(user) || setShowPasswordModal(true)}
                              className="text-purple-600 hover:text-purple-800 font-medium"
                              disabled={loading}
                            >
                              🔑
                            </button>
                            <Link
                              to={`/user/${user.id}`}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              👁️
                            </Link>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="text-red-600 hover:text-red-800 font-medium"
                              disabled={loading}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Change Password</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              For user: <strong>{selectedUser?.name}</strong>
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="input-field mb-3 sm:mb-4 text-sm sm:text-base"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleUpdatePassword}
                className="btn-primary flex-1 text-sm sm:text-base"
                disabled={loading}
              >
                Update Password
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setSelectedUser(null);
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 sm:mt-4">
              Note: Password updates require Supabase Admin API access. 
              Use Supabase Dashboard for password changes.
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Edit User Profile</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  value={editData.mobileNumber}
                  onChange={(e) => setEditData({ ...editData, mobileNumber: e.target.value })}
                  className="input-field"
                  placeholder="+91 9876543210"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Hindi Gita</label>
                  <input
                    type="number"
                    value={editData.hindiGita}
                    onChange={(e) => setEditData({ ...editData, hindiGita: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">English Gita</label>
                  <input
                    type="number"
                    value={editData.englishGita}
                    onChange={(e) => setEditData({ ...editData, englishGita: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Small Books</label>
                  <input
                    type="number"
                    value={editData.smallBooks}
                    onChange={(e) => setEditData({ ...editData, smallBooks: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bhagavatam</label>
                  <input
                    type="number"
                    value={editData.bhagavatam}
                    onChange={(e) => setEditData({ ...editData, bhagavatam: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Chaitanya Charitamrita</label>
                  <input
                    type="number"
                    value={editData.chaitanyaCharitamrita}
                    onChange={(e) => setEditData({ ...editData, chaitanyaCharitamrita: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Other Books</label>
                  <input
                    type="number"
                    value={editData.otherBooks}
                    onChange={(e) => setEditData({ ...editData, otherBooks: Number(e.target.value) })}
                    className="input-field text-sm sm:text-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Money</label>
                <input
                  type="number"
                  value={editData.totalMoney}
                  onChange={(e) => setEditData({ ...editData, totalMoney: Number(e.target.value) })}
                  className="input-field text-sm sm:text-base"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={handleSaveEdit}
                className="btn-primary flex-1 text-sm sm:text-base"
                disabled={loading}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

