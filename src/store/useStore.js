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
    email: email,
    photo: dbUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.name)}&background=a855f7&color=fff&size=128`,
    hindiGita: dbUser.hindi_gita || 0,
    englishGita: dbUser.english_gita || 0,
    smallBooks: dbUser.small_books || 0,
    bhagavatam: dbUser.bhagavatam || 0,
    chaitanyaCharitamrita: dbUser.chaitanya_charitamrita || 0,
    otherBooks: dbUser.other_books || 0,
    totalMoney: parseFloat(dbUser.total_money || 0),
    activities: [], // Will be loaded separately
  };
};

// Helper function to transform app user to database format
const transformUserToDb = (user) => {
  const dbUser = {
    name: user.name,
    city: user.city || null,
    mobile_number: user.mobileNumber || null,
    photo: user.photo || null,
    hindi_gita: user.hindiGita || 0,
    english_gita: user.englishGita || 0,
    small_books: user.smallBooks || 0,
    bhagavatam: user.bhagavatam || 0,
    chaitanya_charitamrita: user.chaitanyaCharitamrita || 0,
    other_books: user.otherBooks || 0,
    total_money: user.totalMoney || 0,
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
  hindiGita: dbActivity.hindi_gita || 0,
  englishGita: dbActivity.english_gita || 0,
  smallBooks: dbActivity.small_books || 0,
  bhagavatam: dbActivity.bhagavatam || 0,
  chaitanyaCharitamrita: dbActivity.chaitanya_charitamrita || 0,
  otherBooks: dbActivity.other_books || 0,
  moneyReceived: parseFloat(dbActivity.money_received || 0),
  moneyOnline: parseFloat(dbActivity.money_online || 0),
  moneyOffline: parseFloat(dbActivity.money_offline || 0),
});

export const useStore = create((set, get) => ({
  users: [],
  currentUserId: null,
  currentUserProfile: null, // The authenticated user's profile
  loading: true,
  error: null,
  realtimeSubscriptions: null, // Store subscription references

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
      
      return data ? transformUser(data) : null;
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      return null;
    }
  },

  // Load activities for a specific user
  loadUserActivities: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data?.map(transformActivity) || [];
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

      // Fetch activities for all users
      console.log('Fetching activities from database...');
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false });

      if (activitiesError) {
        console.error('Error fetching activities:', activitiesError);
        throw new Error(`Database error: ${activitiesError.message}`);
      }
      
      console.log(`Loaded ${activities?.length || 0} activities`);

      // Group activities by user_id
      const activitiesByUser = {};
      activities?.forEach((activity) => {
        if (!activitiesByUser[activity.user_id]) {
          activitiesByUser[activity.user_id] = [];
        }
        activitiesByUser[activity.user_id].push(transformActivity(activity));
      });

      // Transform users and attach activities
      const transformedUsers = users?.map((user) => ({
        ...transformUser(user),
        activities: activitiesByUser[user.id] || [],
      })) || [];

      // Get authenticated user's profile if authUserId provided
      let currentUserProfile = null;
      let currentUserId = null;
      
      if (authUserId) {
        currentUserProfile = await get().getCurrentUserProfile(authUserId);
        if (currentUserProfile) {
          // Load activities for current user
          currentUserProfile.activities = await get().loadUserActivities(currentUserProfile.id);
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
      // Don't set auth_user_id explicitly - let the trigger handle it
      // This ensures RLS policy works correctly
      
      const { data, error } = await supabase
        .from('users')
        .insert([dbUser])
        .select()
        .single();

      if (error) throw error;

      const newUser = {
        ...transformUser(data),
        activities: [],
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

      // Calculate new totals
      const newHindiGita = user.hindiGita + (distribution.hindiGita || 0);
      const newEnglishGita = user.englishGita + (distribution.englishGita || 0);
      const newSmallBooks = user.smallBooks + (distribution.smallBooks || 0);
      const newBhagavatam = (user.bhagavatam || 0) + (distribution.bhagavatam || 0);
      const newChaitanyaCharitamrita = (user.chaitanyaCharitamrita || 0) + (distribution.chaitanyaCharitamrita || 0);
      const newOtherBooks = (user.otherBooks || 0) + (distribution.otherBooks || 0);
      const newTotalMoney = user.totalMoney + (distribution.moneyReceived || 0);

      // Update user totals in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          hindi_gita: newHindiGita,
          english_gita: newEnglishGita,
          small_books: newSmallBooks,
          bhagavatam: newBhagavatam,
          chaitanya_charitamrita: newChaitanyaCharitamrita,
          other_books: newOtherBooks,
          total_money: newTotalMoney,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Insert new activity
      const { data: activityData, error: activityError } = await supabase
        .from('activities')
        .insert([
          {
            user_id: userId,
            date: new Date().toISOString().split('T')[0],
            hindi_gita: distribution.hindiGita || 0,
            english_gita: distribution.englishGita || 0,
            small_books: distribution.smallBooks || 0,
            bhagavatam: distribution.bhagavatam || 0,
            chaitanya_charitamrita: distribution.chaitanyaCharitamrita || 0,
            other_books: distribution.otherBooks || 0,
            money_received: distribution.moneyReceived || 0,
            money_online: distribution.moneyOnline || 0,
            money_offline: distribution.moneyOffline || 0,
          },
        ])
        .select()
        .single();

      if (activityError) throw activityError;

      // Update local state
      const newActivity = transformActivity(activityData);
      
      set((state) => {
        const updatedUsers = state.users.map((u) =>
          u.id === userId
            ? {
                ...u,
                hindiGita: newHindiGita,
                englishGita: newEnglishGita,
                smallBooks: newSmallBooks,
                bhagavatam: newBhagavatam,
                chaitanyaCharitamrita: newChaitanyaCharitamrita,
                otherBooks: newOtherBooks,
                totalMoney: newTotalMoney,
                activities: [newActivity, ...u.activities],
              }
            : u
        );

        // Update currentUserProfile if it's the same user
        const updatedCurrentUserProfile = 
          state.currentUserProfile?.id === userId
            ? {
                ...state.currentUserProfile,
                hindiGita: newHindiGita,
                englishGita: newEnglishGita,
                smallBooks: newSmallBooks,
                bhagavatam: newBhagavatam,
                chaitanyaCharitamrita: newChaitanyaCharitamrita,
                otherBooks: newOtherBooks,
                totalMoney: newTotalMoney,
                activities: [newActivity, ...(state.currentUserProfile.activities || [])],
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
    return state.users.reduce(
      (acc, user) => ({
        hindiGita: acc.hindiGita + user.hindiGita,
        englishGita: acc.englishGita + user.englishGita,
        smallBooks: acc.smallBooks + user.smallBooks,
        bhagavatam: acc.bhagavatam + (user.bhagavatam || 0),
        chaitanyaCharitamrita: acc.chaitanyaCharitamrita + (user.chaitanyaCharitamrita || 0),
        otherBooks: acc.otherBooks + (user.otherBooks || 0),
        totalMoney: acc.totalMoney + user.totalMoney,
        totalUsers: state.users.length,
      }),
      { hindiGita: 0, englishGita: 0, smallBooks: 0, bhagavatam: 0, chaitanyaCharitamrita: 0, otherBooks: 0, totalMoney: 0, totalUsers: 0 }
    );
  },

  getLeaderboard: () => {
    const state = get();
    return [...state.users]
      .sort((a, b) => {
        const totalA = a.hindiGita + a.englishGita + a.smallBooks + (a.bhagavatam || 0) + (a.chaitanyaCharitamrita || 0) + (a.otherBooks || 0);
        const totalB = b.hindiGita + b.englishGita + b.smallBooks + (b.bhagavatam || 0) + (b.chaitanyaCharitamrita || 0) + (b.otherBooks || 0);
        return totalB - totalA;
      })
      .map((user) => ({
        ...user,
        totalDistributed: user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0),
      }));
  },

  getActiveDevotees: () => {
    const state = get();
    return state.users.filter((user) => {
      const total = user.hindiGita + user.englishGita + user.smallBooks + (user.bhagavatam || 0) + (user.chaitanyaCharitamrita || 0) + (user.otherBooks || 0);
      return total > 0;
    });
  },

  // Setup real-time subscriptions for live updates
  setupRealtimeSubscriptions: () => {
    const state = get();
    
    // Clean up existing subscriptions
    if (state.realtimeSubscriptions) {
      state.realtimeSubscriptions.users?.unsubscribe();
      state.realtimeSubscriptions.activities?.unsubscribe();
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
          
          // Refresh users data
          const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

          if (!error && users) {
            // Get current activities
            const { data: activities } = await supabase
              .from('activities')
              .select('*')
              .order('date', { ascending: false });

            // Group activities by user_id
            const activitiesByUser = {};
            activities?.forEach((activity) => {
              if (!activitiesByUser[activity.user_id]) {
                activitiesByUser[activity.user_id] = [];
              }
              activitiesByUser[activity.user_id].push(transformActivity(activity));
            });

            // Transform users
            const transformedUsers = users.map((user) => ({
              ...transformUser(user),
              activities: activitiesByUser[user.id] || [],
            }));

            const currentState = get();
            
            // Update current user profile if it changed
            let updatedCurrentUserProfile = currentState.currentUserProfile;
            if (currentState.currentUserProfile) {
              const updatedProfile = transformedUsers.find(
                (u) => u.id === currentState.currentUserProfile.id
              );
              if (updatedProfile) {
                updatedCurrentUserProfile = updatedProfile;
              }
            }

            set({
              users: transformedUsers,
              currentUserProfile: updatedCurrentUserProfile,
            });

            console.log('✅ Users updated in real-time!');
          }
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
          console.log('📝 Activities table changed:', payload.eventType);
          
          // Refresh activities for all users
          const { data: activities, error } = await supabase
            .from('activities')
            .select('*')
            .order('date', { ascending: false });

          if (!error && activities) {
            // Group activities by user_id
            const activitiesByUser = {};
            activities.forEach((activity) => {
              if (!activitiesByUser[activity.user_id]) {
                activitiesByUser[activity.user_id] = [];
              }
              activitiesByUser[activity.user_id].push(transformActivity(activity));
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

            console.log('✅ Activities updated in real-time!');
          }
        }
      )
      .subscribe();

    // Store subscription references
    set({
      realtimeSubscriptions: {
        users: usersSubscription,
        activities: activitiesSubscription,
      },
    });

    console.log('✅ Real-time subscriptions active!');
  },

  // Clean up subscriptions
  cleanupRealtimeSubscriptions: () => {
    const state = get();
    if (state.realtimeSubscriptions) {
      console.log('🔴 Cleaning up real-time subscriptions...');
      state.realtimeSubscriptions.users?.unsubscribe();
      state.realtimeSubscriptions.activities?.unsubscribe();
      set({ realtimeSubscriptions: null });
    }
  },

  // Admin functions
  deleteUser: async (userId) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        users: state.users.filter((u) => u.id !== userId),
      }));

      console.log('✅ User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          name: updates.name,
          city: updates.city,
          photo: updates.photo,
          hindi_gita: updates.hindiGita,
          english_gita: updates.englishGita,
          small_books: updates.smallBooks,
          bhagavatam: updates.bhagavatam,
          chaitanya_charitamrita: updates.chaitanyaCharitamrita,
          other_books: updates.otherBooks,
          total_money: updates.totalMoney,
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
                photo: updates.photo,
                hindiGita: updates.hindiGita,
                englishGita: updates.englishGita,
                smallBooks: updates.smallBooks,
                bhagavatam: updates.bhagavatam,
                chaitanyaCharitamrita: updates.chaitanyaCharitamrita,
                otherBooks: updates.otherBooks,
                totalMoney: updates.totalMoney,
              }
            : u
        ),
      }));

      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  deleteActivity: async (activityId) => {
    try {
      // Get activity to update user totals
      const { data: activity, error: fetchError } = await supabase
        .from('activities')
        .select('*, users!inner(*)')
        .eq('id', activityId)
        .single();

      if (fetchError) throw fetchError;

      // Delete activity
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;

      // Update user totals
      const user = activity.users;
      const updatedUser = {
        hindi_gita: Math.max(0, user.hindi_gita - (activity.hindi_gita || 0)),
        english_gita: Math.max(0, user.english_gita - (activity.english_gita || 0)),
        small_books: Math.max(0, user.small_books - (activity.small_books || 0)),
        bhagavatam: Math.max(0, (user.bhagavatam || 0) - (activity.bhagavatam || 0)),
        chaitanya_charitamrita: Math.max(0, (user.chaitanya_charitamrita || 0) - (activity.chaitanya_charitamrita || 0)),
        other_books: Math.max(0, (user.other_books || 0) - (activity.other_books || 0)),
        total_money: Math.max(0, user.total_money - (activity.money_received || 0)),
      };

      await supabase
        .from('users')
        .update(updatedUser)
        .eq('id', user.id);

      // Update local state
      set((state) => ({
        users: state.users.map((u) =>
          u.id === user.id
            ? {
                ...u,
                hindiGita: updatedUser.hindi_gita,
                englishGita: updatedUser.english_gita,
                smallBooks: updatedUser.small_books,
                bhagavatam: updatedUser.bhagavatam,
                chaitanyaCharitamrita: updatedUser.chaitanya_charitamrita,
                otherBooks: updatedUser.other_books,
                totalMoney: updatedUser.total_money,
                activities: u.activities.filter((a) => a.id !== activityId),
              }
            : u
        ),
      }));

      console.log('✅ Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },
}));
