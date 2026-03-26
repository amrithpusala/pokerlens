import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  // get display name or email
  const name = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'user'

  const avatar = user.user_metadata?.avatar_url
  const initial = name[0].toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg
          hover:bg-zinc-900 transition-colors"
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            className="w-6 h-6 rounded-full border border-zinc-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700
            flex items-center justify-center text-xs font-mono font-bold text-zinc-400">
            {initial}
          </div>
        )}
        <span className="text-zinc-500 font-mono text-xs hidden sm:inline">
          {name}
        </span>
      </button>

      {open && (
        <>
          {/* backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-48 bg-zinc-950 border
              border-zinc-800 rounded-xl shadow-xl overflow-hidden"
            style={{ animation: 'fadeIn .1s ease-out' }}
          >
            <div className="px-4 py-3 border-b border-zinc-800/60">
              <div className="text-sm text-white font-medium truncate">{name}</div>
              <div className="text-xs text-zinc-600 font-mono truncate">{user.email}</div>
            </div>
            <button
              onClick={() => { signOut(); setOpen(false) }}
              className="w-full px-4 py-2.5 text-left text-sm text-zinc-400
                hover:bg-zinc-900 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
