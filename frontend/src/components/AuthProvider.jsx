// AuthProvider.jsx — manages supabase auth state across the app
//
// wraps the entire app and provides:
//   - user: the current user object (or null if signed out)
//   - loading: true while checking initial auth state
//   - signInWithGoogle: triggers google oauth popup
//   - signInWithGithub: triggers github oauth popup
//   - signInWithEmail: email/password sign in
//   - signUpWithEmail: email/password sign up
//   - signOut: signs the user out

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithGithub: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    // check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithGoogle() {
    if (!supabase) return { error: 'supabase not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    return { error }
  }

  async function signInWithGithub() {
    if (!supabase) return { error: 'supabase not configured' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    })
    return { error }
  }

  async function signInWithEmail(email, password) {
    if (!supabase) return { error: 'supabase not configured' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUpWithEmail(email, password) {
    if (!supabase) return { error: 'supabase not configured' }
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithGithub,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
