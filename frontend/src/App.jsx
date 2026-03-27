import { useState } from 'react'
import AuthProvider, { useAuth } from './components/AuthProvider'
import ParticleCanvas from './components/ParticleCanvas'
import CalculatorPage from './components/CalculatorPage'
import AdvisorPage from './components/AdvisorPage'
import RangeGridPage from './components/RangeGridPage'
import HandHistoryPage from './components/HandHistoryPage'
import HowItWorksPage from './components/HowItWorksPage'
import AboutPage from './components/AboutPage'
import AuthPage from './components/AuthPage'
import UserMenu from './components/UserMenu'

const TABS = [
  { id: 'calc', label: 'Calculator', icon: '\u2660' },
  { id: 'advisor', label: 'Advisor', icon: '\u2691' },
  { id: 'range', label: 'Ranges', icon: '\u25A6' },
  { id: 'history', label: 'History', icon: '\u2630' },
  { id: 'how', label: 'How It Works', icon: '\u2699' },
  { id: 'about', label: 'About', icon: '\u2726' },
]

function AppContent() {
  const { user, loading } = useAuth()
  const [tab, setTab] = useState('calc')
  const [showAuth, setShowAuth] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-body">
      <ParticleCanvas />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]
          rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)'
        }}
      />

      <div className="relative z-10">
        {/* header */}
        <header className="border-b border-zinc-900/80">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-zinc-600 text-lg">
                  <span>♠</span>
                  <span className="text-red-500/60">♥</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h1
                    className="text-xl font-bold tracking-tight cursor-pointer font-display"
                    onClick={() => { setTab('calc'); setShowAuth(false) }}
                  >
                    PokerLens
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/10
                    text-emerald-400 font-mono text-[10px] font-semibold">
                    BETA
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="https://github.com/amrithpusala/pokerlens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 font-mono text-xs hover:text-zinc-400 transition-colors"
                >
                  github
                </a>
                {user ? (
                  <UserMenu />
                ) : (
                  <button
                    onClick={() => setShowAuth(true)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-400
                      text-xs font-mono hover:border-zinc-600 hover:text-zinc-300 transition-all"
                  >
                    sign in
                  </button>
                )}
              </div>
            </div>

            {/* tabs */}
            {!showAuth && (
              <div className="flex gap-0 -mb-px overflow-x-auto scrollbar-hide">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`relative px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium
                      transition-all duration-300 font-display whitespace-nowrap shrink-0
                      ${tab === t.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`text-xs ${tab === t.id ? 'opacity-100' : 'opacity-40'}`}>
                        {t.icon}
                      </span>
                      {t.label}
                    </span>
                    {tab === t.id && (
                      <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-emerald-400 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* page content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8" key={showAuth ? 'auth' : tab}>
          {showAuth && !user ? (
            <AuthPage />
          ) : (
            <>
              {tab === 'calc' && <CalculatorPage />}
              {tab === 'advisor' && <AdvisorPage />}
              {tab === 'range' && <RangeGridPage />}
              {tab === 'history' && <HandHistoryPage />}
              {tab === 'how' && <HowItWorksPage />}
              {tab === 'about' && <AboutPage />}
            </>
          )}
        </main>

        {/* footer */}
        <footer className="border-t border-zinc-900/50 mt-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
            <span className="text-zinc-800 font-mono text-xs">
              monte carlo · treys · pytorch
            </span>
            <span className="text-zinc-800 font-mono text-xs">amrith pusala</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
