import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  const checkAdminStatus = async (userId) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();
      
      setIsAdmin(!error && !!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // After successful login, check if user profile exists
      if (data?.user?.id) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', data.user.id)
          .single();
        
        // If profile doesn't exist, sign out and show error
        if (profileError || !userProfile) {
          await supabase.auth.signOut();
          return { 
            data: null,
            error: { 
              message: 'User account not found. Please sign up again.' 
            } 
          };
        }
      }
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setIsAdmin(false);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateUserPassword = async (userId, newPassword) => {
    try {
      // Only admins can update other users' passwords
      if (!isAdmin) {
        throw new Error('Only admins can update user passwords');
      }
      
      // Use Supabase Admin API (requires service role key)
      // For now, we'll use a database function
      const { error } = await supabase.rpc('update_user_password', {
        user_id: userId,
        new_password: newPassword,
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updatePassword,
    updateUserPassword,
    isAuthenticated: !!user,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

