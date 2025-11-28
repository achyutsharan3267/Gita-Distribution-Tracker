import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Get these from your Supabase project settings: https://app.supabase.com
// Note: "anon key" and "publishable key" are the same thing - use either one
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Create singleton Supabase client to avoid multiple instances
let supabaseInstance = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Supabase credentials not found!',
    '\nPlease set in .env file:',
    '\n  VITE_SUPABASE_URL=your-url',
    '\n  VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-key',
    '\n\nCurrent values:',
    '\n  URL:', supabaseUrl || 'MISSING',
    '\n  Key:', supabaseAnonKey ? 'SET' : 'MISSING'
  );
} else {
  if (!supabaseInstance) {
    console.log('✅ Supabase configured:', {
      url: supabaseUrl.substring(0, 30) + '...',
      hasKey: !!supabaseAnonKey
    });
    
    // Create Supabase client with singleton pattern
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
}

// Export singleton instance
export const supabase = supabaseInstance || createClient(supabaseUrl || '', supabaseAnonKey || '');

