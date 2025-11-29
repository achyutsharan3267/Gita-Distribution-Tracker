import { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const users = useStore((state) => state.users);
  const totalStats = useStore((state) => state.getTotalStats());
  const { updateUserPassword, user: currentAuthUser, signOut } = useAuth();
  const deleteUser = useStore((state) => state.deleteUser);
  const updateUserProfile = useStore((state) => state.updateUserProfile);
  const deleteActivity = useStore((state) => state.deleteActivity);
  const updateActivity = useStore((state) => state.updateActivity);
  const loadUserActivities = useStore((state) => state.loadUserActivities);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showEditActivityModal, setShowEditActivityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [editData, setEditData] = useState({});
  const [editActivityData, setEditActivityData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteClick = (userId, userName) => {
    const user = users.find(u => u.id === userId);
    setUserToDelete({ id: userId, name: userName, user });
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      setShowDeleteModal(false);
      
      // Check if deleting the currently logged in user
      const currentUserProfile = useStore.getState().currentUserProfile;
      const isDeletingSelf = currentUserProfile?.id === userToDelete.id;
      
      await deleteUser(userToDelete.id, currentAuthUser?.id);
      
      // If deleting self, sign out and redirect
      if (isDeletingSelf) {
        await signOut();
        toast.info('Your account has been deleted. You have been logged out.', {
          position: "top-right",
          autoClose: 3000,
        });
        // Redirect to Dashboard immediately
        navigate('/', { replace: true });
      } else {
        toast.success('User deleted successfully', {
          position: "top-right",
          autoClose: 3000,
        });
      }
      
      setUserToDelete(null);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
      setUserToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!selectedUser) {
      setError('No user selected');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Get the user's auth_user_id from database
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', selectedUser.id)
        .single();

      if (fetchError) throw fetchError;

      if (!userData?.auth_user_id) {
        throw new Error('User authentication ID not found');
      }

      // Call database function to reset password
      const { error: resetError } = await supabase.rpc('reset_user_password', {
        user_auth_id: userData.auth_user_id,
        new_password: newPassword
      });

      if (resetError) {
        // If RPC function doesn't work, provide helpful error message
        console.error('Password reset error:', resetError);
        throw new Error(`Password reset failed: ${resetError.message}. Please ensure the database function is set up correctly. See database/reset_user_password_function.sql`);
      }

      toast.success(`Password reset successfully for ${selectedUser.name}`, {
        position: "top-right",
        autoClose: 3000,
      });
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      setError(err.message || 'Failed to reset password');
      toast.error(`Error: ${err.message || 'Failed to reset password'}`, {
        position: "top-right",
        autoClose: 4000,
      });
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
      toast.success('User profile updated successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewActivities = async (user) => {
    setSelectedUser(user);
    setShowActivitiesModal(true);
    // Ensure activities are loaded
    try {
      await loadUserActivities(user.id);
      // Refresh user from store
      const updatedUser = users.find(u => u.id === user.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setEditActivityData({
      date: activity.date,
      hindiGita: activity.hindiGita,
      englishGita: activity.englishGita,
      smallBooks: activity.smallBooks,
      bhagavatam: activity.bhagavatam || 0,
      chaitanyaCharitamrita: activity.chaitanyaCharitamrita || 0,
      otherBooks: activity.otherBooks || 0,
      moneyReceived: activity.moneyReceived || 0,
      moneyOnline: activity.moneyOnline || 0,
      moneyOffline: activity.moneyOffline || 0,
    });
    setShowEditActivityModal(true);
  };

  const handleSaveActivityEdit = async () => {
    try {
      setLoading(true);
      await updateActivity(selectedActivity.id, editActivityData);
      toast.success('Activity updated successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      setShowEditActivityModal(false);
      setSelectedActivity(null);
      // Refresh activities list
      if (selectedUser) {
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity? This will update the user\'s totals.')) {
      return;
    }

    try {
      setLoading(true);
      await deleteActivity(activityId);
      toast.success('Activity deleted successfully', {
        position: "top-right",
        autoClose: 3000,
      });
      // Refresh activities list
      if (selectedUser) {
        const updatedUser = users.find(u => u.id === selectedUser.id);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Error: ${err.message}`, {
        position: "top-right",
        autoClose: 4000,
      });
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm sm:text-base text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                {user.name}
                              </span>
                              {user.isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-600 text-white">
                                  Admin
                                </span>
                              )}
                            </div>
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
                              title="Edit Profile"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleViewActivities(user)}
                              className="text-indigo-600 hover:text-indigo-800 font-medium"
                              disabled={loading}
                              title="View/Edit Activities"
                            >
                              📋
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowPasswordModal(true);
                              }}
                              className="text-purple-600 hover:text-purple-800 font-medium"
                              disabled={loading}
                              title="Change Password"
                            >
                              🔑
                            </button>
                            <Link
                              to={`/user/${user.id}`}
                              className="text-green-600 hover:text-green-800 font-medium"
                              title="View Profile"
                            >
                              👁️
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(user.id, user.name)}
                              className="text-red-600 hover:text-red-800 font-medium"
                              disabled={loading}
                              title="Delete User"
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
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-4 text-xs sm:text-sm">
                {error}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3 sm:mt-4">
              Password must be at least 6 characters long.
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

      {/* Activities Modal */}
      {showActivitiesModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Activities for {selectedUser.name}
            </h3>
            
            {selectedUser.activities && selectedUser.activities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Hindi</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">English</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Small</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Bhagavatam</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Chaitanya</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Other</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Money</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedUser.activities
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((activity) => {
                        const totalBooks = activity.hindiGita + activity.englishGita + activity.smallBooks + 
                                          (activity.bhagavatam || 0) + (activity.chaitanyaCharitamrita || 0) + 
                                          (activity.otherBooks || 0);
                        return (
                          <tr key={activity.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(activity.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.hindiGita}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.englishGita}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.smallBooks}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.bhagavatam || 0}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.chaitanyaCharitamrita || 0}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">{activity.otherBooks || 0}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">₹{activity.moneyReceived || 0}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditActivity(activity)}
                                  className="text-blue-600 hover:text-blue-800 font-medium"
                                  disabled={loading}
                                  title="Edit Activity"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteActivity(activity.id)}
                                  className="text-red-600 hover:text-red-800 font-medium"
                                  disabled={loading}
                                  title="Delete Activity"
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
            ) : (
              <p className="text-gray-500 text-center py-8">No activities found for this user.</p>
            )}
            
            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setShowActivitiesModal(false);
                  setSelectedUser(null);
                }}
                className="btn-secondary text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {showEditActivityModal && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Edit Activity</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editActivityData.date}
                  onChange={(e) => setEditActivityData({ ...editActivityData, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Hindi Gita</label>
                  <input
                    type="number"
                    value={editActivityData.hindiGita}
                    onChange={(e) => setEditActivityData({ ...editActivityData, hindiGita: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">English Gita</label>
                  <input
                    type="number"
                    value={editActivityData.englishGita}
                    onChange={(e) => setEditActivityData({ ...editActivityData, englishGita: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Small Books</label>
                  <input
                    type="number"
                    value={editActivityData.smallBooks}
                    onChange={(e) => setEditActivityData({ ...editActivityData, smallBooks: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Bhagavatam</label>
                  <input
                    type="number"
                    value={editActivityData.bhagavatam}
                    onChange={(e) => setEditActivityData({ ...editActivityData, bhagavatam: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Chaitanya Charitamrita</label>
                  <input
                    type="number"
                    value={editActivityData.chaitanyaCharitamrita}
                    onChange={(e) => setEditActivityData({ ...editActivityData, chaitanyaCharitamrita: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Other Books</label>
                  <input
                    type="number"
                    value={editActivityData.otherBooks}
                    onChange={(e) => setEditActivityData({ ...editActivityData, otherBooks: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Total Money Received</label>
                  <input
                    type="number"
                    value={editActivityData.moneyReceived}
                    onChange={(e) => setEditActivityData({ ...editActivityData, moneyReceived: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Money Online</label>
                  <input
                    type="number"
                    value={editActivityData.moneyOnline}
                    onChange={(e) => setEditActivityData({ ...editActivityData, moneyOnline: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Money Offline</label>
                  <input
                    type="number"
                    value={editActivityData.moneyOffline}
                    onChange={(e) => setEditActivityData({ ...editActivityData, moneyOffline: Number(e.target.value) || 0 })}
                    className="input-field text-sm sm:text-base"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={handleSaveActivityEdit}
                className="btn-primary flex-1 text-sm sm:text-base"
                disabled={loading}
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setShowEditActivityModal(false);
                  setSelectedActivity(null);
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">
              Delete User?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{userToDelete.name}</span>?
            </p>
            <p className="text-xs sm:text-sm text-red-600 text-center mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
              ⚠️ This action cannot be undone. All user data including activities will be permanently deleted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 text-sm sm:text-base py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Deleting...' : 'Yes, Delete User'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                disabled={loading}
                className="btn-secondary flex-1 text-sm sm:text-base py-2.5"
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

