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

  // Calculate derived values
  const calculateAmounts = () => {
    // Calculate Amount as per Books
    let amountAsPerBooks = 0;
    books.forEach(book => {
      const bookId = book.id || book.bookId;
      const count = Number(formData[bookId]) || 0;
      const price = parseFloat(book.price || 0);
      amountAsPerBooks += count * price;
    });

    // Calculate Total Received Amount (Online + Offline)
    const onlineAmount = Number(formData.moneyOnline) || 0;
    const offlineAmount = Number(formData.moneyOffline) || 0;
    const totalReceivedAmount = onlineAmount + offlineAmount;

    // Calculate Insufficient Funds (if Amount as per Books > Total Received)
    const insufficientFunds = amountAsPerBooks > totalReceivedAmount 
      ? amountAsPerBooks - totalReceivedAmount 
      : 0;

    // Calculate Donation Amount (if Total Received > Amount as per Books)
    const donationAmount = totalReceivedAmount > amountAsPerBooks 
      ? totalReceivedAmount - amountAsPerBooks 
      : 0;

    return {
      amountAsPerBooks,
      totalReceivedAmount,
      insufficientFunds,
      donationAmount
    };
  };

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
    
    // No specific validation needed for money fields
    // All calculations are done automatically

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    // Calculate amounts
    const amounts = calculateAmounts();

    // Build distribution object dynamically from active books
    const distribution = {
      moneyReceived: amounts.totalReceivedAmount,
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
      toast.success('Distribution submitted! ⏳ Pending admin approval. 🙏', {
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
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm sm:text-base text-spiritual-600 hover:text-spiritual-700 font-medium"
        >
          ← Back
        </button>
      </div>
      <div className="tour-form-header mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Daily Distribution Form
        </h1>
        <p className="text-sm text-gray-600">Submit your daily book distribution data</p>
      </div>

      {/* Current User Info */}
      <div className="card mb-5 p-5">
        <div className="flex items-center space-x-3">
          <img
            src={currentUserProfile.photo}
            alt={currentUserProfile.name}
            className="w-14 h-14 rounded-full border-2 border-gray-200 flex-shrink-0 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">{currentUserProfile.name}</h3>
            {currentUserProfile.city && (
              <p className="text-sm text-gray-600 truncate">📍 {currentUserProfile.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-5">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {errors.general}
          </div>
        )}

        <div className="tour-book-inputs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {books.map((book) => {
            const bookId = book.id || book.bookId;
            // Use bookId directly as field name (works for both standard and new books)
            return (
              <div key={bookId} className="min-w-0 flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2 min-w-0 h-10 flex items-start">
                  <span className="flex items-start gap-1.5 w-full">
                    {book.icon && <span className="flex-shrink-0 mt-0.5">{book.icon}</span>}
                    <span className="break-words line-clamp-2 min-w-0 leading-tight">{book.name}</span>
                  </span>
                </label>
                <input
                  type="number"
                  name={bookId}
                  value={formData[bookId] || ''}
                  onChange={handleChange}
                  min="0"
                  className="input-field w-full"
                  placeholder="0"
                />
                {book.description && (
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 break-words">
                    {book.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="tour-money-section border-t border-gray-100 pt-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Money Details</h3>
          
          {(() => {
            const amounts = calculateAmounts();
            return (
              <div className="space-y-4">
                {/* Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Online Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="moneyOnline"
                      value={formData.moneyOnline}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Offline Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="moneyOffline"
                      value={formData.moneyOffline}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Calculated Fields */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Received Amount (₹)</span>
                    <span className="text-base font-semibold text-gray-900">
                      {amounts.totalReceivedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Amount as per Books (₹)</span>
                    <span className="text-base font-semibold text-gray-900">
                      {amounts.amountAsPerBooks.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {amounts.insufficientFunds > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-red-600">Insufficient Funds (₹)</span>
                      <span className="text-base font-semibold text-red-600">
                        {amounts.insufficientFunds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  {amounts.donationAmount > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-sm font-medium text-green-600">Donation Amount (₹)</span>
                      <span className="text-base font-semibold text-green-600">
                        {amounts.donationAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="tour-submit-button btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : '📝 Submit Distribution'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Current Stats Preview */}
      <div className="tour-current-totals card mt-5 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Your Current Totals</h3>
        {!currentUserProfile ? (
          <p className="text-center text-gray-400 py-4 text-sm italic">
            "Everything will come in due course of time. Be patient and continue your Krishna consciousness sincerely."
          </p>
        ) : books.length === 0 ? (
          <p className="text-center text-gray-400 py-4 text-sm">Loading books...</p>
        ) : (
          <div className={`grid gap-3 ${books.length <= 3 ? 'grid-cols-2 sm:grid-cols-4' : books.length <= 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'}`}>
            {books.map((book) => {
              const bookId = book.id || book.bookId;
              // Use getBookValue which handles both bookDistributions and standard columns
              const value = getBookValue(currentUserProfile, bookId);
              return (
                <div key={bookId} className="bg-gray-50 rounded-xl p-3 text-center min-w-0">
                  <p className="text-lg font-bold text-gray-900">{value || 0}</p>
                  <p className="text-xs text-gray-500 truncate mt-1 break-words line-clamp-2" title={book.name}>{book.name}</p>
                </div>
              );
            })}
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-900">
                ₹{currentUserProfile.totalMoney.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Money</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DistributionForm;

