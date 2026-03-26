// db.js — supabase database operations for hand histories
//
// all operations use row-level security (RLS) policies on the
// supabase side. each user can only read/write their own rows.
// the anon key + user JWT handle authorization automatically.

import { supabase, isSupabaseConfigured } from './supabase'

export async function saveHandHistory(userId, fileName, hands) {
  if (!isSupabaseConfigured() || !userId) return { error: 'not configured' }

  const { data, error } = await supabase
    .from('hand_histories')
    .insert({
      user_id: userId,
      file_name: fileName,
      hands_count: hands.length,
      hands_data: hands,
    })
    .select()
    .single()

  return { data, error }
}

export async function loadHandHistories(userId) {
  if (!isSupabaseConfigured() || !userId) return { data: [], error: null }

  const { data, error } = await supabase
    .from('hand_histories')
    .select('id, file_name, hands_count, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  return { data: data || [], error }
}

export async function loadHandHistoryById(id) {
  if (!isSupabaseConfigured()) return { data: null, error: 'not configured' }

  const { data, error } = await supabase
    .from('hand_histories')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

export async function deleteHandHistory(id) {
  if (!isSupabaseConfigured()) return { error: 'not configured' }

  const { error } = await supabase
    .from('hand_histories')
    .delete()
    .eq('id', id)

  return { error }
}
