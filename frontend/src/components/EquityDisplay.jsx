import { useState, useEffect } from 'react'

export function BarSegment({ pct, color, label, delay }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 50 + delay)
    return () => clearTimeout(timer)
  }, [pct, delay])

  if (width <= 0) return null

  return (
    <div
      className={`${color} flex items-center justify-center overflow-hidden`}
      style={{
        width: `${width}%`,
        transition: 'width 0.8s cubic-bezier(.16,1,.3,1)',
        transitionDelay: `${delay}ms`
      }}
    >
      {width > 8 && (
        <span className="font-mono text-xs font-bold text-black whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  )
}

export function StatCard({ value, label, color, delay }) {
  const [display, setDisplay] = useState('0.0')
  const target = parseFloat(value)

  useEffect(() => {
    const duration = 600
    const startTime = performance.now() + delay

    function tick(now) {
      const elapsed = now - startTime
      if (elapsed < 0) { requestAnimationFrame(tick); return }
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay((eased * target).toFixed(1))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
  }, [target, delay])

  const colorClasses = {
    emerald: { text: 'text-emerald-400', glow: 'bg-emerald-500' },
    zinc: { text: 'text-zinc-400', glow: 'bg-zinc-500' },
    red: { text: 'text-red-400', glow: 'bg-red-500' },
  }

  const c = colorClasses[color] || colorClasses.zinc

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 rounded-xl blur-sm opacity-0
        group-hover:opacity-30 transition-opacity duration-500 ${c.glow}`}
      />
      <div className="relative bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5
        text-center backdrop-blur-sm"
      >
        <div className={`font-mono text-3xl font-bold ${c.text}`}>{display}%</div>
        <div
          className="text-zinc-600 text-xs uppercase tracking-widest mt-1.5"
          style={{ fontFamily: 'Syne' }}
        >
          {label}
        </div>
      </div>
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div
      className="border border-zinc-800/50 rounded-2xl p-6 space-y-4"
      style={{ animation: 'fadeIn .3s ease-out' }}
    >
      <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
      <div className="h-10 bg-zinc-900 rounded-xl overflow-hidden relative">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.03),transparent)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite'
          }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 bg-zinc-900/50 rounded-xl animate-pulse"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export function EquityResult({ result }) {
  const lbl = {
    fontFamily: 'Syne',
    fontSize: '.65rem',
    fontWeight: 600,
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: '#a1a1aa',
  }

  return (
    <div
      className="border border-zinc-800/50 rounded-2xl p-6 space-y-5 relative overflow-hidden"
      style={{ animation: 'slideUp .4s cubic-bezier(.16,1,.3,1)' }}
    >
      <div
        className="absolute top-0 left-1/4 w-1/2 h-24 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)'
        }}
      />

      <div className="relative">
        <div className="flex justify-between items-baseline mb-3">
          <span style={lbl}>Equity</span>
          <span className="font-mono text-xs text-zinc-500">
            {result.iterations.toLocaleString()} iter · {result.time_ms}ms
          </span>
        </div>
        <div className="h-10 bg-zinc-900/80 rounded-xl overflow-hidden flex border border-zinc-800/30">
          <BarSegment
            pct={result.win * 100}
            color="bg-emerald-500"
            label={`${(result.win * 100).toFixed(1)}%`}
            delay={0}
          />
          <BarSegment
            pct={result.tie * 100}
            color="bg-zinc-600"
            label={`${(result.tie * 100).toFixed(1)}%`}
            delay={100}
          />
          <BarSegment
            pct={result.loss * 100}
            color="bg-red-500"
            label={`${(result.loss * 100).toFixed(1)}%`}
            delay={200}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 relative">
        <StatCard value={(result.win * 100).toFixed(1)} label="Win" color="emerald" delay={100} />
        <StatCard value={(result.tie * 100).toFixed(1)} label="Tie" color="zinc" delay={250} />
        <StatCard value={(result.loss * 100).toFixed(1)} label="Loss" color="red" delay={400} />
      </div>
    </div>
  )
}
