/**
 * Masks mobile number - shows only last 4 digits
 * @param {string} mobileNumber - The mobile number to mask
 * @returns {string} - Masked mobile number (e.g., "*******1234")
 */
export const maskMobileNumber = (mobileNumber) => {
  if (!mobileNumber) return null;
  
  const cleaned = mobileNumber.replace(/\D/g, ''); // Remove non-digits
  if (cleaned.length <= 4) {
    // If number is 4 digits or less, show all
    return mobileNumber;
  }
  
  const last4 = cleaned.slice(-4);
  const masked = '*'.repeat(Math.max(cleaned.length - 4, 7)) + last4;
  
  return masked;
};

/**
 * Formats mobile number for display
 * @param {string} mobileNumber - The mobile number
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {boolean} isOwnProfile - Whether viewing own profile
 * @returns {string} - Formatted mobile number (masked or full)
 */
export const formatMobileNumber = (mobileNumber, isAdmin = false, isOwnProfile = false) => {
  if (!mobileNumber) return null;
  
  // Admin or own profile sees full number
  if (isAdmin || isOwnProfile) {
    return mobileNumber;
  }
  
  // Others see masked number
  return maskMobileNumber(mobileNumber);
};

/**
 * Masks money amount - shows only last 4 digits
 * @param {number} amount - The money amount to mask
 * @returns {string} - Masked money amount (e.g., "₹*******1234")
 */
export const maskMoney = (amount) => {
  if (amount === null || amount === undefined || amount === 0) return '₹0';
  
  const amountStr = Math.abs(amount).toString();
  const parts = amountStr.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '';
  
  if (integerPart.length <= 4) {
    // If amount is 4 digits or less, show all
    return `₹${amount.toLocaleString()}`;
  }
  
  const last4 = integerPart.slice(-4);
  const masked = '*'.repeat(Math.max(integerPart.length - 4, 4)) + last4;
  const formatted = decimalPart ? `${masked}.${decimalPart}` : masked;
  
  return `₹${formatted}`;
};

/**
 * Formats money for display
 * @param {number} amount - The money amount
 * @param {boolean} isAdmin - Whether current user is admin
 * @param {boolean} isOwnProfile - Whether viewing own profile
 * @returns {string} - Formatted money (masked or full with ₹ symbol)
 */
export const formatMoney = (amount, isAdmin = false, isOwnProfile = false) => {
  if (amount === null || amount === undefined) return '₹0';
  
  // Admin or own profile sees full amount
  if (isAdmin || isOwnProfile) {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }
  
  // Others see masked amount
  return maskMoney(amount);
};

