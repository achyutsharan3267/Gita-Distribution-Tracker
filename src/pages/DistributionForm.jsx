import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import { mapBookIdToDbColumn, getBookValue } from '../utils/bookMapping';

const DistributionForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const updateUserDistribution = useStore((state) => state.updateUserDistribution);
  const books = useStore((state) => state.books);
  const loadBooks = useStore((state) => state.loadBooks);

  // Redirect if no profile exists
  useEffect(() => {
    if (user && !currentUserProfile) {
      // User is logged in but no profile - should create one via signup
      navigate('/');
    }
  }, [user, currentUserProfile, navigate]);

  if (!currentUserProfile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600">Please create your profile first.</p>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    moneyReceived: '',
    moneyOnline: '',
    moneyOffline: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load books from database and initialize formData
  useEffect(() => {
    const initializeBooks = async () => {
      try {
        await loadBooks();
      } catch (error) {
        console.error('Error loading books:', error);
      }
    };
    
    initializeBooks();
  }, [loadBooks]);

  // Initialize formData when books change
  useEffect(() => {
    if (books.length > 0) {
      const initialFormData = {
        moneyReceived: '',
        moneyOnline: '',
        moneyOffline: '',
      };
      books.forEach(book => {
        const bookId = book.id || book.bookId;
        // Use bookId directly as field name (works for both standard and new books)
        initialFormData[bookId] = '';
      });
      setFormData(prev => {
        // Merge with existing formData to preserve user input
        const merged = { ...initialFormData };
        Object.keys(prev).forEach(key => {
          if (merged.hasOwnProperty(key)) {
            merged[key] = prev[key];
          }
        });
        return merged;
      });
    }
  }, [books]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value) || 0,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    // Validate money: online + offline should be <= total money received
    if (formData.moneyReceived) {
      const totalReceived = Number(formData.moneyReceived) || 0;
      const online = Number(formData.moneyOnline) || 0;
      const offline = Number(formData.moneyOffline) || 0;
      const totalPaid = online + offline;
      
      // Total paid should be less than or equal to total received
      if (totalPaid > totalReceived) {
        newErrors.moneyMismatch = `Total paid (₹${totalPaid.toLocaleString()}) cannot be more than total received (₹${totalReceived.toLocaleString()})`;
      }
      
      // If both online and offline are 0, but money received is entered, that's okay
      // User might want to record money received without breaking it down
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Build distribution object dynamically from active books
    const distribution = {
      moneyReceived: Number(formData.moneyReceived) || 0,
      moneyOnline: Number(formData.moneyOnline) || 0,
      moneyOffline: Number(formData.moneyOffline) || 0,
      newBooks: [], // For books not in standard mapping
    };

    // Add book fields dynamically
    books.forEach(book => {
      const bookId = book.id || book.bookId;
      // Use bookId directly from formData (works for both standard and new books)
      const value = Number(formData[bookId]) || 0;
      
      // Check if it's a standard book or new book
      const standardFieldName = mapBookIdToDbColumn(bookId);
      
      if (standardFieldName === null) {
        // New book not in mapping - add to newBooks array
        if (value > 0) {
          distribution.newBooks.push({
            bookId: bookId,
            count: value,
          });
        }
      } else {
        // Standard book - add to distribution object using standard field name
        distribution[standardFieldName] = value;
      }
    });

    // Ensure all standard fields are present (for backward compatibility with database)
    if (!distribution.hindiGita) distribution.hindiGita = 0;
    if (!distribution.englishGita) distribution.englishGita = 0;
    if (!distribution.smallBooks) distribution.smallBooks = 0;
    if (!distribution.bhagavatam) distribution.bhagavatam = 0;
    if (!distribution.chaitanyaCharitamrita) distribution.chaitanyaCharitamrita = 0;
    if (!distribution.otherBooks) distribution.otherBooks = 0;

    // Check if at least one field has a value (including new books)
    const hasStandardValue = Object.values(distribution).some((val) => 
      typeof val === 'number' && val > 0
    );
    const hasNewBookValue = distribution.newBooks && distribution.newBooks.length > 0;
    
    if (!hasStandardValue && !hasNewBookValue) {
      setErrors({ general: 'Please fill at least one field' });
      setIsSubmitting(false);
      return;
    }

    try {
      await updateUserDistribution(currentUserProfile.id, distribution, user?.id);

      // Reset form dynamically
      const resetFormData = {
        moneyReceived: '',
        moneyOnline: '',
        moneyOffline: '',
      };
      books.forEach(book => {
        const bookId = book.id || book.bookId;
        // Use bookId directly as field name (works for both standard and new books)
        resetFormData[bookId] = '';
      });
      setFormData(resetFormData);

      setIsSubmitting(false);
      
      // Show success message and redirect
      toast.success('Distribution data submitted successfully! 🙏', {
        position: "top-right",
        autoClose: 3000,
      });
      navigate('/');
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ general: error.message || 'Failed to submit distribution. Please try again.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6 sm:mb-8 px-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-spiritual-800 mb-2">
          Daily Distribution Form
        </h1>
        <p className="text-sm sm:text-base text-gray-600">Submit your daily book distribution data</p>
      </div>

      {/* Current User Info */}
      <div className="card mb-4 sm:mb-6 bg-gradient-to-r from-spiritual-50 to-primary-50 p-4 sm:p-6">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <img
            src={currentUserProfile.photo}
            alt={currentUserProfile.name}
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full border-2 border-white shadow-md flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{currentUserProfile.name}</h3>
            {currentUserProfile.city && (
              <p className="text-sm sm:text-base text-gray-600 truncate">📍 {currentUserProfile.city}</p>
            )}
            <p className="text-xs sm:text-sm text-spiritual-600 mt-1">Your Distribution Profile</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-4 sm:space-y-6 p-4 sm:p-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {books.map((book) => {
            const bookId = book.id || book.bookId;
            // Use bookId directly as field name (works for both standard and new books)
            return (
              <div key={bookId}>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  {book.icon ? `${book.icon} ` : ''}{book.name}
                </label>
                <input
                  type="number"
                  name={bookId}
                  value={formData[bookId] || ''}
                  onChange={handleChange}
                  min="0"
                  className="input-field text-sm sm:text-base"
                  placeholder="0"
                />
                {book.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {book.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 sm:pt-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Money Details</h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Total Money Received (₹)
              </label>
              <input
                type="number"
                name="moneyReceived"
                value={formData.moneyReceived}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field text-sm sm:text-base"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Money Paid Online (₹)
                </label>
                <input
                  type="number"
                  name="moneyOnline"
                  value={formData.moneyOnline}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field text-sm sm:text-base"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Money Paid Offline (₹)
                </label>
                <input
                  type="number"
                  name="moneyOffline"
                  value={formData.moneyOffline}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="input-field text-sm sm:text-base"
                  placeholder="0.00"
                />
              </div>
            </div>

            {errors.moneyMismatch && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                {errors.moneyMismatch}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 text-base sm:text-lg py-2.5 sm:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : '📝 Submit Distribution'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 text-base sm:text-lg py-2.5 sm:py-3"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Current Stats Preview */}
      <div className="card mt-4 sm:mt-6 bg-gray-50 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Your Current Totals</h3>
        {!currentUserProfile ? (
          <p className="text-center text-gray-500 py-4">Loading profile...</p>
        ) : books.length === 0 ? (
          <p className="text-center text-gray-500 py-4">Loading books...</p>
        ) : (
          <div className={`grid gap-3 sm:gap-4 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-4' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
            {books.map((book) => {
              const bookId = book.id || book.bookId;
              // Use getBookValue which handles both bookDistributions and standard columns
              const value = getBookValue(currentUserProfile, bookId);
              const color = book.color || 'text-gray-600';
              return (
                <div key={bookId} className="text-center">
                  <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value || 0}</p>
                  <p className="text-xs text-gray-600 truncate">{book.name}</p>
                </div>
              );
            })}
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                ₹{currentUserProfile.totalMoney.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600">Total Money</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionForm;

