import { useState, useEffect } from 'react'

function StepCard({ number, title, desc, icon, delay }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={`transition-all duration-700
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-b from-zinc-700/20
          to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
        <div className="relative bg-zinc-900/30 border border-zinc-800/60 rounded-2xl p-6
          backdrop-blur-sm hover:border-zinc-700/60 transition-all duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700/50
              flex items-center justify-center text-base font-mono font-bold text-zinc-400 shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-xs text-emerald-400/60">0{number}</span>
                <h3 className="font-semibold text-white" style={{ fontFamily: 'Syne' }}>
                  {title}
                </h3>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed">{desc}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CodeBlock({ code }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800/60 rounded-xl p-4 overflow-x-auto">
      <pre className="font-mono text-xs text-zinc-400 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function HowItWorksPage() {
  return (
    <div className="space-y-12" style={{ animation: 'fadeIn .4s ease-out' }}>
      {/* hero */}
      <div className="text-center py-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3" style={{ fontFamily: 'Syne' }}>
          How It Works
        </h2>
        <p className="text-zinc-500 max-w-md mx-auto text-sm leading-relaxed">
          Three layers of engineering: brute-force simulation for precision,
          a neural network for speed, and a clean API to serve both.
        </p>
      </div>

      {/* pipeline diagram */}
      <div className="flex items-center justify-center gap-3 py-4 flex-wrap">
        {[
          { label: 'Your Hand', sub: '2 cards' },
          null,
          { label: 'MC Engine', sub: '10K rollouts' },
          null,
          { label: 'Neural Net', sub: '<10ms' },
          null,
          { label: 'Equity %', sub: 'win/tie/loss' },
        ].map((item, i) =>
          item ? (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl
              px-5 py-3 text-center backdrop-blur-sm">
              <div className="text-white text-sm font-semibold" style={{ fontFamily: 'Syne' }}>
                {item.label}
              </div>
              <div className="text-zinc-600 font-mono text-[10px] mt-0.5">{item.sub}</div>
            </div>
          ) : (
            <div key={i} className="text-zinc-700 text-lg">{'\u2192'}</div>
          )
        )}
      </div>

      {/* step cards */}
      <div className="space-y-4">
        <StepCard number={1} delay={100} icon="#1" title="Hand Evaluation"
          desc="Every poker hand gets a numeric strength score using tuple-based comparison. A hand like (FLUSH, 12, 10, 8, 5, 3) automatically beats (FLUSH, 12, 10, 8, 5, 2) because Python compares tuples element by element. For 7-card Hold'em, we check all 21 possible 5-card combinations and keep the strongest." />

        <StepCard number={2} delay={250} icon="#2" title="Monte Carlo Simulation"
          desc="To compute equity, we run thousands of random rollouts. Each rollout deals random remaining board cards and random opponent hands, then evaluates who wins. After 10,000 rollouts, the win percentage converges to the true equity within roughly 1%. The simulation is parallelized across CPU cores using Python multiprocessing." />

        <StepCard number={3} delay={400} icon="#3" title="Neural Network Inference"
          desc="Monte Carlo takes around 500ms per query. To get sub-10ms responses, we train a feedforward neural network on 500K+ MC simulation results. The input is a 53-dimensional vector: 52 bits for card presence plus the opponent count. The output is a single equity float. The trained model achieves over 99% correlation with MC results, a 100x speedup." />

        <StepCard number={4} delay={550} icon="#4" title="API Layer"
          desc="FastAPI serves both engines. POST /api/equity returns precise Monte Carlo results. POST /api/equity-fast returns neural net inference. The frontend calls the fast endpoint by default and falls back to MC for edge cases. Input validation catches invalid cards, duplicates, and impossible board states before computation begins." />
      </div>

      {/* mc algorithm */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Monte Carlo Algorithm
        </h3>
        <CodeBlock code={`function compute_equity(hand, board, opponents, n=10000):
    deck = all_52_cards - hand - board
    wins = 0, ties = 0

    for i in range(n):
        shuffle(deck)

        # deal remaining community cards
        sim_board = board + deal(5 - len(board))

        # deal opponent hole cards
        opp_hands = [deal(2) for _ in range(opponents)]

        # evaluate and compare
        my_score = evaluate(hand + sim_board)
        best_opp = max(evaluate(opp + sim_board) for opp)

        if my_score > best_opp: wins += 1
        if my_score == best_opp: ties += 1

    return wins/n, ties/n, 1 - wins/n - ties/n`} />
      </div>

      {/* card encoding */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Neural Net Input Encoding
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed mb-4">
          Each scenario is encoded as a 53-dimensional binary vector. The first 52
          dimensions represent whether each card in the deck is known (in your hand
          or on the board). The 53rd dimension is the opponent count.
        </p>
        <CodeBlock code={`# card index: rank * 4 + suit
# ranks: 2=0, 3=1, ..., A=12
# suits: clubs=0, diamonds=1, hearts=2, spades=3

# example: you hold A♥ K♦, flop is T♠ 9♠ 2♣
input = [0]*52 + [num_opponents]
input[12*4 + 2] = 1  # A♥ (rank 12, suit 2)
input[11*4 + 1] = 1  # K♦ (rank 11, suit 1)
input[ 8*4 + 0] = 1  # T♠ (rank 8,  suit 0)
input[ 7*4 + 0] = 1  # 9♠ (rank 7,  suit 0)
input[ 0*4 + 0] = 1  # 2♣ (rank 0,  suit 0)
# 53-dim vector fed into the neural network`} />
      </div>

      {/* benchmarks */}
      <div>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Syne' }}>
          Benchmarks
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Hand Eval Speed', value: '~15\u03BCs', sub: 'per evaluation (treys lookup table)' },
            { label: 'MC Equity (10K)', value: '~500ms', sub: 'parallelized across CPU cores' },
            { label: 'MC Equity (50K)', value: '~2.3s', sub: 'higher precision mode' },
            { label: 'Neural Net', value: '<10ms', sub: 'target inference latency' },
          ].map((b, i) => (
            <div key={i} className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4
              hover:border-zinc-700/60 transition-colors">
              <div className="font-mono text-xl font-bold text-emerald-400">{b.value}</div>
              <div className="text-white text-sm font-medium mt-1" style={{ fontFamily: 'Syne' }}>
                {b.label}
              </div>
              <div className="text-zinc-600 font-mono text-[10px] mt-0.5">{b.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
