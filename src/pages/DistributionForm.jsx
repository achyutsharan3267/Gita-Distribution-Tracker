import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DistributionForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const updateUserDistribution = useStore((state) => state.updateUserDistribution);

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
    hindiGita: '',
    englishGita: '',
    smallBooks: '',
    bhagavatam: '',
    chaitanyaCharitamrita: '',
    otherBooks: '',
    moneyReceived: '',
    moneyOnline: '',
    moneyOffline: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (formData.moneyReceived && (formData.moneyOnline || formData.moneyOffline)) {
      const totalPaid = (Number(formData.moneyOnline) || 0) + (Number(formData.moneyOffline) || 0);
      if (Math.abs(totalPaid - Number(formData.moneyReceived)) > 0.01) {
        newErrors.moneyMismatch = 'Money received should equal money paid online + offline';
      }
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

    const distribution = {
      hindiGita: Number(formData.hindiGita) || 0,
      englishGita: Number(formData.englishGita) || 0,
      smallBooks: Number(formData.smallBooks) || 0,
      bhagavatam: Number(formData.bhagavatam) || 0,
      chaitanyaCharitamrita: Number(formData.chaitanyaCharitamrita) || 0,
      otherBooks: Number(formData.otherBooks) || 0,
      moneyReceived: Number(formData.moneyReceived) || 0,
      moneyOnline: Number(formData.moneyOnline) || 0,
      moneyOffline: Number(formData.moneyOffline) || 0,
    };

    // Check if at least one field has a value
    const hasAnyValue = Object.values(distribution).some((val) => val > 0);
    if (!hasAnyValue) {
      setErrors({ general: 'Please fill at least one field' });
      setIsSubmitting(false);
      return;
    }

    try {
      await updateUserDistribution(currentUserProfile.id, distribution, user?.id);

      // Reset form
      setFormData({
        hindiGita: '',
        englishGita: '',
        smallBooks: '',
        bhagavatam: '',
        chaitanyaCharitamrita: '',
        otherBooks: '',
        moneyReceived: '',
        moneyOnline: '',
        moneyOffline: '',
      });

      setIsSubmitting(false);
      
      // Show success message and redirect
      alert('Distribution data submitted successfully! 🙏');
      navigate('/');
    } catch (error) {
      setIsSubmitting(false);
      setErrors({ general: error.message || 'Failed to submit distribution. Please try again.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-spiritual-800 mb-2">
          Daily Distribution Form
        </h1>
        <p className="text-gray-600">Submit your daily book distribution data</p>
      </div>

      {/* Current User Info */}
      <div className="card mb-6 bg-gradient-to-r from-spiritual-50 to-primary-50">
        <div className="flex items-center space-x-4">
          <img
            src={currentUserProfile.photo}
            alt={currentUserProfile.name}
            className="w-16 h-16 rounded-full border-2 border-white shadow-md"
          />
          <div>
            <h3 className="text-xl font-bold text-gray-800">{currentUserProfile.name}</h3>
            {currentUserProfile.city && (
              <p className="text-gray-600">📍 {currentUserProfile.city}</p>
            )}
            <p className="text-sm text-spiritual-600 mt-1">Your Distribution Profile</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.general}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hindi Gita Distributed
            </label>
            <input
              type="number"
              name="hindiGita"
              value={formData.hindiGita}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              English Gita Distributed
            </label>
            <input
              type="number"
              name="englishGita"
              value={formData.englishGita}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Small Books Distributed
            </label>
            <input
              type="number"
              name="smallBooks"
              value={formData.smallBooks}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📿 Bhagavatam
            </label>
            <input
              type="number"
              name="bhagavatam"
              value={formData.bhagavatam}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📿 Chaitanya Charitamrita
            </label>
            <input
              type="number"
              name="chaitanyaCharitamrita"
              value={formData.chaitanyaCharitamrita}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📚 Other Prabhupada Books
            </label>
            <input
              type="number"
              name="otherBooks"
              value={formData.otherBooks}
              onChange={handleChange}
              min="0"
              className="input-field"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Other Srila Prabhupada books
            </p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Money Details</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Money Received (₹)
              </label>
              <input
                type="number"
                name="moneyReceived"
                value={formData.moneyReceived}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-field"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Money Paid Online (₹)
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
                  Money Paid Offline (₹)
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

            {errors.moneyMismatch && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-lg text-sm">
                {errors.moneyMismatch}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1 text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : '📝 Submit Distribution'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-secondary flex-1 text-lg py-3"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Current Stats Preview */}
      <div className="card mt-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Current Totals</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-spiritual-600">{currentUserProfile.hindiGita}</p>
            <p className="text-xs text-gray-600">Hindi Gita</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{currentUserProfile.englishGita}</p>
            <p className="text-xs text-gray-600">English Gita</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{currentUserProfile.smallBooks}</p>
            <p className="text-xs text-gray-600">Small Books</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              ₹{currentUserProfile.totalMoney.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">Total Money</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistributionForm;

