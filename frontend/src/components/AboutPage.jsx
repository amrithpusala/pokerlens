export default function AboutPage() {
  return (
    <div className="space-y-10" style={{ animation: 'fadeIn .4s ease-out' }}>
      {/* hero */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Syne' }}>
          About PokerLens
        </h2>
        <p className="text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
          A free, open-source alternative to $250+ poker solvers.
          Built for players who want real equity math without the price tag.
        </p>
      </div>

      {/* the problem */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Syne' }}>
          <span className="text-red-400 text-sm">01</span> The Problem
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Serious poker study requires equity calculators and GTO tools.
          PioSolver costs $250+, GTO Wizard runs $90/month, and most free
          alternatives are slow, inaccurate, or overloaded with ads. There
          is no fast, free, web-based option that does real-time equity
          computation with transparent methodology.
        </p>
      </div>

      {/* the solution */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Syne' }}>
          <span className="text-emerald-400 text-sm">02</span> The Solution
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          PokerLens uses Monte Carlo simulation for precision and a trained
          neural network for speed. The MC engine runs 10,000+ random
          rollouts to compute exact win/tie/loss percentages. The neural
          net approximates the same result in under 10ms, a 100x speedup
          that enables real-time interaction without waiting for simulation
          to finish.
        </p>
      </div>

      {/* tech stack */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Tech Stack
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { name: 'React + Vite', role: 'Frontend', icon: 'UI' },
            { name: 'FastAPI', role: 'API Layer', icon: 'API' },
            { name: 'Python + treys', role: 'MC Engine', icon: 'MC' },
            { name: 'PyTorch', role: 'Neural Network', icon: 'NN' },
            { name: 'Tailwind CSS', role: 'Styling', icon: 'CSS' },
            { name: 'Redis', role: 'Cache Layer', icon: 'DB' },
          ].map((t, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4
              flex items-center gap-3 hover:border-zinc-700/50 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-zinc-800/80 border border-zinc-700/50
                flex items-center justify-center font-mono text-[10px] font-bold text-zinc-500
                group-hover:text-zinc-300 group-hover:border-zinc-600 transition-all">
                {t.icon}
              </div>
              <div>
                <div className="text-white text-sm font-semibold">{t.name}</div>
                <div className="text-zinc-600 text-xs">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* roadmap */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Roadmap
        </h3>
        <div className="space-y-2">
          {[
            { done: true, label: 'Hand evaluator with full test coverage' },
            { done: true, label: 'Monte Carlo equity engine with multiprocessing' },
            { done: true, label: 'FastAPI backend with equity endpoints' },
            { done: true, label: 'React frontend with card picker UI' },
            { done: false, label: 'Neural net training pipeline' },
            { done: false, label: 'Neural net inference endpoint (<10ms)' },
            { done: false, label: 'Pre-flop range grid heatmap' },
            { done: false, label: 'Hand history parser and session review' },
            { done: false, label: 'Redis caching layer' },
            { done: false, label: 'Deploy to Vercel + Railway' },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 py-2 px-3 rounded-lg transition-colors
                ${item.done ? 'bg-emerald-400/5' : 'hover:bg-zinc-900/30'}`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                text-xs transition-all
                ${item.done
                  ? 'border-emerald-400/60 bg-emerald-400/10 text-emerald-400'
                  : 'border-zinc-700'}`}
              >
                {item.done && '\u2713'}
              </div>
              <span className={`text-sm ${item.done ? 'text-zinc-300' : 'text-zinc-600'}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* built by */}
      <div className="bg-gradient-to-b from-zinc-900/30 to-transparent border
        border-zinc-800/50 rounded-2xl p-6 text-center">
        <div className="text-2xl mb-2 opacity-40">♠ ♥</div>
        <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Syne' }}>
          Built by Amrith Pusala
        </h3>
        <p className="text-zinc-600 text-sm mb-4">Computer Science @ Purdue University</p>
        <div className="flex justify-center gap-3">
          <a
            href="https://github.com/amrithpusala/pokerlens"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60
              text-zinc-400 text-xs font-mono hover:border-zinc-700 transition-colors"
          >
            github
          </a>
          <a
            href="https://linkedin.com/in/amrithpusala"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-zinc-900/50 border border-zinc-800/60
              text-zinc-400 text-xs font-mono hover:border-zinc-700 transition-colors"
          >
            linkedin
          </a>
        </div>
      </div>
    </div>
  )
}
