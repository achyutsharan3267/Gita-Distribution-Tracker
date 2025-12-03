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
      console.log('❌ No userId provided for admin check');
      setIsAdmin(false);
      return;
    }
    
    try {
      console.log('🔍 Checking admin status for user:', userId);
      
      // First try direct query
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, email, auth_user_id')
        .eq('auth_user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - try RPC function as fallback
          console.log('ℹ️ Direct query returned no rows, trying RPC function...');
          try {
            const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin', {
              user_id: userId
            });
            
            if (rpcError) {
              console.error('❌ RPC function also failed:', rpcError);
              console.log('💡 To make this user an admin, run: database/13_add_admin_user.sql');
              setIsAdmin(false);
            } else {
              const adminStatus = rpcResult || false;
              console.log('✅ RPC function result:', adminStatus);
              setIsAdmin(adminStatus);
            }
          } catch (rpcErr) {
            console.error('❌ RPC function error:', rpcErr);
            console.log('💡 To make this user an admin, run: database/13_add_admin_user.sql');
            setIsAdmin(false);
          }
        } else {
          // Other error - try RPC as fallback
          console.error('❌ Error checking admin status:', error);
          console.log('🔄 Trying RPC function as fallback...');
          try {
            const { data: rpcResult, error: rpcError } = await supabase.rpc('is_admin', {
              user_id: userId
            });
            
            if (!rpcError && rpcResult) {
              console.log('✅ RPC function succeeded:', rpcResult);
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (rpcErr) {
            console.error('❌ RPC function also failed:', rpcErr);
            setIsAdmin(false);
          }
        }
      } else if (data) {
        console.log('✅ User is admin (from direct query):', data);
        setIsAdmin(true);
      } else {
        console.log('ℹ️ No admin data found');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
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
      
      // After successful login, check if user profile exists and is approved
      if (data?.user?.id) {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, approval_status')
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
        
        // Check if approval_status column exists (handle case where migration not run)
        const approvalStatus = userProfile.approval_status;
        
        // If approval_status doesn't exist (null/undefined), allow login (backward compatibility)
        if (approvalStatus === null || approvalStatus === undefined) {
          console.log('approval_status column not found, allowing login (backward compatibility)');
          return { data, error: null };
        }
        
        // Check if admin approval is required
        let requireApproval = true; // Default to requiring approval for security
        try {
          const { data: configData, error: configError } = await supabase
            .from('app_config')
            .select('value')
            .eq('key', 'require_admin_approval')
            .single();
          
          if (configError) {
            // If table doesn't exist or no config found, check if approval_status column exists
            // If column exists, require approval. If not, allow (backward compatibility)
            if (configError.code === 'PGRST116' || configError.message?.includes('relation "app_config" does not exist')) {
              // Table doesn't exist - if approval_status column exists, require approval
              if (approvalStatus !== null && approvalStatus !== undefined) {
                requireApproval = true; // Column exists, require approval
                console.log('app_config table not found but approval_status exists, requiring approval');
              } else {
                requireApproval = false; // Column doesn't exist, backward compatibility
                console.log('Neither app_config nor approval_status found, allowing login (backward compatibility)');
              }
            } else {
              throw configError;
            }
          } else {
            requireApproval = configData?.value === 'true';
          }
        } catch (err) {
          // If error checking config, default to requiring approval if approval_status exists
          if (approvalStatus !== null && approvalStatus !== undefined) {
            requireApproval = true;
            console.log('Error checking config, but approval_status exists, requiring approval:', err);
          } else {
            requireApproval = false;
            console.log('Error checking config and no approval_status, allowing login:', err);
          }
        }
        
        // Only check approval status if admin approval is required
        // Normalize approval status (trim and lowercase for comparison)
        const normalizedStatus = approvalStatus?.toString().toLowerCase().trim();
        
        console.log('Login check:', {
          requireApproval,
          approvalStatus,
          normalizedStatus,
          isApproved: normalizedStatus === 'approved'
        });
        
        if (requireApproval && normalizedStatus !== 'approved') {
          await supabase.auth.signOut();
          if (normalizedStatus === 'rejected') {
            return { 
              data: null,
              error: { 
                message: 'Your account has been rejected. Please contact admin for assistance.' 
              } 
            };
          } else {
            return { 
              data: null,
              error: { 
                message: `Your approval is pending. Current status: ${approvalStatus || 'pending'}. Please try after some time.` 
              } 
            };
          }
        }
        
        // If approved or approval not required, allow login
        console.log('Login allowed - user approved or approval not required');
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

