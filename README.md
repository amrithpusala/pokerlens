# PokerLens

A free, open-source poker equity calculator, action advisor, and range analysis tool. Uses Monte Carlo simulation for precision and a trained neural network for sub-1ms inference.

**Live:** [pokerlens-psi.vercel.app](https://pokerlens-psi.vercel.app)

**Why?** PioSolver costs $250+. GTO Wizard is $90/month. PokerLens is free.

## Features

- **Equity Calculator** - compute win/tie/loss percentages for any Hold'em scenario (pre-flop through river) against 1-9 opponents using Monte Carlo simulation
- **Action Advisor** - get fold/call/raise recommendations based on equity, pot odds, and draw analysis with step-by-step reasoning
- **Pre-Flop Range Grid** - 13x13 heatmap showing equity for all 169 starting hands, computed via neural net in under 200ms
- **Hand History Parser** - upload PokerStars .txt files and review equity at every street with per-hand action breakdowns
- **Neural Net Inference** - feedforward network trained on 50K+ MC simulations, delivers equity predictions in under 1ms (8,000x faster than MC)
- **Cloud Sync** - sign in with Google or GitHub to save hand history analyses across devices

## Architecture

```
frontend/              React + Vite + Tailwind (Vercel)
  src/
    components/
      CalculatorPage     equity calculator with card picker
      AdvisorPage        action recommendations with pot odds
      RangeGridPage      13x13 starting hand heatmap
      HandHistoryPage    upload and review hand histories
      HowItWorksPage     technical explanation of the system
      AboutPage          project info and tech stack
      AuthProvider       supabase auth context
    lib/
      supabase.js        supabase client config
      db.js              database operations for hand histories

backend/               FastAPI + Python (Render)
  app/
    evaluator.py         hand ranking engine (tuple comparison)
    monte_carlo.py       MC equity calculator (multiprocessing + treys)
    model_server.py      PyTorch model loading and inference
    advisor.py           action recommendations (equity + pot odds + draws)
    range_chart.py       169-hand pre-flop equity grid
    hand_parser.py       PokerStars hand history parser
    card_encoding.py     53-dim binary vector encoding
    main.py              FastAPI routes, CORS, rate limiting

ml/                    training pipeline
  generate_data.py       produce training samples via MC
  train.py               PyTorch training loop with early stopping
  evaluate.py            benchmark model vs MC (correlation, MAE, latency)
  model.py               feedforward neural net (4 layers, 213K params)

supabase/
  setup.sql              database schema with row-level security
```

## Quick Start

```bash
git clone https://github.com/amrithpusala/pokerlens.git
cd pokerlens

# backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
PYTHONPATH=. pytest tests/ -v
uvicorn app.main:app --reload --port 8000

# frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies API calls to the backend automatically.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/equity` | Monte Carlo equity (precise, ~500ms) |
| POST | `/api/equity-fast` | Neural net equity (<1ms) |
| POST | `/api/advisor` | Action recommendation with reasoning |
| POST | `/api/range-chart` | Pre-flop equity grid (169 hands) |
| POST | `/api/parse-history` | Parse PokerStars hand history |
| GET | `/api/model-status` | Check if neural net is loaded |
| GET | `/health` | Health check |

### Example: Equity

```bash
curl -X POST http://localhost:8000/api/equity \
  -H "Content-Type: application/json" \
  -d '{"hand": ["Ah", "Kd"], "board": ["Ts", "9s", "2c"], "opponents": 2}'
```

### Example: Advisor

```bash
curl -X POST http://localhost:8000/api/advisor \
  -H "Content-Type: application/json" \
  -d '{"hand": ["Ah", "Kh"], "board": ["Qh", "7d", "3c"], "opponents": 1, "pot_size": 100, "bet_to_call": 50}'
```

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Tailwind CSS |
| API | FastAPI (Python) |
| MC Engine | Python multiprocessing + treys |
| ML | PyTorch (feedforward net, 213K params) |
| Auth | Supabase (Google/GitHub OAuth, email/password) |
| Database | Supabase Postgres with row-level security |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## Benchmarks

| Metric | Value |
|--------|-------|
| Hand evaluation speed | ~15us per eval |
| MC equity (10K iterations) | ~500ms |
| Neural net inference | <1ms |
| Neural net speedup vs MC | 8,000x |
| Range grid (169 hands) | ~190ms |
| NN correlation with MC | 0.855 (50K samples) |
| NN mean absolute error | 6.71% (50K samples) |
| NN throughput | ~15,800 queries/sec |

Accuracy scales with training data. 500K+ samples would push correlation above 0.99 and MAE below 1%.

## Security

- CORS locked to production domain and localhost
- Rate limiting: 30 requests/minute per IP
- MC iterations capped at 50K to prevent compute abuse
- File uploads capped at 512KB with input sanitization
- API docs disabled in production
- Supabase row-level security: users can only access their own data
- Only the anon key is used on the frontend (no service role key in code)
- Hand history storage capped at 50 per user

## License

MIT
