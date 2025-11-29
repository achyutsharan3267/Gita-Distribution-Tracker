// Map book ID to user property name
export const mapBookIdToUserProperty = (bookId) => {
  const mapping = {
    'hindiGita': 'hindiGita',
    'englishGita': 'englishGita',
    'smallBooks': 'smallBooks',
    'bhagavatam': 'bhagavatam',
    'chaitanyaCharitamrita': 'chaitanyaCharitamrita',
    'otherBooks': 'otherBooks',
  };
  // If book ID matches existing field, use it; otherwise return null (not mapped)
  return mapping[bookId] || null;
};

// Map book ID to database column name (for DistributionForm)
export const mapBookIdToDbColumn = (bookId) => {
  const mapping = {
    'hindiGita': 'hindiGita',
    'englishGita': 'englishGita',
    'smallBooks': 'smallBooks',
    'bhagavatam': 'bhagavatam',
    'chaitanyaCharitamrita': 'chaitanyaCharitamrita',
    'otherBooks': 'otherBooks',
  };
  // If book ID matches existing field, use it; otherwise return null (new book)
  return mapping[bookId] || null;
};

// Get book value from user object
// Now supports both standard columns and book_distributions table
export const getBookValue = (user, bookId) => {
  // First check book_distributions (for dynamic books)
  if (user.bookDistributions && user.bookDistributions[bookId]) {
    return user.bookDistributions[bookId] || 0;
  }
  
  // Fallback to standard columns (for backward compatibility)
  const property = mapBookIdToUserProperty(bookId);
  if (property === null) return 0;
  return user[property] || 0;
};

// Get book value from activity object
// Now supports both standard columns and book_distributions table
export const getActivityBookValue = (activity, bookId) => {
  // First check book_distributions (for dynamic books)
  if (activity.bookDistributions && activity.bookDistributions[bookId]) {
    return activity.bookDistributions[bookId] || 0;
  }
  
  // Fallback to standard columns (for backward compatibility)
  const property = mapBookIdToUserProperty(bookId);
  if (property === null) return 0;
  return activity[property] || 0;
};

// Get book value from stats object
// Now aggregates from all users' book_distributions
export const getStatsBookValue = (stats, bookId) => {
  // First check if stats has bookDistributions (aggregated from all users)
  if (stats.bookDistributions && stats.bookDistributions[bookId]) {
    return stats.bookDistributions[bookId] || 0;
  }
  
  // Fallback to standard columns (for backward compatibility)
  const property = mapBookIdToUserProperty(bookId);
  if (property === null) return 0;
  return stats[property] || 0;
};

