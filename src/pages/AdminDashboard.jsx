import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { getBookValue, getStatsBookValue, getActivityBookValue } from '../utils/bookMapping';

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
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);
  const addBook = useStore((state) => state.addBook);
  const deleteBook = useStore((state) => state.deleteBook);

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
  const [activeSection, setActiveSection] = useState('tiles'); // 'tiles', 'users', 'books', 'settings'
  
  // Books management state
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [showDeleteBookModal, setShowDeleteBookModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [newBook, setNewBook] = useState({
    name: '',
    price: '',
    description: '',
  });

  // Generate 12-character Book ID using a-z, A-Z, 0-9 and hyphens
  // Example: aakd-2802-jkss
  const generateBookId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
    let id = '';
    
    // Generate 12 characters
    for (let i = 0; i < 12; i++) {
      // Add hyphen at positions 4 and 9 (0-indexed: positions 4 and 9)
      if (i === 4 || i === 9) {
        id += '-';
      } else {
        // Random character from a-z, A-Z, 0-9
        const randomChar = chars.charAt(Math.floor(Math.random() * (chars.length - 1))); // Exclude hyphen from random selection
        id += randomChar;
      }
    }
    
    return id;
  };

  // Load books from database on component mount
  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Handle add book
  const handleAddBook = async () => {
    if (!newBook.name || !newBook.price) {
      toast.error('Please fill in all required fields (Name, Price)');
      return;
    }

    // Generate unique Book ID
    let bookId;
    let attempts = 0;
    do {
      bookId = generateBookId();
      attempts++;
      if (attempts > 100) {
        toast.error('Unable to generate unique Book ID. Please try again.');
        return;
      }
    } while (books.some(b => b.id === bookId || b.bookId === bookId));

    try {
      setLoading(true);
      // Default values for auto-generated fields
      const bookToAdd = {
        bookId: bookId,
        name: newBook.name,
        price: Number(newBook.price),
        description: newBook.description || '',
        icon: '📖', // Default icon
        color: 'text-gray-600', // Default color
        bgColor: 'bg-gray-600', // Default background color
      };

      await addBook(bookToAdd);
      toast.success('Book added successfully!');
      
      // Reset form
      setNewBook({
        name: '',
        price: '',
        description: '',
      });
      setShowAddBookModal(false);
    } catch (error) {
      console.error('Error adding book:', error);
      toast.error(error.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete book
  const handleDeleteBook = async () => {
    if (!bookToDelete) return;

    try {
      setLoading(true);
      const bookIdToDelete = bookToDelete.id || bookToDelete.bookId;
      await deleteBook(bookIdToDelete);
      toast.success('Book deleted successfully!');
      setShowDeleteBookModal(false);
      setBookToDelete(null);
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error(error.message || 'Failed to delete book');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete book click
  const handleDeleteBookClick = (book) => {
    setBookToDelete(book);
    setShowDeleteBookModal(true);
  };

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

      {/* Management Tiles - Always visible */}
      {activeSection === 'tiles' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Manage Users Tile */}
        <div
          onClick={() => setActiveSection('users')}
          className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            activeSection === 'users' ? 'ring-2 ring-spiritual-500 ring-offset-2' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-3xl">
              👥
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{users.length}</p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Users</h3>
          <p className="text-sm text-gray-600 mb-4">
            View, edit, delete users and manage their profiles
          </p>
          <div className="flex items-center text-spiritual-600 font-medium text-sm">
            <span>View Details</span>
            <span className="ml-2">→</span>
          </div>
        </div>

        {/* Manage Books Tile */}
        <div
          onClick={() => setActiveSection('books')}
          className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            activeSection === 'books' ? 'ring-2 ring-spiritual-500 ring-offset-2' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center text-3xl">
              📚
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{books.length}</p>
              <p className="text-xs text-gray-500">Total Books</p>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Manage Books</h3>
          <p className="text-sm text-gray-600 mb-4">
            Add, edit, or delete books and manage prices
          </p>
          <div className="flex items-center text-spiritual-600 font-medium text-sm">
            <span>View Details</span>
            <span className="ml-2">→</span>
          </div>
        </div>

        {/* System Settings Tile */}
        <div
          onClick={() => setActiveSection('settings')}
          className={`card p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            activeSection === 'settings' ? 'ring-2 ring-spiritual-500 ring-offset-2' : ''
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center text-3xl">
              ⚙️
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">—</p>
              <p className="text-xs text-gray-500">Settings</p>
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">System Settings</h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure system settings and preferences
          </p>
          <div className="flex items-center text-spiritual-600 font-medium text-sm">
            <span>View Details</span>
            <span className="ml-2">→</span>
          </div>
        </div>
      </div>
      )}

      {/* Back to Tiles Button */}
      {activeSection !== 'tiles' && (
        <div className="flex justify-start">
          <button
            onClick={() => setActiveSection('tiles')}
            className="btn-secondary text-sm sm:text-base"
          >
            ← Back to Dashboard
          </button>
        </div>
      )}

      {/* Stats Overview - Only show in Manage Users section */}
      {activeSection === 'users' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="card bg-gradient-to-r from-spiritual-500 to-primary-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Total Users</p>
          <p className="text-2xl sm:text-3xl font-bold">{users.length}</p>
        </div>
        <div className="card bg-green-500 text-white p-4 sm:p-6">
          <p className="text-xs sm:text-sm opacity-90">Total Books Distributed</p>
          <p className="text-2xl sm:text-3xl font-bold">
            {books.reduce((sum, book) => {
              const bookId = book.id || book.bookId;
              return sum + getStatsBookValue(totalStats, bookId);
            }, 0)}
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
              const total = books.reduce((sum, book) => {
                const bookId = book.id || book.bookId;
                return sum + getBookValue(u, bookId);
              }, 0);
              return total > 0;
            }).length}
          </p>
        </div>
      </div>
      )}

      {/* Books Management Section */}
      {activeSection === 'books' && (
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">📚 Books Management</h2>
          <button
            onClick={() => setShowAddBookModal(true)}
            className="btn-primary text-sm sm:text-base whitespace-nowrap"
          >
            ➕ Add New Book
          </button>
        </div>

        {books.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No books found. Add your first book!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Name</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book ID</th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₹)</th>
                  <th className="px-4 sm:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((book) => {
                      const bookId = book.id || book.bookId;
                      return (
                        <tr key={bookId} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-2xl">
                            {book.icon || '📖'}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{book.name}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm text-gray-500">{book.description || '—'}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">{bookId}</code>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-semibold text-gray-900">₹{book.price || 0}</div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleDeleteBookClick(book)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                              title="Delete Book"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {/* Users Table */}
      {activeSection === 'users' && (
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
                    const totalBooks = books.reduce((sum, book) => {
                      const bookId = book.id || book.bookId;
                      return sum + getBookValue(user, bookId);
                    }, 0);
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
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
      <div className="card p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">⚙️ System Settings</h2>
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Database Information</h3>
            <p className="text-sm text-gray-600">Total Users: {users.length}</p>
            <p className="text-sm text-gray-600">Total Books: {books.length}</p>
            <p className="text-sm text-gray-600">Total Activities: {users.reduce((sum, u) => sum + (u.activities?.length || 0), 0)}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">System Statistics</h3>
            <p className="text-sm text-gray-600">Total Books Distributed: {totalStats.hindiGita + totalStats.englishGita + totalStats.smallBooks + (totalStats.bhagavatam || 0) + (totalStats.chaitanyaCharitamrita || 0) + (totalStats.otherBooks || 0)}</p>
            <p className="text-sm text-gray-600">Total Money Collected: ₹{totalStats.totalMoney.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Active Devotees: {users.filter(u => {
              const total = u.hindiGita + u.englishGita + u.smallBooks + 
                           (u.bhagavatam || 0) + (u.chaitanyaCharitamrita || 0) + 
                           (u.otherBooks || 0);
              return total > 0;
            }).length}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-600">More settings and configuration options will be available here.</p>
          </div>
        </div>
      </div>
      )}

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
                      {books.map((book) => {
                        const bookId = book.id || book.bookId;
                        return (
                          <th key={bookId} className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {book.name.split(' ')[0]}
                          </th>
                        );
                      })}
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Money</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedUser.activities
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((activity) => {
                        const totalBooks = books.reduce((sum, book) => {
                          const bookId = book.id || book.bookId;
                          return sum + getActivityBookValue(activity, bookId);
                        }, 0);
                        return (
                          <tr key={activity.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(activity.date).toLocaleDateString()}
                            </td>
                            {books.map((book) => {
                              const bookId = book.id || book.bookId;
                              return (
                                <td key={bookId} className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                                  {getActivityBookValue(activity, bookId)}
                                </td>
                              );
                            })}
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {totalBooks}
                            </td>
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

      {/* Add Book Modal */}
      {showAddBookModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Add New Book</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Book Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newBook.name}
                  onChange={(e) => setNewBook({ ...newBook, name: e.target.value })}
                  className="input-field text-sm sm:text-base"
                  placeholder="e.g., Hindi Bhagavad Gita"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newBook.price}
                  onChange={(e) => setNewBook({ ...newBook, price: e.target.value })}
                  className="input-field text-sm sm:text-base"
                  placeholder="50"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newBook.description}
                  onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                  className="input-field text-sm sm:text-base"
                  placeholder="Brief description of the book"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  <strong>Note:</strong> Book ID will be auto-generated (12 characters using a-z, A-Z, 0-9 and hyphens)
                  <br />
                  <span className="text-blue-600">Example: aakd-2802-jkss</span>
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAddBook}
                className="btn-primary flex-1 text-sm sm:text-base"
              >
                Add Book
              </button>
              <button
                onClick={() => {
                  setShowAddBookModal(false);
                  setNewBook({
                    name: '',
                    price: '',
                    description: '',
                  });
                }}
                className="btn-secondary flex-1 text-sm sm:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Book Confirmation Modal */}
      {showDeleteBookModal && bookToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-2">
              Delete Book?
            </h3>
            <p className="text-sm sm:text-base text-gray-600 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{bookToDelete.name}</span>?
            </p>
            <p className="text-xs sm:text-sm text-red-600 text-center mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
              ⚠️ This action cannot be undone. The book will be removed from the system.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDeleteBook}
                className="btn-primary bg-red-600 hover:bg-red-700 text-white flex-1 text-sm sm:text-base py-2.5"
              >
                Yes, Delete Book
              </button>
              <button
                onClick={() => {
                  setShowDeleteBookModal(false);
                  setBookToDelete(null);
                }}
                className="btn-secondary flex-1 text-sm sm:text-base py-2.5"
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

