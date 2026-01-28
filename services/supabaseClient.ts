
import { createClient } from '@supabase/supabase-js';

// Identifiants fournis pour la pré-production
const supabaseUrl = process.env.SUPABASE_URL || 'https://fcteljnmcdelbratudnc.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_G1mHK_QYnKAUNrqQ8PHKgA_AZIKHQx9';

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;
