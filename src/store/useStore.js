import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Helper function to transform database user to app format
const transformUser = (dbUser) => {
  // Handle email from different possible structures
  let email = null;
  if (dbUser.auth_users && Array.isArray(dbUser.auth_users) && dbUser.auth_users.length > 0) {
    email = dbUser.auth_users[0]?.email || null;
  } else if (dbUser.auth_users && typeof dbUser.auth_users === 'object' && dbUser.auth_users.email) {
    email = dbUser.auth_users.email;
  } else if (dbUser.email) {
    email = dbUser.email;
  }
  
  return {
    id: dbUser.id,
    name: dbUser.name,
    city: dbUser.city || null,
    mobileNumber: dbUser.mobile_number || null,
    other: dbUser.bace || dbUser.other || null, // Support both 'bace' and 'other' for backward compatibility
    email: email,
    photo: dbUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name)}&background=a855f7&color=fff&size=128`,
    // Book counts will be calculated from book_distributions, not stored in users table
    hindiGita: 0,
    englishGita: 0,
    smallBooks: 0,
    bhagavatam: 0,
    chaitanyaCharitamrita: 0,
    otherBooks: 0,
    totalMoney: 0, // Will be calculated from activities
    approvalStatus: dbUser.approval_status || 'pending', // pending, approved, rejected
    activities: [], // Will be loaded separately
  };
};

// Helper function to transform app user to database format
const transformUserToDb = (user) => {
  const dbUser = {
    name: user.name,
    city: user.city || null,
    mobile_number: user.mobileNumber || null,
    bace: user.other || user.bace || null, // Use 'bace' column name
    email: user.email || null, // Store email in database
    photo: user.photo || null, // Store photo URL (can be Supabase Storage URL or external URL)
    // Book counts and total_money are not stored in users table
    // They are calculated from book_distributions and activities
  };
  // Explicitly set auth_user_id to NULL so trigger can set it
  // This ensures RLS policy works correctly
  dbUser.auth_user_id = null;
  return dbUser;
};

// Helper function to transform activity
const transformActivity = (dbActivity) => ({
  id: dbActivity.id,
  date: dbActivity.date,
  // Book counts are now stored in book_distributions table, not in activities
  // They will be loaded separately and attached as bookDistributions object
  hindiGita: 0,
  englishGita: 0,
  smallBooks: 0,
  bhagavatam: 0,
  chaitanyaCharitamrita: 0,
  otherBooks: 0,
  moneyReceived: parseFloat(dbActivity.money_received || 0),
  moneyOnline: parseFloat(dbActivity.money_online || 0),
  moneyOffline: parseFloat(dbActivity.money_offline || 0),
  approvalStatus: dbActivity.approval_status || 'approved', // pending, approved, rejected
  bookDistributions: {}, // Will be populated from book_distributions table
});

export const useStore = create((set, get) => ({
  users: [],
  currentUserId: null,
  currentUserProfile: null, // The authenticated user's profile
  loading: true,
  error: null,
  realtimeSubscriptions: null, // Store subscription references
  books: [], // Books from database

  // Get authenticated user's profile
  getCurrentUserProfile: async (authUserId) => {
    if (!authUserId) return null;
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (!data) return null;

      // Check admin status
      let isAdmin = false;
      try {
        // First try direct query
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('auth_user_id', authUserId)
          .single();
        
        if (adminError && adminError.code !== 'PGRST116') {
          // If RLS blocks, try RPC function
          console.log('Direct query blocked, trying RPC function');
          const { data: rpcResult } = await supabase.rpc('is_admin', {
            user_id: authUserId
          });
          isAdmin = rpcResult || false;
        } else {
          isAdmin = !!adminData;
        }
        console.log('Admin check for user:', authUserId, 'isAdmin:', isAdmin);
      } catch (err) {
        console.error('Admin check error:', err);
        // Try RPC as fallback
        try {
          const { data: rpcResult } = await supabase.rpc('is_admin', {
            user_id: authUserId
          });
          isAdmin = rpcResult || false;
        } catch (rpcErr) {
          console.error('RPC also failed:', rpcErr);
        }
      }

      const transformedUser = {
        ...transformUser(data),
        isAdmin,
      };
      
      // Load book distributions for this user
      try {
        const { data: bdData, error: bdError } = await supabase
          .from('book_distributions')
          .select('book_id, count')
          .eq('user_id', transformedUser.id);
        
        if (!bdError && bdData) {
          // Aggregate book distributions by book_id
          const bookDistributions = {};
          bdData.forEach((bd) => {
            if (!bookDistributions[bd.book_id]) {
              bookDistributions[bd.book_id] = 0;
            }
            bookDistributions[bd.book_id] += bd.count || 0;
          });
          transformedUser.bookDistributions = bookDistributions;
        } else {
          transformedUser.bookDistributions = {};
        }
      } catch (err) {
        console.warn('Could not load book distributions for current user:', err);
        transformedUser.bookDistributions = {};
      }
      
      return transformedUser;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }
  },

  // Load activities for a specific user
  loadUserActivities: async (userId, isAdmin = false, showAllStatuses = false) => {
    try {
      let query = supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId);
      
      // All activities are auto-approved, so show all activities
      // No filtering needed - all activities are visible
      
      const { data, error } = await query.order('date', { ascending: false });

      if (error) throw error;
      
      const activities = data?.map(transformActivity) || [];
      
      // Load book distributions for this user's activities
      const activityIds = activities.map(a => a.id);
      if (activityIds.length > 0) {
        let bookDistributions = null;
        let bdError = null;
        try {
          const result = await supabase
            .from('book_distributions')
            .select('*')
            .in('activity_id', activityIds);
          bookDistributions = result.data;
          bdError = result.error;
        } catch (err) {
          // If table doesn't exist, continue without book distributions
          console.warn('Could not fetch book distributions (table may not exist):', err.message);
          bookDistributions = null;
          bdError = err;
        }

        if (!bdError && bookDistributions) {
          // Attach book distributions to activities
          activities.forEach(activity => {
            activity.bookDistributions = {};
            bookDistributions
              .filter(bd => bd.activity_id === activity.id)
              .forEach(bd => {
                activity.bookDistributions[bd.book_id] = (activity.bookDistributions[bd.book_id] || 0) + (bd.count || 0);
              });
          });
        }
      }
      
      return activities;
    } catch (error) {
      console.error('Error loading activities:', error);
      return [];
    }
  },

  // Initialize: Load users from Supabase
  initialize: async (authUserId = null) => {
    const state = get();
    
    // Prevent multiple simultaneous initializations
    if (state.loading) {
      console.log('⏳ Already initializing, skipping...');
      return;
    }

    console.log('🚀 Starting initialization...', { authUserId });
    
    try {
      set({ loading: true, error: null });
      
      // Check if Supabase is configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase credentials missing!');
        throw new Error('Supabase credentials not configured. Please check your .env file.');
      }

      if (!supabase) {
        console.warn('Supabase client not initialized, using empty state');
        set({ users: [], loading: false });
        return;
      }

      console.log('Fetching users from database...');
      // Fetch all users (for leaderboard, etc.)
      // Note: Email search requires database function or separate email fetch
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Try to fetch emails separately and map them
      // This is a workaround since direct join with auth.users isn't allowed
      if (users && users.length > 0) {
        try {
          // Fetch auth user emails using a function if available
          const { data: emailsData } = await supabase.rpc('get_users_with_email').catch(() => null);
          if (emailsData) {
            // Map emails to users
            const emailMap = {};
            emailsData.forEach((item) => {
              if (item.id && item.email) {
                emailMap[item.id] = item.email;
              }
            });
            // Add emails to users
            users.forEach((user) => {
              if (emailMap[user.id]) {
                user.email = emailMap[user.id];
              }
            });
          }
        } catch (err) {
          console.log('Email fetch not available, continuing without email search');
        }
      }

      if (usersError) {
        console.error('Error fetching users:', usersError);
        throw new Error(`Database error: ${usersError.message}`);
      }
      
      console.log(`Loaded ${users?.length || 0} users`);

      // Fetch activities for all users - ONLY APPROVED activities for totals
      console.log('Fetching activities from database...');
      let activities = null;
      let activitiesError = null;
      
      // Fetch all activities - all are auto-approved, no filtering needed
      const { data: allActivities, error: allError } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false });
      
      activities = allActivities || [];
      activitiesError = allError;

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        throw new Error(`Database error: ${activitiesError.message}`);
      }
      
      console.log(`Loaded ${activities?.length || 0} activities`);

      // Fetch book_distributions for all users
      console.log('Fetching book distributions from database...');
      let bookDistributions = null;
      let bdError = null;
      try {
        const result = await supabase
          .from('book_distributions')
          .select('*');
        bookDistributions = result.data;
        bdError = result.error;
      } catch (err) {
        // If table doesn't exist, continue without book distributions
        console.warn('Could not fetch book distributions (table may not exist):', err.message);
        bookDistributions = null;
        bdError = err;
      }

      if (bdError && !bdError.message?.includes('does not exist')) {
        console.warn('Error fetching book distributions:', bdError);
      }

      console.log(`Loaded ${bookDistributions?.length || 0} book distributions`);

      // Aggregate book distributions by user_id and book_id
      // All activities are auto-approved, so count all
      const approvedActivityIds = new Set(
        activities?.map(a => a.id) || []
      );
      
      const bookDistributionsByUser = {};
      bookDistributions?.forEach((bd) => {
        // Only count if activity is approved
        if (approvedActivityIds.has(bd.activity_id)) {
          if (!bookDistributionsByUser[bd.user_id]) {
            bookDistributionsByUser[bd.user_id] = {};
          }
          if (!bookDistributionsByUser[bd.user_id][bd.book_id]) {
            bookDistributionsByUser[bd.user_id][bd.book_id] = 0;
          }
          bookDistributionsByUser[bd.user_id][bd.book_id] += bd.count || 0;
        }
      });

      // Group activities by user_id
      // Only include approved activities for totals (but keep all for display if needed)
      const activitiesByUser = {};
      activities?.forEach((activity) => {
        if (!activitiesByUser[activity.user_id]) {
          activitiesByUser[activity.user_id] = [];
        }
        // All activities are auto-approved, so add all
        if (activity) {
          activitiesByUser[activity.user_id].push(transformActivity(activity));
        }
      });

      // Fetch admin status for all users
      let adminMap = {};
      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from('admin_users')
          .select('auth_user_id');
        
        if (adminError) {
          console.error('Error fetching admin users:', adminError);
          // Try using RPC function as fallback
          try {
            // Use database function to check admin status for each user
            for (const user of users) {
              if (user.auth_user_id) {
                const { data: isAdmin } = await supabase.rpc('is_admin', {
                  user_id: user.auth_user_id
                });
                if (isAdmin) {
                  adminMap[user.auth_user_id] = true;
                }
              }
            }
          } catch (rpcError) {
            console.log('RPC function also failed, continuing without admin badges');
          }
        } else if (adminUsers) {
          console.log('✅ Admin users fetched:', adminUsers.length);
          // Create a map of auth_user_id to admin status
          adminUsers.forEach((admin) => {
            if (admin.auth_user_id) {
              adminMap[admin.auth_user_id] = true;
            }
          });
          console.log('Admin map:', adminMap);
        }
      } catch (err) {
        console.error('Admin status fetch error:', err);
      }

      // Transform users and attach activities, book distributions, and admin status
      const transformedUsers = users?.map((user) => {
        const isAdmin = adminMap[user.auth_user_id] || false;
        if (isAdmin) {
          console.log('Admin found:', user.name, user.auth_user_id);
        }
        const transformedUser = transformUser(user);
        transformedUser.activities = activitiesByUser[user.id] || [];
        transformedUser.isAdmin = isAdmin;
        
        // Add book distributions to user object (for dynamic books)
        if (bookDistributionsByUser[user.id]) {
          transformedUser.bookDistributions = bookDistributionsByUser[user.id];
        } else {
          transformedUser.bookDistributions = {};
        }
        
        return transformedUser;
      }) || [];

      // Get authenticated user's profile if authUserId provided
      let currentUserProfile = null;
      let currentUserId = null;
      
      if (authUserId) {
        currentUserProfile = await get().getCurrentUserProfile(authUserId);
        if (currentUserProfile) {
          // Load activities for current user
          currentUserProfile.activities = await get().loadUserActivities(currentUserProfile.id);
          
          // Add book distributions to current user profile (for dynamic books)
          if (bookDistributionsByUser[currentUserProfile.id]) {
            currentUserProfile.bookDistributions = bookDistributionsByUser[currentUserProfile.id];
          } else {
            currentUserProfile.bookDistributions = {};
          }
          
          currentUserId = currentUserProfile.id;
        }
      }

      console.log('✅ Initialization complete!', {
        users: transformedUsers.length,
        hasProfile: !!currentUserProfile
      });
      
      set({
        users: transformedUsers,
        currentUserId,
        currentUserProfile,
        loading: false,
        error: null,
      });

      // Setup real-time subscriptions after initial load
      get().setupRealtimeSubscriptions();
    } catch (error) {
      console.error('❌ Error initializing store:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Set error but also allow app to continue with empty state
      const errorMessage = error.message || error.hint || 'Failed to load data from database';
      set({ 
        error: errorMessage, 
        loading: false,
        users: [],
        currentUserProfile: null,
        currentUserId: null,
      });
    }
  },

  // Add new user (creates profile linked to authenticated user)
  // Note: auth_user_id will be automatically set by database trigger
  addUser: async (user, authUserId) => {
    try {
      const dbUser = transformUserToDb(user);
      
      // Check if admin approval is required
      // IMPORTANT: First user is ALWAYS auto-approved (safety mechanism)
      let approvalStatus = 'pending'; // Default to pending for security
      
      // First, check if this is the very first user (ALWAYS approve first user)
      try {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // If this is the first user, ALWAYS approve regardless of config
        if (userCount === 0) {
          console.log('✅ First user signup - ALWAYS auto-approving for safety');
          approvalStatus = 'approved';
        } else {
          // Not the first user - check config setting
          try {
            const requireApproval = await get().getAppConfig('require_admin_approval');
            
            if (requireApproval === 'false') {
              approvalStatus = 'approved'; // Auto-approve if toggle is OFF
              console.log('✅ Auto-approving user (approval toggle is OFF)');
            } else if (requireApproval === 'true') {
              // Approval is required for non-first users
              approvalStatus = 'pending';
              console.log('⏳ Approval required - waiting for admin approval');
            } else {
              // Config returned null or unexpected value, default to pending
              approvalStatus = 'pending';
              console.log('⏳ Config value unexpected, defaulting to pending');
            }
          } catch (configErr) {
            // If config check fails, default to pending (safer)
            approvalStatus = 'pending';
            console.log('⏳ Could not check config, defaulting to pending:', configErr);
          }
        }
      } catch (countErr) {
        // If we can't check user count, default to pending (safer)
        approvalStatus = 'pending';
        console.log('⏳ Could not check user count, defaulting to pending (safer):', countErr);
      }
      
      dbUser.approval_status = approvalStatus;
      // Don't set auth_user_id explicitly - let the trigger handle it
      // This ensures RLS policy works correctly
      
      const { data, error } = await supabase
        .from('users')
        .insert([dbUser])
        .select()
        .single();

      if (error) throw error;

      // Check admin status for new user
      let isAdmin = false;
      try {
        if (data.auth_user_id) {
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('id')
            .eq('auth_user_id', data.auth_user_id)
            .single();
          isAdmin = !!adminData;
        }
      } catch (err) {
        // Admin check failed, continue with false
      }

      const newUser = {
        ...transformUser(data),
        activities: [],
        isAdmin,
      };

      set((state) => ({
        users: [...state.users, newUser],
        currentUserProfile: newUser,
        currentUserId: newUser.id,
      }));
    } catch (error) {
      console.error('Error adding user:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Update user distribution (only for own profile)
  updateUserDistribution: async (userId, distribution, authUserId) => {
    try {
      const state = get();
      const user = state.users.find((u) => u.id === userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Verify user is updating their own data
      if (authUserId) {
        const { data: userData, error: checkError } = await supabase
          .from('users')
          .select('auth_user_id')
          .eq('id', userId)
          .single();

        if (checkError) throw checkError;
        if (userData.auth_user_id !== authUserId) {
          throw new Error('You can only update your own distribution data');
        }
      }

      // Insert new activity with approved status (auto-approved, no approval needed)
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .insert([
          {
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            // Book counts are stored in book_distributions table, not here
            money_received: distribution.moneyReceived || 0,
            money_online: distribution.moneyOnline || 0,
            money_offline: distribution.moneyOffline || 0,
            approval_status: 'approved', // Activities are auto-approved and show immediately
          },
        ])
        .select()
        .single();

      if (activityError) throw activityError;

      // Save ALL books (standard and new) to book_distributions table
      // This allows dynamic book management - admin can add/delete books anytime
      const bookDistributions = [];
      
      // Add standard books
      const standardBooks = [
        { bookId: 'hindiGita', count: distribution.hindiGita || 0 },
        { bookId: 'englishGita', count: distribution.englishGita || 0 },
        { bookId: 'smallBooks', count: distribution.smallBooks || 0 },
        { bookId: 'bhagavatam', count: distribution.bhagavatam || 0 },
        { bookId: 'chaitanyaCharitamrita', count: distribution.chaitanyaCharitamrita || 0 },
        { bookId: 'otherBooks', count: distribution.otherBooks || 0 },
      ];
      
      standardBooks.forEach(book => {
        if (book.count > 0) {
          bookDistributions.push({
            activity_id: activityData.id,
            user_id: userId,
            book_id: book.bookId,
            count: book.count,
          });
        }
      });
      
      // Add new books (not in standard mapping)
      if (distribution.newBooks && Array.isArray(distribution.newBooks)) {
        distribution.newBooks.forEach(book => {
          if (book.count > 0) {
            bookDistributions.push({
              activity_id: activityData.id,
              user_id: userId,
              book_id: book.bookId,
              count: book.count,
            });
          }
        });
      }

      // Insert all book distributions
      if (bookDistributions.length > 0) {
        const { error: bdError } = await supabase
          .from('book_distributions')
          .insert(bookDistributions);

        // If table doesn't exist, just log and continue (backward compatibility)
        if (bdError && !bdError.message.includes('does not exist')) {
          console.warn('Could not save book distributions:', bdError);
        }
      }

      // Note: Book counts and total_money are no longer stored in users table
      // They are calculated from book_distributions and activities tables
      // Just reload activities to refresh the calculated values

      // Reload activities with book distributions from database
      const updatedActivities = await get().loadUserActivities(userId, false, true);
      
      // Update local state with reloaded activities
      set((state) => {
        const updatedUsers = state.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                activities: updatedActivities || [],
                // Book counts are calculated from book_distributions, not stored
                hindiGita: 0,
                englishGita: 0,
                smallBooks: 0,
                bhagavatam: 0,
                chaitanyaCharitamrita: 0,
                otherBooks: 0,
                totalMoney: 0, // Calculated from activities when displayed
              }
            : u
        );

        // Update currentUserProfile if it's the same user
        const updatedCurrentUserProfile = 
          state.currentUserProfile?.id === userId
            ? {
                ...state.currentUserProfile,
                activities: updatedActivities || [],
                // Book counts are calculated from book_distributions, not stored
                hindiGita: 0,
                englishGita: 0,
                smallBooks: 0,
                bhagavatam: 0,
                chaitanyaCharitamrita: 0,
                otherBooks: 0,
                totalMoney: 0,
              }
            : state.currentUserProfile;

        return {
          users: updatedUsers,
          currentUserProfile: updatedCurrentUserProfile,
        };
      });
    } catch (error) {
      console.error('Error updating distribution:', error);
      set({ error: error.message });
      throw error;
    }
  },

  // Set current user
  setCurrentUser: (userId) => {
    set({ currentUserId: userId });
    // Save to localStorage for persistence across sessions
    localStorage.setItem('currentUserId', userId);
  },

  // Load current user from localStorage on init
  loadCurrentUser: () => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId) {
      set({ currentUserId: savedUserId });
    }
  },

  // Computed values
  getTotalStats: () => {
    const state = get();
    const stats = state.users.reduce(
      (acc, user) => {
        // Calculate money collected from activities instead of user.totalMoney
        // This ensures accurate calculation even if activities are deleted
        const userActivities = user.activities || [];
        const userMoneyCollected = userActivities.reduce((sum, activity) => {
          const onlineAmount = activity.moneyOnline || 0;
          const offlineAmount = activity.moneyOffline || 0;
          return sum + onlineAmount + offlineAmount;
        }, 0);
        
        // Calculate book counts from book_distributions (not from user object)
        const userBookCounts = {};
        if (user.bookDistributions) {
          Object.keys(user.bookDistributions).forEach(bookId => {
            userBookCounts[bookId] = (userBookCounts[bookId] || 0) + (user.bookDistributions[bookId] || 0);
          });
        }
        
        return {
          // Book counts are now aggregated from book_distributions in the next step
          hindiGita: acc.hindiGita + (userBookCounts.hindiGita || 0),
          englishGita: acc.englishGita + (userBookCounts.englishGita || 0),
          smallBooks: acc.smallBooks + (userBookCounts.smallBooks || 0),
          bhagavatam: acc.bhagavatam + (userBookCounts.bhagavatam || 0),
          chaitanyaCharitamrita: acc.chaitanyaCharitamrita + (userBookCounts.chaitanyaCharitamrita || 0),
          otherBooks: acc.otherBooks + (userBookCounts.otherBooks || 0),
          totalMoney: acc.totalMoney + userMoneyCollected, // Use calculated money from activities
          totalUsers: state.users.length,
        };
      },
      { hindiGita: 0, englishGita: 0, smallBooks: 0, bhagavatam: 0, chaitanyaCharitamrita: 0, otherBooks: 0, totalMoney: 0, totalUsers: 0 }
    );
    
    // Aggregate book_distributions for all users (for dynamic books)
    stats.bookDistributions = {};
    state.users.forEach(user => {
      if (user.bookDistributions) {
        Object.keys(user.bookDistributions).forEach(bookId => {
          if (!stats.bookDistributions[bookId]) {
            stats.bookDistributions[bookId] = 0;
          }
          stats.bookDistributions[bookId] += user.bookDistributions[bookId] || 0;
        });
      }
    });
    
    return stats;
  },

  getLeaderboard: () => {
    const state = get();
    const books = state.books; // Get active books for calculating totals
    const standardBookIds = ['hindiGita', 'englishGita', 'smallBooks', 'bhagavatam', 'chaitanyaCharitamrita', 'otherBooks'];
    
    return [...state.users]
      .map((user) => {
        let totalDistributed = 0;
        
        // If bookDistributions exists, sum all values from it
        // Count both standard books and new books (if they're active)
        if (user.bookDistributions && Object.keys(user.bookDistributions).length > 0) {
          Object.keys(user.bookDistributions).forEach(bookId => {
            const count = user.bookDistributions[bookId] || 0;
            
            // Check if this is a standard book (always count these)
            const isStandardBook = standardBookIds.includes(bookId);
            
            // Check if this is an active book from the books table
            const isActiveBook = books.some(b => {
              const activeBookId = b.id || b.bookId;
              return activeBookId === bookId;
            });
            
            // Count if it's a standard book OR an active book
            if (isStandardBook || isActiveBook) {
              totalDistributed += count;
            }
          });
        } else {
          // Fallback: use standard columns if bookDistributions doesn't exist
          totalDistributed = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
        }
        
        return {
          ...user,
          totalDistributed,
        };
      })
      .sort((a, b) => b.totalDistributed - a.totalDistributed);
  },

  getActiveDevotees: () => {
    const state = get();
    const books = state.books; // Get active books for calculating totals
    const standardBookIds = ['hindiGita', 'englishGita', 'smallBooks', 'bhagavatam', 'chaitanyaCharitamrita', 'otherBooks'];
    
    return state.users.filter((user) => {
      let total = 0;
      
      // If bookDistributions exists, sum all values from it
      // Count both standard books and new books (if they're active)
      if (user.bookDistributions && Object.keys(user.bookDistributions).length > 0) {
        Object.keys(user.bookDistributions).forEach(bookId => {
          const count = user.bookDistributions[bookId] || 0;
          
          // Check if this is a standard book (always count these)
          const isStandardBook = standardBookIds.includes(bookId);
          
          // Check if this is an active book from the books table
          const isActiveBook = books.some(b => {
            const activeBookId = b.id || b.bookId;
            return activeBookId === bookId;
          });
          
          // Count if it's a standard book OR an active book
          if (isStandardBook || isActiveBook) {
            total += count;
          }
        });
      } else {
        // Fallback: use standard columns if bookDistributions doesn't exist
        total = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
      }
      
      return total > 0;
    });
  },

  // Setup real-time subscriptions for live updates
  setupRealtimeSubscriptions: () => {
    const state = get();
    
    // Clean up existing subscriptions
    if (state.realtimeSubscriptions) {
      console.log('🧹 Cleaning up existing subscriptions...');
      state.realtimeSubscriptions.users?.unsubscribe();
      state.realtimeSubscriptions.activities?.unsubscribe();
      state.realtimeSubscriptions.bookDistributions?.unsubscribe();
      state.realtimeSubscriptions.paymentsToAdmin?.unsubscribe();
      state.realtimeSubscriptions.sadhna?.unsubscribe();
      state.realtimeSubscriptions.books?.unsubscribe();
      state.realtimeSubscriptions.adminUsers?.unsubscribe();
    }

    console.log('🔴 Setting up real-time subscriptions...');

    // Subscribe to users table changes
    const usersSubscription = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'users',
        },
        async (payload) => {
          console.log('📊 Users table changed:', payload.eventType, payload.new || payload.old);
          
          // For better performance, re-initialize only if needed
          // This ensures all related data (activities, book distributions, admin status) is refreshed
          const currentState = get();
          if (currentState.currentUserProfile?.auth_user_id) {
            console.log('🔄 Re-initializing store after user change...');
            await get().initialize(currentState.currentUserProfile.auth_user_id);
          } else {
            console.log('🔄 Re-initializing store after user change (no auth user)...');
            await get().initialize();
          }
          
          console.log('✅ Users updated in real-time!');
        }
      )
      .subscribe();

    // Subscribe to activities table changes
    const activitiesSubscription = supabase
      .channel('activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'activities',
        },
        async (payload) => {
          console.log('📝 Activities table changed:', payload.eventType, payload);
          
          // For DELETE events, completely refresh from database
          if (payload.eventType === 'DELETE') {
            console.log('Activity deleted, refreshing all data...');
            // Re-initialize to get fresh data
            const state = get();
            if (state.currentUserProfile?.auth_user_id) {
              await get().initialize(state.currentUserProfile.auth_user_id);
            } else {
              await get().initialize();
            }
            return;
          }
          
          // Refresh activities for all users - all are auto-approved
          const { data: activities, error } = await supabase
            .from('activities')
            .select('*')
            .order('date', { ascending: false });

          if (error) {
            console.error('Error refreshing activities:', error);
            return;
          }

          if (activities) {
            await updateActivitiesInStore(activities);
          } else {
            // No activities found - clear all
            const currentState = get();
            const updatedUsers = currentState.users.map((user) => ({
              ...user,
              activities: [],
            }));
            set({
              users: updatedUsers,
              currentUserProfile: currentState.currentUserProfile ? {
                ...currentState.currentUserProfile,
                activities: [],
              } : null,
            });
          }
          
          async function updateActivitiesInStore(activities) {
            // Load book distributions for all activities
            const activityIds = activities.map(a => a.id);
            let bookDistributionsByActivity = {};
            
            if (activityIds.length > 0) {
              try {
                const { data: bookDistributions } = await supabase
                  .from('book_distributions')
                  .select('*')
                  .in('activity_id', activityIds);

                if (bookDistributions) {
                  bookDistributions.forEach(bd => {
                    if (!bookDistributionsByActivity[bd.activity_id]) {
                      bookDistributionsByActivity[bd.activity_id] = {};
                    }
                    bookDistributionsByActivity[bd.activity_id][bd.book_id] = 
                      (bookDistributionsByActivity[bd.activity_id][bd.book_id] || 0) + (bd.count || 0);
                  });
                }
              } catch (err) {
                console.warn('Could not fetch book distributions in real-time:', err);
              }
            }

            // Group activities by user_id and attach book distributions
            const activitiesByUser = {};
            activities.forEach((activity) => {
              if (!activitiesByUser[activity.user_id]) {
                activitiesByUser[activity.user_id] = [];
              }
              const transformedActivity = transformActivity(activity);
              // Attach book distributions if available
              if (bookDistributionsByActivity[activity.id]) {
                transformedActivity.bookDistributions = bookDistributionsByActivity[activity.id];
              }
              activitiesByUser[activity.user_id].push(transformedActivity);
            });

            // Update users with new activities
            const currentState = get();
            const updatedUsers = currentState.users.map((user) => ({
              ...user,
              activities: activitiesByUser[user.id] || [],
            }));

            // Update current user profile activities
            let updatedCurrentUserProfile = currentState.currentUserProfile;
            if (currentState.currentUserProfile) {
              const updatedProfile = updatedUsers.find(
                (u) => u.id === currentState.currentUserProfile.id
              );
              if (updatedProfile) {
                updatedCurrentUserProfile = updatedProfile;
              }
            }

            set({
              users: updatedUsers,
              currentUserProfile: updatedCurrentUserProfile,
            });

            console.log('✅ Activities updated in real-time with book distributions!');
          }
        }
      )
      .subscribe();

    // Subscribe to book_distributions table changes
    const bookDistributionsSubscription = supabase
      .channel('book-distributions-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'book_distributions',
        },
        async (payload) => {
          console.log('📊 Book distributions table changed:', payload.eventType);
          
          // Reload activities for affected user to get updated book distributions
          if (payload.new?.user_id || payload.old?.user_id) {
            const affectedUserId = payload.new?.user_id || payload.old?.user_id;
            const updatedActivities = await get().loadUserActivities(affectedUserId);
            
            // Update user's activities in store
            const currentState = get();
            const updatedUsers = currentState.users.map((user) => {
              if (user.id === affectedUserId) {
                return { ...user, activities: updatedActivities };
              }
              return user;
            });

            // Update current user profile if it's the affected user
            let updatedCurrentUserProfile = currentState.currentUserProfile;
            if (currentState.currentUserProfile?.id === affectedUserId) {
              const updatedProfile = updatedUsers.find(u => u.id === affectedUserId);
              if (updatedProfile) {
                updatedCurrentUserProfile = updatedProfile;
              }
            }

            set({
              users: updatedUsers,
              currentUserProfile: updatedCurrentUserProfile,
            });

            console.log('✅ Book distributions updated in real-time!');
          }
        }
      )
      .subscribe();

    // Subscribe to payments_to_admin table changes
    const paymentsToAdminSubscription = supabase
      .channel('payments-to-admin-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments_to_admin',
        },
        async (payload) => {
          console.log('💰 Payments to admin table changed:', payload.eventType);
          
          // Reload payments for affected user
          if (payload.new?.user_id || payload.old?.user_id) {
            const affectedUserId = payload.new?.user_id || payload.old?.user_id;
            const updatedPayments = await get().loadPaymentsToAdmin(affectedUserId);
            
            // Update current user profile if it's the affected user
            const currentState = get();
            if (currentState.currentUserProfile?.id === affectedUserId) {
              set({
                currentUserProfile: {
                  ...currentState.currentUserProfile,
                  paymentsToAdmin: updatedPayments,
                },
              });
            }
            
            console.log('✅ Payments to admin updated in real-time!');
          }
        }
      )
      .subscribe();

    // Subscribe to sadhna table changes
    const sadhnaSubscription = supabase
      .channel('sadhna-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sadhna',
        },
        async (payload) => {
          console.log('🕉️ Sadhna table changed:', payload.eventType);
          
          // Reload sadhna for affected user
          if (payload.new?.user_id || payload.old?.user_id) {
            const affectedUserId = payload.new?.user_id || payload.old?.user_id;
            
            // Update current user profile if it's the affected user
            const currentState = get();
            if (currentState.currentUserProfile?.id === affectedUserId) {
              const updatedSadhna = await get().getUserSadhna(affectedUserId);
              set({
                currentUserProfile: {
                  ...currentState.currentUserProfile,
                  sadhna: updatedSadhna,
                },
              });
            }
            
            console.log('✅ Sadhna updated in real-time!');
          }
        }
      )
      .subscribe();

    // Subscribe to books table changes
    const booksSubscription = supabase
      .channel('books-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
        },
        async (payload) => {
          console.log('📚 Books table changed:', payload.eventType);
          
          // Reload books
          await get().loadBooks();
          
          console.log('✅ Books updated in real-time!');
        }
      )
      .subscribe();

    // Subscribe to admin_users table changes (for admin status updates)
    const adminUsersSubscription = supabase
      .channel('admin-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_users',
        },
        async (payload) => {
          console.log('🔐 Admin users table changed:', payload.eventType);
          
          // Re-initialize to refresh admin status for all users
          const currentState = get();
          if (currentState.currentUserProfile?.auth_user_id) {
            await get().initialize(currentState.currentUserProfile.auth_user_id);
          } else {
            await get().initialize();
          }
          
          console.log('✅ Admin status updated in real-time!');
        }
      )
      .subscribe();

    // Store subscription references
    set({
      realtimeSubscriptions: {
        users: usersSubscription,
        activities: activitiesSubscription,
        bookDistributions: bookDistributionsSubscription,
        paymentsToAdmin: paymentsToAdminSubscription,
        sadhna: sadhnaSubscription,
        books: booksSubscription,
        adminUsers: adminUsersSubscription,
      },
    });

    console.log('✅ All real-time subscriptions active!', {
      users: !!usersSubscription,
      activities: !!activitiesSubscription,
      bookDistributions: !!bookDistributionsSubscription,
      paymentsToAdmin: !!paymentsToAdminSubscription,
      sadhna: !!sadhnaSubscription,
      books: !!booksSubscription,
      adminUsers: !!adminUsersSubscription,
    });
  },

  // Clean up subscriptions
  cleanupRealtimeSubscriptions: () => {
    const state = get();
    if (state.realtimeSubscriptions) {
      console.log('🔴 Cleaning up real-time subscriptions...');
      state.realtimeSubscriptions.users?.unsubscribe();
      state.realtimeSubscriptions.activities?.unsubscribe();
      state.realtimeSubscriptions.bookDistributions?.unsubscribe();
      state.realtimeSubscriptions.paymentsToAdmin?.unsubscribe();
      state.realtimeSubscriptions.sadhna?.unsubscribe();
      state.realtimeSubscriptions.books?.unsubscribe();
      state.realtimeSubscriptions.adminUsers?.unsubscribe();
      set({ realtimeSubscriptions: null });
    }
  },

  // Admin functions
  deleteUser: async (userId, currentAuthUserId = null) => {
    try {
      // First, get the user's auth_user_id before deleting
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const authUserId = userData?.auth_user_id;
      const isDeletingSelf = currentAuthUserId && authUserId === currentAuthUserId;

      // Step 1: Delete from admin_users table if user is admin
      if (authUserId) {
        try {
          const { error: adminDeleteError } = await supabase
            .from('admin_users')
            .delete()
            .eq('auth_user_id', authUserId);

          if (adminDeleteError) {
            console.warn('Could not delete admin record (may not exist):', adminDeleteError);
          } else {
            console.log('✅ Admin record deleted');
          }
        } catch (adminErr) {
          console.warn('Error deleting admin record:', adminErr);
        }
      }

      // Step 2: Delete from users table (activities will cascade delete)
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Step 3: Delete from auth.users using RPC function (requires database function)
      if (authUserId) {
        try {
          // Call database function to delete auth user
          // This function must be created in Supabase with proper permissions
          const { error: authDeleteError } = await supabase.rpc('delete_auth_user', {
            user_auth_id: authUserId
          });

          if (authDeleteError) {
            console.warn('Could not delete auth user (may require manual deletion):', authDeleteError);
            console.warn('⚠️ User profile deleted but auth account still exists. User will need to signup again.');
          } else {
            console.log('✅ Auth user deleted successfully');
          }
        } catch (rpcErr) {
          console.warn('Error calling delete_auth_user RPC:', rpcErr);
          console.warn('⚠️ User profile deleted but auth account may still exist. User will need to signup again.');
        }
      }

      // Update local state
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));

      console.log('✅ User deleted successfully from database');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, updates) => {
    try {
      // Note: Book counts and total_money are not stored in users table
      // They are calculated from book_distributions and activities
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          city: updates.city,
          mobile_number: updates.mobileNumber || null,
          bace: updates.other || updates.bace || null, // Use 'bace' column name
          email: updates.email || null,
          photo: updates.photo || null, // Store photo URL
          // Book counts and total_money are not stored here
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                name: updates.name,
                city: updates.city,
                mobileNumber: updates.mobileNumber || null,
                other: updates.other || null,
                photo: updates.photo || null,
                email: updates.email || null,
                // Book counts are calculated, not stored
                hindiGita: 0,
                englishGita: 0,
                smallBooks: 0,
                bhagavatam: 0,
                chaitanyaCharitamrita: 0,
                otherBooks: 0,
                totalMoney: 0,
              }
            : u
        ),
        currentUserProfile: state.currentUserProfile?.id === userId
          ? {
              ...state.currentUserProfile,
              name: updates.name,
              city: updates.city,
              mobileNumber: updates.mobileNumber || null,
              other: updates.other || null,
              photo: updates.photo,
              email: updates.email || null,
              // Book counts are calculated, not stored
              hindiGita: 0,
              englishGita: 0,
              smallBooks: 0,
              bhagavatam: 0,
              chaitanyaCharitamrita: 0,
              otherBooks: 0,
              totalMoney: 0,
            }
          : state.currentUserProfile,
      }));

      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Helper function to recalculate user totals from all activities
  recalculateUserTotals: async (userId) => {
    try {
      // Note: Book counts are stored in book_distributions table, not in activities
      // total_money is calculated from activities, not stored in users table
      // No need to update users table with these values
      // Just reload activities to refresh the calculated values

      // Reload activities for this user (which will include book_distributions)
      const updatedActivities = await get().loadUserActivities(userId);

      // Update local state
      set((state) => ({
        users: state.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                activities: updatedActivities,
                // Book counts are calculated from book_distributions, not stored
                hindiGita: 0,
                englishGita: 0,
                smallBooks: 0,
                bhagavatam: 0,
                chaitanyaCharitamrita: 0,
                otherBooks: 0,
                totalMoney: 0, // Calculated from activities when displayed
              }
            : u
        ),
        currentUserProfile: state.currentUserProfile?.id === userId
          ? {
              ...state.currentUserProfile,
              activities: updatedActivities,
              // Book counts are calculated from book_distributions, not stored
              hindiGita: 0,
              englishGita: 0,
              smallBooks: 0,
              bhagavatam: 0,
              chaitanyaCharitamrita: 0,
              otherBooks: 0,
              totalMoney: 0,
            }
          : state.currentUserProfile,
      }));

      console.log('✅ User activities reloaded. Totals are calculated dynamically.');
      return { success: true };
    } catch (error) {
      console.error('Error recalculating user totals:', error);
      throw error;
    }
  },

  updateActivity: async (activityId, updates) => {
    try {
      // Get current activity to find user_id
      const { data: currentActivity, error: fetchError } = await supabase
        .from('activities')
        .select('user_id')
        .eq('id', activityId)
        .single();

      if (fetchError) throw fetchError;

      const userId = currentActivity.user_id;

      // Update activity in database
      // Note: Book counts are stored in book_distributions table, not in activities
      const { error } = await supabase
        .from('activities')
        .update({
          date: updates.date,
          // Book counts are in book_distributions, not here
          money_received: updates.moneyReceived || 0,
          money_online: updates.moneyOnline || 0,
          money_offline: updates.moneyOffline || 0,
        })
        .eq('id', activityId);

      if (error) throw error;

      // Recalculate user totals from all activities
      await get().recalculateUserTotals(userId);

      console.log('✅ Activity updated and user totals recalculated');
    } catch (error) {
      console.error('Error updating activity:', error);
      throw error;
    }
  },

  deleteActivity: async (activityId) => {
    try {
      // Get activity to find user_id
      const { data: activity, error: fetchError } = await supabase
        .from('activities')
        .select('user_id')
        .eq('id', activityId)
        .single();

      if (fetchError) throw fetchError;

      const userId = activity.user_id;

      // Delete activity
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      // Recalculate user totals from remaining activities
      await get().recalculateUserTotals(userId);

      console.log('✅ Activity deleted and user totals recalculated');
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },

  // Books management functions
  loadBooks: async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Transform database books to app format
      const transformedBooks = (data || []).map((book) => ({
        id: book.book_id, // Use book_id as id for compatibility
        bookId: book.book_id,
        name: book.name,
        icon: book.icon || '📖',
        price: parseFloat(book.price || 0),
        description: book.description || '',
        color: book.color || 'text-gray-600',
        bgColor: book.bg_color || 'bg-gray-600',
        isActive: book.is_active !== false,
      }));

      set({ books: transformedBooks });
      return transformedBooks;
    } catch (error) {
      console.error('Error loading books:', error);
      set({ error: error.message });
      throw error;
    }
  },

  addBook: async (bookData) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([
          {
            book_id: bookData.bookId,
            name: bookData.name,
            icon: bookData.icon || '📖',
            price: bookData.price,
            description: bookData.description || '',
            color: bookData.color || 'text-gray-600',
            bg_color: bookData.bgColor || 'bg-gray-600',
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Reload books
      await get().loadBooks();

      return {
        id: data.book_id,
        bookId: data.book_id,
        name: data.name,
        icon: data.icon,
        price: parseFloat(data.price),
        description: data.description,
        color: data.color,
        bgColor: data.bg_color,
        isActive: data.is_active,
      };
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  },

  deleteBook: async (bookId) => {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('books')
        .update({ is_active: false })
        .eq('book_id', bookId);

      if (error) throw error;

      // Reload books
      await get().loadBooks();

      console.log('✅ Book deleted successfully');
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  },

  // Load all pending activities for admin approval
  loadPendingActivities: async () => {
    try {
      console.log('Loading pending activities...');
      
      // First, try to get all activities to check if approval_status column exists
      const { data: allActivities, error: checkError } = await supabase
        .from('activities')
        .select('id, approval_status')
        .limit(1);
      
      if (checkError && checkError.message?.includes('approval_status')) {
        console.error('approval_status column does not exist. Please run the database migration:', checkError);
        console.error('Please run: database/add_approval_status_to_activities.sql in Supabase SQL Editor');
        return [];
      }
      
      const { data: activities, error } = await supabase
        .from('activities')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending activities:', error);
        throw error;
      }

      console.log(`Found ${activities?.length || 0} pending activities`);
      
      // Debug: Log first activity to see structure
      if (activities && activities.length > 0) {
        console.log('Sample pending activity:', activities[0]);
      }

      if (!activities || activities.length === 0) {
        console.log('No pending activities found. Checking if any activities exist...');
        // Debug: Check if there are any activities at all
        const { data: allActivities, count } = await supabase
          .from('activities')
          .select('id, approval_status', { count: 'exact' })
          .limit(5);
        console.log(`Total activities in database: ${count}`);
        console.log('Sample activities:', allActivities);
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(activities.map(a => a.user_id))];
      console.log(`Found ${userIds.length} unique users with pending activities`);
      
      // Fetch users with email from auth_users join (same approach as initialize)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          id, 
          name, 
          photo,
          auth_user_id,
          auth_users!inner(email)
        `)
        .in('id', userIds);

      if (usersError) {
        // Fallback: try without join
        const { data: usersData, error: fallbackError } = await supabase
          .from('users')
          .select('id, name, photo, auth_user_id')
          .in('id', userIds);
        
        if (fallbackError) throw fallbackError;
        
        // Create user map without email
        const userMap = {};
        const emailMap = {};
        usersData.forEach(user => {
          userMap[user.id] = user;
        });
        
        // Load book distributions for fallback path
        const activityIds = activities.map(a => a.id);
        let bookDistributions = [];
        if (activityIds.length > 0) {
          try {
            const { data: bdData } = await supabase
              .from('book_distributions')
              .select('*')
              .in('activity_id', activityIds);
            bookDistributions = bdData || [];
          } catch (err) {
            console.warn('Could not fetch book distributions:', err);
          }
        }
        
        return activities.map(activity => {
          const user = userMap[activity.user_id];
          const transformed = transformActivity(activity);
          
          // Add book distributions
          transformed.bookDistributions = {};
          bookDistributions
            .filter(bd => bd.activity_id === activity.id)
            .forEach(bd => {
              transformed.bookDistributions[bd.book_id] = (transformed.bookDistributions[bd.book_id] || 0) + (bd.count || 0);
            });

          return {
            ...transformed,
            user: user ? {
              id: user.id,
              name: user.name,
              email: null,
              photo: user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=a855f7&color=fff&size=128`,
            } : null,
          };
        });
      }

      // Create user map with email
      const userMap = {};
      const emailMap = {};
      users.forEach(user => {
        userMap[user.id] = user;
        // Handle email from auth_users (can be array or object)
        let email = null;
        if (user.auth_users) {
          if (Array.isArray(user.auth_users) && user.auth_users.length > 0) {
            email = user.auth_users[0].email;
          } else if (typeof user.auth_users === 'object' && user.auth_users.email) {
            email = user.auth_users.email;
          }
        }
        emailMap[user.id] = email;
      });

      // Load book distributions
      const activityIds = activities.map(a => a.id);
      let bookDistributions = [];
      if (activityIds.length > 0) {
        try {
          const { data: bdData } = await supabase
            .from('book_distributions')
            .select('*')
            .in('activity_id', activityIds);
          bookDistributions = bdData || [];
        } catch (err) {
          console.warn('Could not fetch book distributions:', err);
        }
      }

      // Transform activities with user info and book distributions
      const transformedActivities = activities.map(activity => {
        const user = userMap[activity.user_id];
        const transformed = transformActivity(activity);
        
        // Add book distributions
        transformed.bookDistributions = {};
        bookDistributions
          .filter(bd => bd.activity_id === activity.id)
          .forEach(bd => {
            transformed.bookDistributions[bd.book_id] = (transformed.bookDistributions[bd.book_id] || 0) + (bd.count || 0);
          });

        return {
          ...transformed,
          user: user ? {
            id: user.id,
            name: user.name,
            email: emailMap[user.id] || null,
            photo: user.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=a855f7&color=fff&size=128`,
          } : null,
        };
      });

      return transformedActivities;
    } catch (error) {
      console.error('Error loading pending activities:', error);
      return [];
    }
  },

  // Approve an activity
  approveActivity: async (activityId) => {
    try {
      // First, get the activity details
      const { data: activity, error: fetchError } = await supabase
        .from('activities')
        .select('*')
        .eq('id', activityId)
        .single();

      if (fetchError) throw fetchError;
      if (!activity) throw new Error('Activity not found');

      // Update activity status to approved
      const { error } = await supabase
        .from('activities')
        .update({ approval_status: 'approved' })
        .eq('id', activityId);

      if (error) throw error;

      // Note: Book counts and total_money are no longer stored in users table
      // They are calculated from book_distributions and activities tables
      // Just reload activities to refresh the calculated values

      // Reload activities to refresh the list
      await get().loadUserActivities(activity.user_id, true);

      return { success: true };
    } catch (error) {
      console.error('Error approving activity:', error);
      throw error;
    }
  },

  // Reject an activity
  rejectActivity: async (activityId) => {
    try {
      const { error } = await supabase
        .from('activities')
        .update({ approval_status: 'rejected' })
        .eq('id', activityId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error rejecting activity:', error);
      throw error;
    }
  },

  // Sadhna functions
  submitSadhna: async (sadhnaData, userId) => {
    try {
      const { error } = await supabase
        .from('sadhna')
        .upsert({
          user_id: userId,
          date: sadhnaData.date,
          wake_up_time: sadhnaData.wakeUpTime || null,
          mangla_arti: sadhnaData.manglaArti || false,
          tulsi_arti: sadhnaData.tulsiArti || false,
          guru_puja: sadhnaData.guruPuja || false,
          sandhya_arti: sadhnaData.sandhyaArti || false,
          first_round_timing: sadhnaData.firstRoundTiming || null,
          last_round_timing: sadhnaData.lastRoundTiming || null,
          total_rounds: sadhnaData.totalRounds || 0,
          lecture_hearing: sadhnaData.lectureHearing || null,
          book_reading: sadhnaData.bookReading || null,
          services_done: sadhnaData.servicesDone || null,
        }, {
          onConflict: 'user_id,date',
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error submitting sadhna:', error);
      throw error;
    }
  },

  getSadhnaForDate: async (userId, date) => {
    try {
      const { data, error } = await supabase
        .from('sadhna')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      if (!data) return null;

      return {
        id: data.id,
        wakeUpTime: data.wake_up_time || '',
        manglaArti: data.mangla_arti || false,
        tulsiArti: data.tulsi_arti || false,
        guruPuja: data.guru_puja || false,
        sandhyaArti: data.sandhya_arti || false,
        firstRoundTiming: data.first_round_timing || '',
        lastRoundTiming: data.last_round_timing || '',
        totalRounds: data.total_rounds || 0,
        lectureHearing: data.lecture_hearing || '',
        bookReading: data.book_reading || '',
        servicesDone: data.services_done || '',
        date: data.date,
      };
    } catch (error) {
      console.error('Error fetching sadhna:', error);
      throw error;
    }
  },

  getAllSadhna: async () => {
    try {
      // Fetch sadhna with user info
      const { data: sadhnaData, error } = await supabase
        .from('sadhna')
        .select(`
          *,
          users!inner (
            id,
            name,
            photo,
            auth_user_id
          )
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch emails separately using RPC function
      let emailMap = {};
      try {
        const { data: emailsData } = await supabase.rpc('get_users_with_email').catch(() => null);
        if (emailsData) {
          emailsData.forEach((item) => {
            if (item.id && item.email) {
              emailMap[item.id] = item.email;
            }
          });
        }
      } catch (err) {
        console.log('Email fetch not available for sadhna, continuing without email');
      }

      // Transform the data
      return sadhnaData.map((sadhna) => {
        const user = sadhna.users;
        const email = emailMap[user?.id] || null;

        return {
          id: sadhna.id,
          userId: sadhna.user_id,
          userName: user?.name || 'Unknown',
          userPhoto: user?.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=a855f7&color=fff&size=128`,
          userEmail: email,
          date: sadhna.date,
          wakeUpTime: sadhna.wake_up_time || '',
          manglaArti: sadhna.mangla_arti || false,
          tulsiArti: sadhna.tulsi_arti || false,
          guruPuja: sadhna.guru_puja || false,
          sandhyaArti: sadhna.sandhya_arti || false,
          firstRoundTiming: sadhna.first_round_timing || '',
          lastRoundTiming: sadhna.last_round_timing || '',
          totalRounds: sadhna.total_rounds || 0,
          lectureHearing: sadhna.lecture_hearing || '',
          bookReading: sadhna.book_reading || '',
          servicesDone: sadhna.services_done || '',
          createdAt: sadhna.created_at,
        };
      });
    } catch (error) {
      console.error('Error fetching all sadhna:', error);
      throw error;
    }
  },

  getUserSadhna: async (userId) => {
    try {
      const { data: sadhnaData, error } = await supabase
        .from('sadhna')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return sadhnaData.map((sadhna) => ({
        id: sadhna.id,
        date: sadhna.date,
        wakeUpTime: sadhna.wake_up_time || '',
        manglaArti: sadhna.mangla_arti || false,
        tulsiArti: sadhna.tulsi_arti || false,
        guruPuja: sadhna.guru_puja || false,
        sandhyaArti: sadhna.sandhya_arti || false,
        firstRoundTiming: sadhna.first_round_timing || '',
        lastRoundTiming: sadhna.last_round_timing || '',
        totalRounds: sadhna.total_rounds || 0,
        lectureHearing: sadhna.lecture_hearing || '',
        bookReading: sadhna.book_reading || '',
        servicesDone: sadhna.services_done || '',
        createdAt: sadhna.created_at,
      }));
    } catch (error) {
      console.error('Error fetching user sadhna:', error);
      throw error;
    }
  },

  // Load payments to admin for a user
  loadPaymentsToAdmin: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('payments_to_admin')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading payments to admin:', error);
      throw error;
    }
  },

  // Submit payment to admin
  submitPaymentToAdmin: async (userId, paymentData) => {
    try {
      const { data, error } = await supabase
        .from('payments_to_admin')
        .insert([
          {
            user_id: userId,
            date: paymentData.date,
            money_online: paymentData.onlineAmount || 0,
            money_offline: paymentData.offlineAmount || 0,
            total_amount: (paymentData.onlineAmount || 0) + (paymentData.offlineAmount || 0),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error submitting payment to admin:', error);
      throw error;
    }
  },

  // Approve user (admin only)
  approveUser: async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ approval_status: 'approved' })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, approvalStatus: 'approved' } : u
        ),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error approving user:', error);
      throw error;
    }
  },

  // Reject user (admin only) - Completely deletes user data from database
  rejectUser: async (userId) => {
    try {
      // First, get the user's auth_user_id before deleting
      const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('auth_user_id')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const authUserId = userData?.auth_user_id;

      // Step 1: Delete from admin_users table if user is admin
      if (authUserId) {
        try {
          const { error: adminDeleteError } = await supabase
            .from('admin_users')
            .delete()
            .eq('auth_user_id', authUserId);

          if (adminDeleteError) {
            console.warn('Could not delete admin record (may not exist):', adminDeleteError);
          } else {
            console.log('✅ Admin record deleted');
          }
        } catch (adminErr) {
          console.warn('Error deleting admin record:', adminErr);
        }
      }

      // Step 2: Delete from users table (activities, book_distributions, payments_to_admin, sadhna will cascade delete)
      const { error, data } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Error deleting user from users table:', error);
        // Check if it's an RLS policy error
        if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
          throw new Error('Permission denied: Admin delete policy may not be set. Please run database/15_add_user_delete_policy.sql');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn('User not found or already deleted:', userId);
        // User might already be deleted, continue anyway
      } else {
        console.log('✅ User deleted from users table:', userId);
      }

      // Step 3: Delete from auth.users using RPC function (requires database function)
      if (authUserId) {
        try {
          // Call database function to delete auth user
          // This function must be created in Supabase with proper permissions
          const { error: authDeleteError } = await supabase.rpc('delete_auth_user', {
            user_auth_id: authUserId
          });

          if (authDeleteError) {
            console.warn('Could not delete auth user (may require manual deletion):', authDeleteError);
            console.warn('⚠️ User profile deleted but auth account still exists. User will need to signup again.');
          } else {
            console.log('✅ Auth user deleted successfully');
          }
        } catch (rpcErr) {
          console.warn('Error calling delete_auth_user RPC:', rpcErr);
          console.warn('⚠️ User profile deleted but auth account may still exist. User will need to signup again.');
        }
      }

      // Update local state - remove user from list
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));

      console.log('✅ User rejected and deleted successfully from database');
      return { success: true };
    } catch (error) {
      console.error('Error rejecting user:', error);
      throw error;
    }
  },

  // Get app config value
  getAppConfig: async (key) => {
    try {
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      
      return data?.value || null;
    } catch (error) {
      console.error('Error getting app config:', error);
      // Return default value if config doesn't exist
      if (key === 'require_admin_approval') {
        return 'true'; // Default to requiring approval
      }
      return null;
    }
  },

  // Update app config value
  updateAppConfig: async (key, value) => {
    try {
      const upsertData = {
        key,
        value,
        updated_at: new Date().toISOString(),
      };
      
      const upsertOptions = {
        onConflict: 'key',
      };
      
      const { data, error } = await supabase
        .from('app_config')
        .upsert(upsertData, upsertOptions)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Error updating app config:', error);
      throw error;
    }
  }
}));
