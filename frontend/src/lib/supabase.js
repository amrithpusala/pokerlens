// supabase.js — supabase client configuration
//
// the anon key is safe to expose on the frontend. it only allows
// operations permitted by your row-level security (RLS) policies.
// the service role key is NEVER used on the frontend.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('supabase env vars not set. auth and history storage will be disabled.')
}

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => supabase !== null
