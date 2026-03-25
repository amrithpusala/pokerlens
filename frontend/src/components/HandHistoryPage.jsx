import { useState } from 'react'

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

const SUIT_SYMBOLS = { s: '♠', h: '♥', d: '♦', c: '♣' }
const isRed = (s) => s === 'h' || s === 'd'

function MiniCard({ card }) {
  if (!card || card.length !== 2) return null
  const rank = card[0]
  const suit = card[1]
  const r = isRed(suit)
  return (
    <span className={`inline-flex items-center gap-0 font-mono text-xs font-bold px-1.5 py-0.5 rounded border
      ${r ? 'text-red-400 border-red-500/30 bg-red-500/5' : 'text-white border-zinc-600 bg-zinc-900'}`}>
      {rank}<span className="text-[10px]">{SUIT_SYMBOLS[suit]}</span>
    </span>
  )
}

function EquityDot({ equity, label }) {
  if (equity === null || equity === undefined) return null
  const pct = (equity * 100).toFixed(1)
  const color = equity > 0.6 ? 'text-emerald-400' : equity > 0.4 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="text-center">
      <div className={`font-mono text-sm font-bold ${color}`}>{pct}%</div>
      <div className="text-zinc-600 text-[10px] uppercase tracking-wider" style={{ fontFamily: 'Syne' }}>{label}</div>
    </div>
  )
}

function EquityBar({ equity }) {
  if (!equity) return null
  const streets = [
    { key: 'preflop', label: 'Pre' },
    { key: 'flop', label: 'Flop' },
    { key: 'turn', label: 'Turn' },
    { key: 'river', label: 'River' },
  ].filter(s => equity[s.key] !== null && equity[s.key] !== undefined)

  if (streets.length === 0) return null

  return (
    <div className="flex items-end gap-3">
      {streets.map((s, i) => {
        const val = equity[s.key]
        const height = Math.max(val * 60, 4)
        const color = val > 0.6 ? 'bg-emerald-500' : val > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
        return (
          <div key={s.key} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[10px] text-zinc-500">{(val * 100).toFixed(0)}%</span>
            <div className={`w-6 rounded-t ${color} transition-all`} style={{ height: `${height}px`, opacity: 0.8 }} />
            <span className="text-[9px] text-zinc-600 uppercase" style={{ fontFamily: 'Syne' }}>{s.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function HandCard({ hand, index }) {
  const [expanded, setExpanded] = useState(false)

  const resultColor = hand.result === 'won'
    ? 'text-emerald-400'
    : hand.result === 'folded'
      ? 'text-zinc-500'
      : 'text-red-400'

  return (
    <div className="border border-zinc-800/60 rounded-xl overflow-hidden hover:border-zinc-700/60 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-zinc-600 w-6">#{index + 1}</span>
          <div className="flex gap-1">
            {hand.hero_hand.map((c, i) => <MiniCard key={i} card={c} />)}
          </div>
          {hand.board.flop.length > 0 && (
            <div className="flex gap-1 ml-2 pl-2 border-l border-zinc-800/50">
              {[...hand.board.flop, ...hand.board.turn, ...hand.board.river].map((c, i) =>
                <MiniCard key={i} card={c} />
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <EquityBar equity={hand.equity} />
          <span className={`font-mono text-xs font-semibold ${resultColor}`}>
            {hand.result}
          </span>
          <span className="text-zinc-600 text-sm">{expanded ? '\u25B2' : '\u25BC'}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-zinc-800/40 space-y-3" style={{ animation: 'fadeIn .15s ease-out' }}>
          {/* equity trajectory */}
          <div className="flex gap-6">
            <EquityDot equity={hand.equity.preflop} label="pre-flop" />
            <EquityDot equity={hand.equity.flop} label="flop" />
            <EquityDot equity={hand.equity.turn} label="turn" />
            <EquityDot equity={hand.equity.river} label="river" />
          </div>

          {/* actions by street */}
          {['preflop', 'flop', 'turn', 'river'].map(street => {
            const actions = hand.actions[street]
            if (!actions || actions.length === 0) return null
            return (
              <div key={street}>
                <div className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1" style={{ fontFamily: 'Syne' }}>
                  {street}
                </div>
                <div className="space-y-0.5">
                  {actions.map((a, i) => (
                    <div key={i} className="font-mono text-xs text-zinc-500">
                      <span className={a.player === hand.hero ? 'text-white' : ''}>{a.player}</span>
                      <span className="text-zinc-600 ml-1">{a.action}</span>
                      {a.detail && <span className="text-zinc-700 ml-1">{a.detail}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="flex gap-4 text-xs font-mono text-zinc-600">
            {hand.pot && <span>pot: {hand.pot}</span>}
            {hand.players_at_start > 0 && <span>{hand.players_at_start} players</span>}
            {hand.hand_id && <span>#{hand.hand_id}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HandHistoryPage() {
  const [hands, setHands] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || ''
  const MAX_FILE_SIZE = 512 * 1024

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setError(`file too large (${(file.size / 1024).toFixed(0)} KB). max is 512 KB.`)
      return
    }

    setFileName(file.name)
    setLoading(true)
    setError(null)
    setHands(null)

    try {
      const text = await file.text()

      const resp = await fetch(`${API_BASE}/api/parse-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: text,
      })

      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'failed to parse hand history')
      }

      const data = await resp.json()
      if (data.hands_parsed === 0) {
        setError('no hands found. make sure this is a PokerStars hand history file (.txt)')
      } else {
        setHands(data.hands)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setHands(null)
    setError(null)
    setFileName(null)
  }

  // summary stats
  const won = hands?.filter(h => h.result === 'won').length || 0
  const lost = hands?.filter(h => h.result === 'lost').length || 0
  const folded = hands?.filter(h => h.result === 'folded').length || 0

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn .3s ease-out' }}>
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Syne' }}>
          Hand History Review
        </h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Upload a PokerStars hand history .txt file. Each hand is analyzed with equity computed at every street.
        </p>
      </div>

      {/* upload area */}
      {!hands && !loading && (
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <div className="w-full max-w-md border-2 border-dashed border-zinc-700/60 rounded-2xl p-10 text-center
              hover:border-zinc-500 transition-all group-hover:bg-zinc-900/20">
              <div className="text-2xl mb-3 opacity-30">♠</div>
              <div className="text-zinc-400 text-sm font-medium mb-1" style={{ fontFamily: 'Syne' }}>
                Drop your hand history file here
              </div>
              <div className="text-zinc-600 font-mono text-xs">
                PokerStars .txt format, max 512 KB
              </div>
            </div>
            <input
              type="file"
              accept=".txt"
              onChange={handleFile}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </label>
        </div>
      )}

      {/* loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-5 h-5 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
          <span className="text-zinc-500 font-mono text-sm">
            parsing {fileName}...
          </span>
        </div>
      )}

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-5 py-3 text-red-400 font-mono text-sm text-center">
          {error}
        </div>
      )}

      {/* results */}
      {hands && (
        <div style={{ animation: 'slideUp .4s cubic-bezier(.16,1,.3,1)' }}>
          {/* summary bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="font-mono text-sm text-zinc-300">
                {hands.length} hands
              </span>
              <div className="flex gap-3 text-xs font-mono">
                <span className="text-emerald-400">{won}W</span>
                <span className="text-red-400">{lost}L</span>
                <span className="text-zinc-500">{folded}F</span>
              </div>
              {fileName && (
                <span className="text-zinc-700 font-mono text-xs">{fileName}</span>
              )}
            </div>
            <button
              onClick={reset}
              className="px-4 py-2 rounded-lg text-xs font-mono border border-zinc-800 text-zinc-600
                hover:border-zinc-600 hover:text-zinc-400 transition-all"
            >
              upload another
            </button>
          </div>

          {/* hand list */}
          <div className="space-y-2">
            {hands.map((hand, i) => (
              <HandCard key={hand.hand_id || i} hand={hand} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
