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

// interpolate between red and green based on equity
function equityColor(equity) {
  // 0.3 and below = deep red, 0.7 and above = bright green
  const min = 0.25
  const max = 0.75
  const t = Math.max(0, Math.min(1, (equity - min) / (max - min)))

  // red (weak) -> yellow (medium) -> green (strong)
  if (t < 0.5) {
    const s = t * 2
    const r = Math.round(220 - s * 80)
    const g = Math.round(60 + s * 140)
    const b = Math.round(60)
    return `rgb(${r},${g},${b})`
  } else {
    const s = (t - 0.5) * 2
    const r = Math.round(140 - s * 100)
    const g = Math.round(200 + s * 30)
    const b = Math.round(60 + s * 40)
    return `rgb(${r},${g},${b})`
  }
}

function GridCell({ cell, showValues }) {
  const [hover, setHover] = useState(false)
  const bg = equityColor(cell.equity)
  const pct = (cell.equity * 100).toFixed(1)

  // text color: white on dark cells, black on bright cells
  const brightness = cell.equity > 0.5 ? 'text-black/80' : 'text-white/90'

  return (
    <div
      className="relative flex items-center justify-center cursor-default select-none transition-all duration-150"
      style={{
        backgroundColor: bg,
        opacity: hover ? 1 : 0.85,
        borderRadius: '2px',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`font-mono text-center leading-none ${brightness}`}>
        <div className="text-[9px] font-bold">{cell.label}</div>
        {showValues && (
          <div className="text-[7px] opacity-70">{pct}%</div>
        )}
      </div>

      {/* hover tooltip */}
      {hover && (
        <div className="absolute z-30 -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl whitespace-nowrap pointer-events-none"
          style={{ animation: 'fadeIn .1s ease-out' }}>
          <span className="font-mono text-xs text-white font-bold">{cell.label}</span>
          <span className="font-mono text-xs text-zinc-400 ml-2">{pct}%</span>
          <span className={`font-mono text-[10px] ml-1.5 ${cell.type === 'pair' ? 'text-yellow-400' : cell.type === 'suited' ? 'text-blue-400' : 'text-zinc-500'}`}>
            {cell.type}
          </span>
        </div>
      )}
    </div>
  )
}

export default function RangeGridPage() {
  const [opponents, setOpponents] = useState(1)
  const [grid, setGrid] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showValues, setShowValues] = useState(false)
  const [method, setMethod] = useState(null)
  const [timeMs, setTimeMs] = useState(null)

  const API_BASE = import.meta.env.VITE_API_URL || ''

  async function loadGrid() {
    setLoading(true)
    setError(null)
    try {
      const resp = await fetch(`${API_BASE}/api/range-chart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponents }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.detail || 'failed to load range chart')
      }
      const data = await resp.json()
      setGrid(data.grid)
      setMethod(data.method)
      setTimeMs(data.time_ms)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn .3s ease-out' }}>
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold tracking-tight mb-2" style={{ fontFamily: 'Syne' }}>
          Pre-Flop Range Grid
        </h2>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Equity for all 169 starting hands against random opponents. Green is strong, red is weak. Hover any cell for details.
        </p>
      </div>

      {/* controls */}
      <div className="flex items-end gap-4 justify-center">
        <div>
          <label style={LABEL_STYLE}>Opponents</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                onClick={() => setOpponents(n)}
                className={`w-10 h-10 rounded-lg font-mono text-sm font-bold transition-all
                  ${opponents === n
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.15)]'
                    : 'bg-zinc-900/60 text-zinc-500 border border-zinc-800 hover:border-zinc-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadGrid}
          disabled={loading}
          className="relative group overflow-hidden"
        >
          <div className={`absolute inset-0 rounded-xl transition-opacity duration-500 ${!loading ? 'opacity-100' : 'opacity-0'}`}
            style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.15), rgba(52,211,153,0.05), rgba(16,185,129,0.15))', backgroundSize: '200% 100%', animation: 'shimmer 3s ease-in-out infinite' }} />
          <div className={`relative px-6 py-2.5 rounded-xl font-semibold text-sm tracking-wider uppercase border transition-all
            ${!loading ? 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10 active:scale-[0.98]' : 'border-zinc-800 text-zinc-600'}`}
            style={{ fontFamily: 'Syne' }}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-emerald-400/40 border-t-emerald-400 rounded-full animate-spin" />
                Computing...
              </span>
            ) : 'Generate'}
          </div>
        </button>

        {grid && (
          <button
            onClick={() => setShowValues(!showValues)}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono border transition-all
              ${showValues
                ? 'border-zinc-600 text-zinc-300 bg-zinc-900'
                : 'border-zinc-800 text-zinc-600 hover:border-zinc-600'}`}
          >
            {showValues ? 'hide %' : 'show %'}
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-500/20 bg-red-500/5 rounded-xl px-5 py-3 text-red-400 font-mono text-sm text-center">
          {error}
        </div>
      )}

      {/* loading skeleton */}
      {loading && !grid && (
        <div className="flex justify-center py-8">
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: 'repeat(13, 1fr)', width: '100%', maxWidth: '560px', aspectRatio: '1' }}>
            {Array.from({ length: 169 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 rounded-sm animate-pulse" style={{ animationDelay: `${(i % 13) * 20}ms` }} />
            ))}
          </div>
        </div>
      )}

      {/* the grid */}
      {grid && (
        <div style={{ animation: 'slideUp .4s cubic-bezier(.16,1,.3,1)' }}>
          <div
            className="grid gap-[2px] mx-auto"
            style={{
              gridTemplateColumns: 'repeat(13, 1fr)',
              width: '100%',
              maxWidth: '560px',
              aspectRatio: '1',
            }}
          >
            {grid.flatMap((row, ri) =>
              row.map((cell, ci) => (
                <GridCell key={`${ri}-${ci}`} cell={cell} showValues={showValues} />
              ))
            )}
          </div>

          {/* legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs font-mono text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-yellow-400/60" />
              <span>pairs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-400/60" />
              <span>suited (above diagonal)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-zinc-500/60" />
              <span>offsuit (below diagonal)</span>
            </div>
          </div>

          {/* meta */}
          {method && (
            <div className="text-center mt-3 font-mono text-xs text-zinc-700">
              {method === 'neural_net' ? 'neural net inference' : 'monte carlo'} · {timeMs}ms
            </div>
          )}
        </div>
      )}

      {!grid && !loading && (
        <div className="text-center py-12" style={{ animation: 'fadeIn .5s ease-out' }}>
          <div className="text-3xl mb-3 opacity-20">♠ ♥ ♦ ♣</div>
          <p className="text-zinc-600 font-mono text-sm">select opponents and hit generate</p>
        </div>
      )}
    </div>
  )
}
