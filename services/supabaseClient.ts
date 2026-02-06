
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec variables d'environnement Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcteljnmcdelbratudnc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjdGVsam5tY2RlbGJyYXR1ZG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2MTkzMDQsImV4cCI6MjA4NTE5NTMwNH0.jbWM24_1ernpGVHS7i32Jx0W9K7yx8WdCLqq42tzwOo';

console.log('🔧 Supabase Configuration:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
  keyStart: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'Missing',
  client: supabaseUrl && supabaseAnonKey ? 'Active' : 'Fallback to localStorage'
});

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Test de connexion immédiat
if (supabase) {
  console.log('🧪 Test de connexion Supabase...');
  supabase.from('cases').select('count', { count: 'exact' }).then(({ data, error }) => {
    if (error) {
      console.error('❌ Erreur de test Supabase:', error);
    } else {
      console.log('✅ Test Supabase réussi:', data);
    }
  });
}
