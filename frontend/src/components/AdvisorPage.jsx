import { useState } from 'react'
import { GlowCard, Slot, Picker } from './CardPicker'

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

const ACTION_STYLES = {
  raise: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'RAISE' },
  bet: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', label: 'BET' },
  call: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: 'CALL' },
  check: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-300', label: 'CHECK' },
  fold: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: 'FOLD' },
}

const CONFIDENCE_STYLES = {
  high: { text: 'text-emerald-400', label: 'high confidence' },
  medium: { text: 'text-yellow-400', label: 'medium confidence' },
  low: { text: 'text-red-400', label: 'low confidence' },
}

export default function AdvisorPage() {
  const [hand, setHand] = useState([])
  const [board, setBoard] = useState([])
  const [opponents, setOpponents] = useState(1)
  const [potSize, setPotSize] = useState('')
  const [betToCall, setBetToCall] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [picker, setPicker] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || ''
  const allUsed = [...hand, ...board]
  const canSubmit = hand.length === 2 && potSize !== '' && !loading
  const boardOk = [0, 3, 4, 5].includes(board.length)

  function openPicker(type, index) { setPicker({ type, i: index }) }
  function onPick(card) {
    if (!picker) return
    if (picker.type === 'hand') {
      const n = [...hand]; n[picker.i] = card; setHand(n.filter(Boolean))
    } else {
      const n = [...board]; n[picker.i] = card; setBoard(n.filter(Boolean))
    }
    setPicker(null)
  }
  function clearCard(type, index) {
    if (type === 'hand') setHand(hand.filter((_, j) => j !== index))
    else setBoard(board.filter((_, j) => j !== index))
    setResult(null)
  }

  async function getAdvice() {
    if (!canSubmit || !boardOk) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const resp = await fetch(`${API_BASE}/api/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hand, board, opponents,
          pot_size: parseFloat(potSize) || 0,
          bet_to_call: parseFloat(betToCall) || 0,
        }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'failed to get advice')
      }
      setResult(await resp.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHand([]); setBoard([]); setPotSize(''); setBetToCall('')
    setResult(null); setError(null)
  }

  const actionStyle = result ? ACTION_STYLES[result.action] || ACTION_STYLES.check : null
  const confStyle = result ? CONFIDENCE_STYLES[result.confidence] || CONFIDENCE_STYLES.low : null

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn .3s ease-out' }}>
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Syne' }}>
          Action Advisor
        </h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Enter your hand, the board, and pot information. Get a recommended action with the math behind it.
        </p>
      </div>

      {/* hand */}
      <div>
        <label style={LABEL_STYLE}>Your Hand</label>
        <div className="flex gap-3">
          {[0, 1].map(i => hand[i]
            ? <GlowCard key={i} card={hand[i]} onRemove={() => clearCard('hand', i)} />
            : <Slot key={i} label="?" onClick={() => openPicker('hand', i)}
                active={picker?.type === 'hand' && picker?.i === i} />
          )}
        </div>
      </div>

      {/* board */}
      <div>
        <label style={LABEL_STYLE}>Board</label>
        <div className="flex gap-3 items-center">
          <div className="flex gap-2 pr-2 border-r border-zinc-800/50">
            {[0, 1, 2].map(i => board[i]
              ? <GlowCard key={i} card={board[i]} onRemove={() => clearCard('board', i)} />
              : <Slot key={i} label="F" onClick={() => openPicker('board', i)}
                  active={picker?.type === 'board' && picker?.i === i} />
            )}
          </div>
          <div className="px-1">
            {board[3]
              ? <GlowCard card={board[3]} onRemove={() => clearCard('board', 3)} />
              : <Slot label="T" onClick={() => openPicker('board', 3)}
                  active={picker?.type === 'board' && picker?.i === 3} />
            }
          </div>
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

      {/* pot info + opponents */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label style={LABEL_STYLE}>Pot Size</label>
          <input
            type="number" min="0" step="0.5"
            placeholder="100"
            value={potSize}
            onChange={e => setPotSize(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800
              text-white text-sm font-mono placeholder-zinc-600
              focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Bet to Call</label>
          <input
            type="number" min="0" step="0.5"
            placeholder="0"
            value={betToCall}
            onChange={e => setBetToCall(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900/50 border border-zinc-800
              text-white text-sm font-mono placeholder-zinc-600
              focus:outline-none focus:border-zinc-600 transition-colors"
          />
        </div>
        <div>
          <label style={LABEL_STYLE}>Opponents</label>
          <div className="flex items-center gap-3">
            <input
              type="range" min="1" max="9"
              value={opponents}
              onChange={e => setOpponents(parseInt(e.target.value))}
              className="flex-1"
            />
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800
              flex items-center justify-center font-mono text-lg font-bold">
              {opponents}
            </div>
          </div>
        </div>
      </div>

      {/* action buttons */}
      <div className="flex gap-3">
        <button onClick={getAdvice} disabled={!canSubmit || !boardOk}
          className="relative flex-1 group overflow-hidden">
          <div className={`absolute inset-0 rounded-xl transition-opacity duration-500
            ${canSubmit && boardOk ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(52,211,153,0.05), rgba(16,185,129,0.15))',
              backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className={`relative py-4 rounded-xl font-semibold text-sm tracking-wider
            uppercase border transition-all duration-300
            ${canSubmit && boardOk
              ? 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 active:scale-[0.98]'
              : 'border-zinc-800 text-zinc-700 cursor-not-allowed'}`}
            style={{ fontFamily: 'Syne' }}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : 'Get Advice'}
          </div>
        </button>
        {(hand.length > 0 || board.length > 0 || potSize) && (
          <button onClick={reset} className="px-6 py-4 rounded-xl font-semibold text-sm
            tracking-wider uppercase border border-zinc-800/60 text-zinc-600
            hover:border-zinc-700 hover:text-zinc-400 transition-all active:scale-[0.98]"
            style={{ fontFamily: 'Syne' }}>Clear</button>
        )}
      </div>

      {board.length > 0 && !boardOk && (
        <div className="text-red-400/70 font-mono text-xs">
          board needs 3, 4, or 5 cards (currently {board.length})
        </div>
      )}

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-5 py-3
          text-red-400 font-mono text-sm text-center">{error}</div>
      )}

      {/* result */}
      {result && (
        <div className="space-y-4" style={{ animation: 'slideUp .4s cubic-bezier(.16,1,.3,1)' }}>
          {/* main recommendation */}
          <div className={`relative overflow-hidden rounded-2xl border ${actionStyle.border} ${actionStyle.bg} p-6`}>
            <div className="absolute top-0 left-1/4 w-1/2 h-20 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)' }} />
            <div className="relative flex items-center justify-between">
              <div>
                <div className={`text-4xl font-bold tracking-tight ${actionStyle.text}`}
                  style={{ fontFamily: 'Syne' }}>
                  {actionStyle.label}
                </div>
                <div className={`text-xs font-mono mt-1 ${confStyle.text}`}>
                  {confStyle.label}
                </div>
              </div>
              <div className="text-right">
                <div className="text-zinc-500 text-xs font-mono">hand strength</div>
                <div className="text-white text-sm font-semibold mt-0.5">{result.hand_category}</div>
              </div>
            </div>
          </div>

          {/* equity and pot odds */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-white">
                {(result.equity * 100).toFixed(1)}%
              </div>
              <div className="text-zinc-600 text-xs uppercase tracking-wider mt-1"
                style={{ fontFamily: 'Syne' }}>equity</div>
            </div>
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 text-center">
              <div className="font-mono text-2xl font-bold text-white">
                {result.pot_odds !== null ? `${(result.pot_odds * 100).toFixed(1)}%` : 'n/a'}
              </div>
              <div className="text-zinc-600 text-xs uppercase tracking-wider mt-1"
                style={{ fontFamily: 'Syne' }}>pot odds needed</div>
            </div>
          </div>

          {/* draws */}
          {result.draws && result.draws.length > 0 && (
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                style={{ fontFamily: 'Syne' }}>draws</div>
              <div className="flex flex-wrap gap-2">
                {result.draws.map((d, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-zinc-800/50 border
                    border-zinc-700/40 font-mono text-xs text-zinc-300">
                    {d.draw} <span className="text-blue-400 ml-1">{d.outs} outs</span>
                  </span>
                ))}
              </div>
              <div className="text-xs font-mono text-zinc-600 mt-2">
                total: {result.total_outs} outs
              </div>
            </div>
          )}

          {/* reasoning */}
          <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-3"
              style={{ fontFamily: 'Syne' }}>reasoning</div>
            <div className="space-y-2">
              {result.reasoning.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400/60 text-xs mt-0.5">{'\u25B8'}</span>
                  <span className="text-zinc-400 text-sm">{r}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center font-mono text-xs text-zinc-700">
            {result.method === 'neural_net' ? 'neural net inference' : 'monte carlo'}
          </div>
        </div>
      )}

      {/* empty state */}
      {!result && !loading && hand.length < 2 && (
        <div className="text-center py-12" style={{ animation: 'fadeIn .5s ease-out' }}>
          <div className="text-3xl mb-3 opacity-20">♠ ♥</div>
          <p className="text-zinc-600 font-mono text-sm">
            select your cards and enter pot info
          </p>
        </div>
      )}

      {picker && <Picker used={allUsed} onPick={onPick} onClose={() => setPicker(null)} />}
    </div>
  )
}
