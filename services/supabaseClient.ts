
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec variables d'environnement Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcteljnmcdelbratudnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgzNTU5NzQsImV4cCI6MjA1MzkzMTk3NH0.sb_publishable_G1mHK_QYnKAUNrqQ8PHKgA_AZIKHQx9';

console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl ? 'Configured' : 'Missing',
  key: supabaseAnonKey ? 'Configured' : 'Missing',
  client: supabaseUrl && supabaseAnonKey ? 'Active' : 'Fallback to localStorage'
});

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
