import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function AuthPage() {
  const { signInWithGoogle, signInWithGithub, signInWithEmail, signUpWithEmail } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleOAuth(provider) {
    setError(null)
    const fn = provider === 'google' ? signInWithGoogle : signInWithGithub
    const { error } = await fn()
    if (error) setError(error.message || String(error))
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email || !password) {
      setError('please enter both email and password')
      return
    }
    if (password.length < 6) {
      setError('password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'signin') {
      const { error } = await signInWithEmail(email, password)
      if (error) setError(error.message)
    } else {
      const { data, error } = await signUpWithEmail(email, password)
      if (error) {
        setError(error.message)
      } else if (data?.user && !data.user.confirmed_at) {
        setMessage('check your email for a confirmation link')
      }
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn .3s ease-out' }}>
      <div className="text-center py-6">
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Syne' }}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-zinc-500 text-sm">
          {mode === 'signin'
            ? 'sign in to save your hand histories across devices'
            : 'create an account to get started'}
        </p>
      </div>

      <div className="max-w-sm mx-auto space-y-6">
        {/* oauth buttons */}
        <div className="space-y-3">
          <button
            onClick={() => handleOAuth('google')}
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50
              text-zinc-300 text-sm font-medium flex items-center justify-center gap-3
              hover:border-zinc-600 hover:bg-zinc-900 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <button
            onClick={() => handleOAuth('github')}
            className="w-full py-3 px-4 rounded-xl border border-zinc-800 bg-zinc-900/50
              text-zinc-300 text-sm font-medium flex items-center justify-center gap-3
              hover:border-zinc-600 hover:bg-zinc-900 transition-all active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-zinc-600 text-xs font-mono">or</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* email form */}
        <div className="space-y-3">
          <div>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800
                text-white text-sm font-mono placeholder-zinc-600
                focus:outline-none focus:border-zinc-600 transition-colors"
              autoComplete="email"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800
                text-white text-sm font-mono placeholder-zinc-600
                focus:outline-none focus:border-zinc-600 transition-colors"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </div>

          <button
            onClick={handleEmailSubmit}
            disabled={loading}
            className="relative w-full group overflow-hidden"
          >
            <div className="absolute inset-0 rounded-xl opacity-100"
              style={{
                background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(52,211,153,0.05), rgba(16,185,129,0.15))',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s ease-in-out infinite'
              }}
            />
            <div className="relative py-3 rounded-xl font-semibold text-sm tracking-wider
              uppercase border border-emerald-400/30 text-emerald-400
              hover:bg-emerald-400/10 hover:border-emerald-400/50
              active:scale-[0.98] transition-all"
              style={{ fontFamily: 'Syne' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </div>
          </button>
        </div>

        {/* error / success messages */}
        {error && (
          <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3
            text-red-400 font-mono text-xs text-center">
            {error}
          </div>
        )}
        {message && (
          <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-xl px-4 py-3
            text-emerald-400 font-mono text-xs text-center">
            {message}
          </div>
        )}

        {/* toggle sign in / sign up */}
        <div className="text-center">
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setMessage(null) }}
            className="text-zinc-500 text-xs font-mono hover:text-zinc-300 transition-colors"
          >
            {mode === 'signin'
              ? "don't have an account? create one"
              : 'already have an account? sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
