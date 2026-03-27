export default function AboutPage() {
  return (
    <div className="space-y-10" style={{ animation: 'fadeIn .4s ease-out' }}>
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Syne' }}>
          About PokerLens
        </h2>
        <p className="text-zinc-500 max-w-lg mx-auto text-sm leading-relaxed">
          A free, open-source poker equity calculator, action advisor, and range analysis
          tool. Built for players who want real math without the price tag.
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
          computation with action recommendations and transparent methodology.
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
          net approximates the same result in under 1ms, enabling real-time
          features like the action advisor and the 169-hand range grid.
          Users can sign in to save hand history analyses across devices.
        </p>
      </div>

      {/* features */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: 'Equity Calculator', desc: 'Monte Carlo win/tie/loss with configurable iterations' },
            { name: 'Action Advisor', desc: 'Fold/call/raise recommendations with pot odds and draw analysis' },
            { name: 'Pre-Flop Range Grid', desc: '13x13 heatmap of all 169 starting hand equities' },
            { name: 'Hand History Parser', desc: 'Upload PokerStars .txt files, see equity at every street' },
            { name: 'Neural Net Inference', desc: 'Sub-1ms equity predictions trained on 50K+ simulations' },
            { name: 'Cloud Sync', desc: 'Sign in with Google or GitHub to save histories across devices' },
          ].map((f, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4
              hover:border-zinc-700/50 transition-colors">
              <div className="text-white text-sm font-semibold">{f.name}</div>
              <div className="text-zinc-600 text-xs mt-1">{f.desc}</div>
            </div>
          ))}
        </div>
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
            { name: 'Supabase', role: 'Auth + Database', icon: 'DB' },
            { name: 'Tailwind CSS', role: 'Styling', icon: 'CSS' },
            { name: 'Vercel', role: 'Frontend Hosting', icon: 'FE' },
            { name: 'Render', role: 'Backend Hosting', icon: 'BE' },
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

      {/* open source */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ fontFamily: 'Syne' }}>
          <span className="text-zinc-400 text-sm">03</span> Open Source
        </h3>
        <p className="text-zinc-400 text-sm leading-relaxed">
          PokerLens is fully open source under the MIT license. The entire codebase,
          including the Monte Carlo engine, neural net training pipeline, and frontend,
          is available on GitHub. Contributions and feedback are welcome.
        </p>
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
