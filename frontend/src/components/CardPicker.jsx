import { useState } from 'react'

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const SUITS = ['s', 'h', 'd', 'c']
const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_NAMES = { s: 'Spades', h: 'Hearts', d: 'Diamonds', c: 'Clubs' }

function isRed(suit) {
  return suit === 'h' || suit === 'd'
}

export function GlowCard({ card, onRemove }) {
  const [hover, setHover] = useState(false)
  const rank = card[0]
  const suit = card[1]
  const r = isRed(suit)

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`absolute -inset-1 rounded-2xl blur-md transition-opacity duration-300
          ${hover ? 'opacity-60' : 'opacity-0'}`}
        style={{
          background: r
            ? 'radial-gradient(circle, rgba(239,68,68,0.5), transparent)'
            : 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)'
        }}
      />
      <div
        className={`relative w-16 h-[5.5rem] rounded-xl border-2 font-mono font-bold
          flex flex-col items-center justify-center gap-0.5 transition-all duration-300
          ${r
            ? 'border-red-500/40 bg-gradient-to-b from-red-500/10 to-red-900/10'
            : 'border-zinc-500/40 bg-gradient-to-b from-zinc-700/20 to-zinc-900/30'}
          ${hover ? 'scale-105 shadow-lg' : ''}`}
        style={{ backdropFilter: 'blur(8px)' }}
      >
        <span className={`text-xl ${r ? 'text-red-400' : 'text-white'}`}>{rank}</span>
        <span className={`text-base ${r ? 'text-red-400' : 'text-zinc-300'}`}>
          {SUIT_SYMBOLS[suit]}
        </span>
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-zinc-800 border
          border-zinc-700 text-zinc-400 text-xs flex items-center justify-center
          opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500
          hover:border-red-500 hover:text-white hover:scale-110"
      >
        ×
      </button>
    </div>
  )
}

export function Slot({ label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`w-16 h-[5.5rem] rounded-xl border-2 border-dashed flex items-center
        justify-center transition-all duration-300 cursor-pointer font-mono text-sm
        relative overflow-hidden
        ${active
          ? 'border-emerald-400/60 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)]'
          : 'border-zinc-700/60 text-zinc-600 hover:border-zinc-500 hover:text-zinc-400'}`}
    >
      {active && <div className="absolute inset-0 bg-emerald-400/5 animate-pulse" />}
      <span className="relative z-10">{label}</span>
    </button>
  )
}

export function Picker({ used, onPick, onClose }) {
  const usedSet = new Set(used)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        style={{ animation: 'fadeIn .15s ease-out' }}
      />
      <div
        className="relative bg-zinc-950/95 border border-zinc-800/80 rounded-2xl p-6
          max-w-xl w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'slideUp .25s cubic-bezier(.16,1,.3,1)',
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span
              className="font-semibold text-sm tracking-wider uppercase text-zinc-300"
              style={{ fontFamily: 'Syne' }}
            >
              pick a card
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500
              flex items-center justify-center hover:bg-zinc-800 hover:text-white transition-all"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {SUITS.map((suit) => (
            <div key={suit}>
              <div className={`text-xs font-mono mb-2 flex items-center gap-1.5
                ${isRed(suit) ? 'text-red-500/50' : 'text-zinc-600'}`}
              >
                <span className="text-base">{SUIT_SYMBOLS[suit]}</span>
                {SUIT_NAMES[suit]}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {RANKS.map((rank) => {
                  const card = rank + suit
                  const dimmed = usedSet.has(card)
                  const r = isRed(suit)
                  return (
                    <button
                      key={card}
                      onClick={() => {
                        if (!dimmed) { onPick(card); onClose() }
                      }}
                      className={`w-11 h-14 rounded-lg border font-mono font-semibold
                        flex flex-col items-center justify-center text-sm transition-all
                        select-none
                        ${dimmed
                          ? 'border-zinc-800/50 bg-zinc-900/30 opacity-20 cursor-not-allowed'
                          : `border-zinc-800 ${r
                              ? 'bg-red-500/5 hover:bg-red-500/15 hover:border-red-500/40'
                              : 'bg-zinc-900/50 hover:bg-zinc-800 hover:border-zinc-500'}
                            cursor-pointer active:scale-90`}`}
                    >
                      <span className={r ? 'text-red-400' : 'text-white'}>{rank}</span>
                      <span className={`text-[10px] ${r ? 'text-red-400/70' : 'text-zinc-500'}`}>
                        {SUIT_SYMBOLS[suit]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
