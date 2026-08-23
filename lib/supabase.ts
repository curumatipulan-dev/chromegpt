import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Database features will not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

export type ChatSession = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  language: string | null;
  is_code: boolean;
  created_at: string;
};

export type FileRecord = {
  id: string;
  name: string;
  path: string;
  language: string | null;
  content: string;
  service: 'github' | 'gmail' | 'drive' | 'dropbox' | 'local';
  size: number;
  created_at: string;
  updated_at: string;
};

export type ServiceConnection = {
  id: string;
  service_name: 'github' | 'gmail' | 'drive' | 'dropbox' | 'local';
  status: 'connected' | 'disconnected';
  connected_at: string | null;
  metadata: Record<string, unknown>;
};
