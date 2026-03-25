import { useState } from 'react'
import ParticleCanvas from './components/ParticleCanvas'
import CalculatorPage from './components/CalculatorPage'
import RangeGridPage from './components/RangeGridPage'
import HandHistoryPage from './components/HandHistoryPage'
import HowItWorksPage from './components/HowItWorksPage'
import AboutPage from './components/AboutPage'

const TABS = [
  { id: 'calc', label: 'Calculator', icon: '\u2660' },
  { id: 'range', label: 'Range Grid', icon: '\u25A6' },
  { id: 'history', label: 'History', icon: '\u2630' },
  { id: 'how', label: 'How It Works', icon: '\u2699' },
  { id: 'about', label: 'About', icon: '\u2726' },
]

export default function App() {
  const [tab, setTab] = useState('calc')

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden font-body">
      {/* particles */}
      <ParticleCanvas />

      {/* top glow */}
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
          <div className="max-w-2xl mx-auto px-6 pt-5 pb-0">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-zinc-600 text-lg">
                  <span>♠</span>
                  <span className="text-red-500/60">♥</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <h1
                    className="text-xl font-bold tracking-tight cursor-pointer font-display"
                    onClick={() => setTab('calc')}
                  >
                    PokerLens
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/10
                    text-emerald-400 font-mono text-[10px] font-semibold">
                    BETA
                  </span>
                </div>
              </div>
              <a
                href="https://github.com/amrithpusala/pokerlens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-700 font-mono text-xs hover:text-zinc-400 transition-colors"
              >
                github
              </a>
            </div>

            {/* tabs */}
            <div className="flex gap-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative px-5 py-3 text-sm font-medium transition-all
                    duration-300 font-display
                    ${tab === t.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`text-xs ${tab === t.id ? 'opacity-100' : 'opacity-40'}`}>
                      {t.icon}
                    </span>
                    {t.label}
                  </span>
                  {tab === t.id && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-emerald-400"
                      style={{ animation: 'fadeIn .2s ease-out' }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* page content */}
        <main className="max-w-2xl mx-auto px-6 py-8" key={tab}>
          {tab === 'calc' && <CalculatorPage />}
          {tab === 'range' && <RangeGridPage />}
          {tab === 'history' && <HandHistoryPage />}
          {tab === 'how' && <HowItWorksPage />}
          {tab === 'about' && <AboutPage />}
        </main>

        {/* footer */}
        <footer className="border-t border-zinc-900/50 mt-16">
          <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">
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
