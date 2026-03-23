import { useState } from 'react'
import { GlowCard, Slot, Picker } from './CardPicker'
import { EquityResult, LoadingSkeleton } from './EquityDisplay'

const API_URL = '/api/equity'

const LABEL_STYLE = {
  fontFamily: 'Syne',
  fontSize: '.65rem',
  fontWeight: 600,
  letterSpacing: '.12em',
  textTransform: 'uppercase',
  color: '#52525b',
  marginBottom: '.75rem',
  display: 'block',
}

export default function CalculatorPage() {
  const [hand, setHand] = useState([])
  const [board, setBoard] = useState([])
  const [opponents, setOpponents] = useState(1)
  const [iterations, setIterations] = useState(10000)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [picker, setPicker] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const allUsed = [...hand, ...board]
  const canCalc = hand.length === 2 && !loading
  const boardOk = [0, 3, 4, 5].includes(board.length)

  function openPicker(type, index) {
    setPicker({ type, i: index })
  }

  function onPick(card) {
    if (!picker) return
    if (picker.type === 'hand') {
      const next = [...hand]
      next[picker.i] = card
      setHand(next.filter(Boolean))
    } else {
      const next = [...board]
      next[picker.i] = card
      setBoard(next.filter(Boolean))
    }
    setPicker(null)
  }

  function clearCard(type, index) {
    if (type === 'hand') {
      setHand(hand.filter((_, j) => j !== index))
    } else {
      setBoard(board.filter((_, j) => j !== index))
    }
    setResult(null)
    setShowResult(false)
  }

  async function calculate() {
    if (!canCalc || !boardOk) return
    setLoading(true)
    setResult(null)
    setShowResult(false)
    setError(null)

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hand, board, opponents, iterations }),
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'calculation failed')
      }

      const data = await resp.json()
      setResult(data)
      setTimeout(() => setShowResult(true), 50)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHand([])
    setBoard([])
    setResult(null)
    setShowResult(false)
    setError(null)
  }

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn .3s ease-out' }}>
      {/* hole cards */}
      <div>
        <label style={LABEL_STYLE}>Your Hand</label>
        <div className="flex gap-3">
          {[0, 1].map((i) =>
            hand[i]
              ? <GlowCard key={i} card={hand[i]} onRemove={() => clearCard('hand', i)} />
              : <Slot key={i} label="?" onClick={() => openPicker('hand', i)}
                  active={picker?.type === 'hand' && picker?.i === i} />
          )}
        </div>
      </div>

      {/* board cards */}
      <div>
        <label style={LABEL_STYLE}>Board</label>
        <div className="flex gap-3 items-center">
          {/* flop */}
          <div className="flex gap-2 pr-2 border-r border-zinc-800/50">
            {[0, 1, 2].map((i) =>
              board[i]
                ? <GlowCard key={i} card={board[i]} onRemove={() => clearCard('board', i)} />
                : <Slot key={i} label="F" onClick={() => openPicker('board', i)}
                    active={picker?.type === 'board' && picker?.i === i} />
            )}
          </div>
          {/* turn */}
          <div className="px-1">
            {board[3]
              ? <GlowCard card={board[3]} onRemove={() => clearCard('board', 3)} />
              : <Slot label="T" onClick={() => openPicker('board', 3)}
                  active={picker?.type === 'board' && picker?.i === 3} />
            }
          </div>
          {/* river */}
          <div className="pl-1 border-l border-zinc-800/50">
            {board[4]
              ? <GlowCard card={board[4]} onRemove={() => clearCard('board', 4)} />
              : <Slot label="R" onClick={() => openPicker('board', 4)}
                  active={picker?.type === 'board' && picker?.i === 4} />
            }
          </div>
          <span className="text-zinc-700 font-mono text-xs ml-2">
            {board.length === 0 && 'pre-flop'}
            {board.length === 3 && 'flop'}
            {board.length === 4 && 'turn'}
            {board.length === 5 && 'river'}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label style={LABEL_STYLE}>Opponents</label>
          <div className="flex items-center gap-4">
            <input
              type="range" min="1" max="9"
              value={opponents}
              onChange={(e) => setOpponents(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800
              flex items-center justify-center font-mono text-lg font-bold">
              {opponents}
            </div>
          </div>
        </div>
        <div>
          <label style={LABEL_STYLE}>Iterations</label>
          <div className="flex gap-2">
            {[5000, 10000, 50000].map((n) => (
              <button
                key={n}
                onClick={() => setIterations(n)}
                className={`flex-1 py-2.5 rounded-lg font-mono text-xs transition-all duration-300
                  ${iterations === n
                    ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900'
                  }`}
              >
                {n / 1000}k
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* action buttons */}
      <div className="flex gap-3">
        <button
          onClick={calculate}
          disabled={!canCalc || !boardOk}
          className="relative flex-1 group overflow-hidden"
        >
          <div
            className={`absolute inset-0 rounded-xl transition-opacity duration-500
              ${canCalc && boardOk ? 'opacity-100' : 'opacity-0'}`}
            style={{
              background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(52,211,153,0.05), rgba(16,185,129,0.15))',
              backgroundSize: '200% 100%',
              animation: 'shimmer 3s ease-in-out infinite'
            }}
          />
          <div
            className={`relative py-4 rounded-xl font-semibold text-sm tracking-wider
              uppercase border transition-all duration-300
              ${canCalc && boardOk
                ? 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/50 active:scale-[0.98]'
                : 'border-zinc-800 text-zinc-700 cursor-not-allowed'}`}
            style={{ fontFamily: 'Syne' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                Running Monte Carlo...
              </span>
            ) : 'Calculate Equity'}
          </div>
        </button>
        {(hand.length > 0 || board.length > 0) && (
          <button
            onClick={reset}
            className="px-6 py-4 rounded-xl font-semibold text-sm tracking-wider uppercase
              border border-zinc-800/60 text-zinc-600 hover:border-zinc-700 hover:text-zinc-400
              transition-all active:scale-[0.98]"
            style={{ fontFamily: 'Syne' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* validation hint */}
      {board.length > 0 && !boardOk && (
        <div className="text-red-400/70 font-mono text-xs">
          board needs 3, 4, or 5 cards (currently {board.length})
        </div>
      )}

      {/* error */}
      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-5 py-3
          text-red-400 font-mono text-sm">
          {error}
        </div>
      )}

      {/* loading */}
      {loading && <LoadingSkeleton />}

      {/* result */}
      {result && !loading && showResult && <EquityResult result={result} />}

      {/* empty state */}
      {!result && !loading && hand.length < 2 && (
        <div className="text-center py-12" style={{ animation: 'fadeIn .5s ease-out' }}>
          <div className="text-3xl mb-3 opacity-20">♠ ♥</div>
          <p className="text-zinc-600 font-mono text-sm">
            select your 2 hole cards to get started
          </p>
        </div>
      )}

      {/* picker modal */}
      {picker && (
        <Picker
          used={allUsed}
          onPick={onPick}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}
