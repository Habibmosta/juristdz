import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          profession: 'avocat' | 'notaire' | 'huissier' | 'magistrat' | 'etudiant' | 'juriste_entreprise';
          registration_number: string | null;
          barreau_id: string | null;
          organization_name: string | null;
          phone_number: string | null;
          languages: string[];
          specializations: string[];
          is_active: boolean;
          email_verified: boolean;
          mfa_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          profession: 'avocat' | 'notaire' | 'huissier' | 'magistrat' | 'etudiant' | 'juriste_entreprise';
          registration_number?: string | null;
          barreau_id?: string | null;
          organization_name?: string | null;
          phone_number?: string | null;
          languages?: string[];
          specializations?: string[];
          is_active?: boolean;
          email_verified?: boolean;
          mfa_enabled?: boolean;
        };
        Update: {
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          profession?: 'avocat' | 'notaire' | 'huissier' | 'magistrat' | 'etudiant' | 'juriste_entreprise';
          registration_number?: string | null;
          barreau_id?: string | null;
          organization_name?: string | null;
          phone_number?: string | null;
          languages?: string[];
          specializations?: string[];
          is_active?: boolean;
          email_verified?: boolean;
          mfa_enabled?: boolean;
        };
      };
      cases: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          client_name: string;
          description: string | null;
          status: 'active' | 'closed' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          client_name: string;
          description?: string | null;
          status?: 'active' | 'closed' | 'archived';
        };
        Update: {
          title?: string;
          client_name?: string;
          description?: string | null;
          status?: 'active' | 'closed' | 'archived';
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          case_id: string | null;
          title: string;
          content: string;
          document_type: string;
          language: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          case_id?: string | null;
          title: string;
          content: string;
          document_type: string;
          language?: string;
        };
        Update: {
          case_id?: string | null;
          title?: string;
          content?: string;
          document_type?: string;
          language?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro' | 'cabinet' | 'enterprise';
          status: 'active' | 'cancelled' | 'expired';
          credits_remaining: number;
          started_at: string;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan: 'free' | 'pro' | 'cabinet' | 'enterprise';
          status?: 'active' | 'cancelled' | 'expired';
          credits_remaining?: number;
          started_at?: string;
          expires_at?: string | null;
        };
        Update: {
          plan?: 'free' | 'pro' | 'cabinet' | 'enterprise';
          status?: 'active' | 'cancelled' | 'expired';
          credits_remaining?: number;
          expires_at?: string | null;
        };
      };
    };
  };
}
