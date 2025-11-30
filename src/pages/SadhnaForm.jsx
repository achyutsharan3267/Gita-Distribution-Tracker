import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SadhnaForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserProfile = useStore((state) => state.currentUserProfile);
  const submitSadhna = useStore((state) => state.submitSadhna);
  const getSadhnaForDate = useStore((state) => state.getSadhnaForDate);

  const [formData, setFormData] = useState({
    wakeUpTime: '',
    manglaArti: false,
    tulsiArti: false,
    guruPuja: false,
    sandhyaArti: false,
    firstRoundTiming: '',
    lastRoundTiming: '',
    totalRounds: '',
    lectureHearingYes: false,
    lectureHearing: '',
    bookReadingYes: false,
    bookReading: '',
    servicesDoneYes: false,
    servicesDone: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Load existing sadhna for today
  useEffect(() => {
    const loadTodaySadhna = async () => {
      if (!currentUserProfile || !user) {
        setIsLoading(false);
        return;
      }

      try {
        const existingSadhna = await getSadhnaForDate(currentUserProfile.id, today);
        if (existingSadhna) {
          setFormData({
            wakeUpTime: existingSadhna.wakeUpTime || '',
            manglaArti: existingSadhna.manglaArti || false,
            tulsiArti: existingSadhna.tulsiArti || false,
            guruPuja: existingSadhna.guruPuja || false,
            sandhyaArti: existingSadhna.sandhyaArti || false,
            firstRoundTiming: existingSadhna.firstRoundTiming || '',
            lastRoundTiming: existingSadhna.lastRoundTiming || '',
            totalRounds: existingSadhna.totalRounds?.toString() || '',
            lectureHearingYes: !!(existingSadhna.lectureHearing && existingSadhna.lectureHearing.trim()),
            lectureHearing: existingSadhna.lectureHearing || '',
            bookReadingYes: !!(existingSadhna.bookReading && existingSadhna.bookReading.trim()),
            bookReading: existingSadhna.bookReading || '',
            servicesDoneYes: !!(existingSadhna.servicesDone && existingSadhna.servicesDone.trim()),
            servicesDone: existingSadhna.servicesDone || '',
          });
          setIsEditing(true);
        }
      } catch (error) {
        console.error('Error loading sadhna:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTodaySadhna();
  }, [currentUserProfile, user, today, getSadhnaForDate]);

  // Redirect if no profile exists
  useEffect(() => {
    if (user && !currentUserProfile) {
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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (formData.totalRounds && (isNaN(formData.totalRounds) || parseInt(formData.totalRounds) < 0)) {
      newErrors.totalRounds = 'Total rounds must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    // Show confirmation modal
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      await submitSadhna({
        wakeUpTime: formData.wakeUpTime,
        manglaArti: formData.manglaArti,
        tulsiArti: formData.tulsiArti,
        guruPuja: formData.guruPuja,
        sandhyaArti: formData.sandhyaArti,
        firstRoundTiming: formData.firstRoundTiming,
        lastRoundTiming: formData.lastRoundTiming,
        totalRounds: formData.totalRounds ? parseInt(formData.totalRounds) : 0,
        lectureHearing: formData.lectureHearingYes ? formData.lectureHearing : '',
        bookReading: formData.bookReadingYes ? formData.bookReading : '',
        servicesDone: formData.servicesDoneYes ? formData.servicesDone : '',
        date: today,
      }, currentUserProfile.id);

      toast.success(isEditing ? 'Sadhna updated successfully! 🙏' : 'Sadhna submitted successfully! 🙏', {
        position: "top-right",
        autoClose: 3000,
      });

      // Optionally navigate back or stay on page
      // navigate('/');
    } catch (error) {
      console.error('Error submitting sadhna:', error);
      toast.error(error.message || 'Failed to submit sadhna. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
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

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Daily Sadhna Chart
        </h1>
        <p className="text-sm text-gray-600">
          {isEditing ? 'Update your sadhna for today' : 'Submit your daily sadhna'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Date: {new Date(today).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
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
        {/* Wake Up Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🌅 Wake Up Time
          </label>
          <input
            type="time"
            name="wakeUpTime"
            value={formData.wakeUpTime}
            onChange={handleChange}
            className="input-field"
          />
        </div>

        {/* Arti & Puja Checkboxes */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Arti & Puja</h3>
          
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="manglaArti"
              checked={formData.manglaArti}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">🕉️ Mangla Arti</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="tulsiArti"
              checked={formData.tulsiArti}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">🌿 Tulsi Arti</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="guruPuja"
              checked={formData.guruPuja}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">🙏 Guru Puja</span>
          </label>

          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              name="sandhyaArti"
              checked={formData.sandhyaArti}
              onChange={handleChange}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">🌆 Sandhya Arti</span>
          </label>
        </div>

        {/* Japa Rounds */}
        <div className="border-t border-gray-100 pt-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Japa Rounds</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Round Timing
              </label>
              <input
                type="time"
                name="firstRoundTiming"
                value={formData.firstRoundTiming}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Round Timing
              </label>
              <input
                type="time"
                name="lastRoundTiming"
                value={formData.lastRoundTiming}
                onChange={handleChange}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Rounds
              </label>
              <input
                type="number"
                name="totalRounds"
                value={formData.totalRounds}
                onChange={handleChange}
                min="0"
                className="input-field"
                placeholder="0"
              />
              {errors.totalRounds && (
                <p className="text-xs text-red-600 mt-1">{errors.totalRounds}</p>
              )}
            </div>
          </div>
        </div>

        {/* Study & Service */}
        <div className="border-t border-gray-100 pt-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Study & Service</h3>
          
          {/* Lecture Hearing */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="lectureHearingYes"
                checked={formData.lectureHearingYes}
                onChange={(e) => {
                  handleChange(e);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, lectureHearing: '' }));
                  }
                }}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">📚 Lecture Hearing</span>
            </label>
            {formData.lectureHearingYes && (
              <textarea
                name="lectureHearing"
                value={formData.lectureHearing}
                onChange={handleChange}
                rows={3}
                className="input-field mt-2"
                placeholder="Which lecture did you hear today?"
              />
            )}
          </div>

          {/* Book Reading */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="bookReadingYes"
                checked={formData.bookReadingYes}
                onChange={(e) => {
                  handleChange(e);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, bookReading: '' }));
                  }
                }}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">📖 Book Reading</span>
            </label>
            {formData.bookReadingYes && (
              <textarea
                name="bookReading"
                value={formData.bookReading}
                onChange={handleChange}
                rows={3}
                className="input-field mt-2"
                placeholder="Which book did you read today?"
              />
            )}
          </div>

          {/* Services Done */}
          <div>
            <label className="flex items-center space-x-3 cursor-pointer mb-2">
              <input
                type="checkbox"
                name="servicesDoneYes"
                checked={formData.servicesDoneYes}
                onChange={(e) => {
                  handleChange(e);
                  if (!e.target.checked) {
                    setFormData(prev => ({ ...prev, servicesDone: '' }));
                  }
                }}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">🛎️ Any Services Done Today</span>
            </label>
            {formData.servicesDoneYes && (
              <textarea
                name="servicesDone"
                value={formData.servicesDone}
                onChange={handleChange}
                rows={3}
                className="input-field mt-2"
                placeholder="Describe any services you performed today..."
              />
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex-1"
          >
            {isSubmitting ? 'Submitting...' : isEditing ? 'Update Sadhna' : 'Submit Sadhna'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Hare Krishna {currentUserProfile?.name?.split(' ')[0] || 'Devotee'}
              </h3>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-6 italic">
                "Krishna sab dekh rahe hain. Apni sadhana sachchai se bharna hi unki kripa ko paane ka sahi marg hai."
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmSubmit}
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Sadhna'}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isSubmitting}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SadhnaForm;

