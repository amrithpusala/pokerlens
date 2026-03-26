// supabase.js — supabase client configuration
//
// the anon key is safe to expose on the frontend. it only allows
// operations permitted by your row-level security (RLS) policies.
// the service role key is NEVER used on the frontend.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

let supabase = null

// only create the client if both values look valid
// wrap in try-catch so the app doesn't crash if config is wrong
if (supabaseUrl.startsWith('https://') && supabaseAnonKey.length > 10) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (err) {
    console.warn('failed to initialize supabase client:', err.message)
    supabase = null
  }
} else {
  console.warn('supabase env vars not set or invalid. auth will be disabled.')
}

export { supabase }
export const isSupabaseConfigured = () => supabase !== null
