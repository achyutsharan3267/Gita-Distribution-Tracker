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
      await updateUserProfile(selectedUser.id, editData);
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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-spiritual-800 mb-2">
            🔐 Admin Dashboard
          </h1>
          <p className="text-gray-600">Manage users, profiles, and system settings</p>
        </div>
        <Link to="/" className="btn-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white">
          <p className="text-sm opacity-90">Total Users</p>
          <p className="text-3xl font-bold">{users.length}</p>
        </div>
        <div className="card bg-green-500 text-white">
          <p className="text-sm opacity-90">Total Books Distributed</p>
          <p className="text-3xl font-bold">
            {totalStats.hindiGita + totalStats.englishGita + totalStats.smallBooks + 
             (totalStats.bhagavatam || 0) + (totalStats.chaitanyaCharitamrita || 0) + 
             (totalStats.otherBooks || 0)}
          </p>
        </div>
        <div className="card bg-purple-500 text-white">
          <p className="text-sm opacity-90">Total Money Collected</p>
          <p className="text-3xl font-bold">₹{totalStats.totalMoney.toLocaleString()}</p>
        </div>
        <div className="card bg-blue-500 text-white">
          <p className="text-sm opacity-90">Active Devotees</p>
          <p className="text-3xl font-bold">
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
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">User Management</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Books</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Money</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const totalBooks = user.hindiGita + user.englishGita + user.smallBooks + 
                                 (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + 
                                 (user.otherBooks || 0);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={user.photo}
                          alt={user.name}
                          className="w-10 h-10 rounded-full mr-3"
                        />
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {user.city || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">
                      {totalBooks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      ₹{user.totalMoney.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          disabled={loading}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => setSelectedUser(user) || setShowPasswordModal(true)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                          disabled={loading}
                        >
                          🔑 Password
                        </button>
                        <Link
                          to={`/users/${user.id}`}
                          className="text-green-600 hover:text-green-800 font-medium"
                        >
                          👁️ View
                        </Link>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          disabled={loading}
                        >
                          🗑️ Delete
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

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Change Password</h3>
            <p className="text-gray-600 mb-4">
              For user: <strong>{selectedUser?.name}</strong>
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              className="input-field mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleUpdatePassword}
                className="btn-primary flex-1"
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
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Password updates require Supabase Admin API access. 
              Use Supabase Dashboard for password changes.
            </p>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit User Profile</h3>
            <div className="space-y-4">
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hindi Gita</label>
                  <input
                    type="number"
                    value={editData.hindiGita}
                    onChange={(e) => setEditData({ ...editData, hindiGita: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">English Gita</label>
                  <input
                    type="number"
                    value={editData.englishGita}
                    onChange={(e) => setEditData({ ...editData, englishGita: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Small Books</label>
                  <input
                    type="number"
                    value={editData.smallBooks}
                    onChange={(e) => setEditData({ ...editData, smallBooks: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bhagavatam</label>
                  <input
                    type="number"
                    value={editData.bhagavatam}
                    onChange={(e) => setEditData({ ...editData, bhagavatam: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chaitanya Charitamrita</label>
                  <input
                    type="number"
                    value={editData.chaitanyaCharitamrita}
                    onChange={(e) => setEditData({ ...editData, chaitanyaCharitamrita: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Books</label>
                  <input
                    type="number"
                    value={editData.otherBooks}
                    onChange={(e) => setEditData({ ...editData, otherBooks: Number(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Money</label>
                <input
                  type="number"
                  value={editData.totalMoney}
                  onChange={(e) => setEditData({ ...editData, totalMoney: Number(e.target.value) })}
                  className="input-field"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveEdit}
                className="btn-primary flex-1"
                disabled={loading}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="btn-secondary flex-1"
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

