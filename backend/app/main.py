# main.py — fastapi app with equity calculation endpoints
# run with: uvicorn app.main:app --reload --port 8000

import os
import time
from collections import defaultdict
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from app.monte_carlo import compute_equity
from app.evaluator import RANK_MAP, SUIT_MAP
from app import model_server

# --- rate limiter (in-memory, per-IP) ---
# tracks request timestamps per IP. limits to MAX_REQUESTS per WINDOW seconds.
# this prevents someone from spamming the MC endpoint and burning compute.

RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 30     # max requests per window per IP
_request_log = defaultdict(list)


def check_rate_limit(client_ip: str):
  now = time.time()
  # clean old entries
  _request_log[client_ip] = [
    t for t in _request_log[client_ip]
    if now - t < RATE_LIMIT_WINDOW
  ]
  if len(_request_log[client_ip]) >= RATE_LIMIT_MAX:
    raise HTTPException(
      status_code=429,
      detail=f"rate limit exceeded. max {RATE_LIMIT_MAX} requests per minute."
    )
  _request_log[client_ip].append(now)


# --- app setup ---

# only allow requests from your frontend, not from any random site.
# localhost origins are included for local development.
ALLOWED_ORIGINS = [
  "https://pokerlens-psi.vercel.app",
  "https://pokerlens.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]

# in production, disable the interactive docs to avoid exposing your API
# to casual scrapers. set POKERLENS_ENV=production on Render.
is_production = os.getenv("POKERLENS_ENV") == "production"

app = FastAPI(
  title="PokerLens API",
  description="poker equity calculator using monte carlo simulation and neural net inference",
  version="0.2.0",
  docs_url=None if is_production else "/docs",
  redoc_url=None if is_production else "/redoc",
)


@app.on_event("startup")
def startup():
  model_server.load_model()


app.add_middleware(
  CORSMiddleware,
  allow_origins=ALLOWED_ORIGINS,
  allow_methods=["GET", "POST"],
  allow_headers=["Content-Type"],
)


# --- validation helpers ---

VALID_RANKS = set(RANK_MAP.keys())
VALID_SUITS = set(SUIT_MAP.keys())


def validate_card(card: str) -> bool:
  if len(card) != 2:
    return False
  return card[0] in VALID_RANKS and card[1] in VALID_SUITS


def validate_no_duplicates(cards: list[str]) -> bool:
  return len(cards) == len(set(cards))


def validate_request(hand, board):
  """shared validation for both endpoints."""
  all_cards = hand + board

  for card in all_cards:
    if not validate_card(card):
      raise HTTPException(
        status_code=400,
        detail=f"invalid card: '{card}'. use format like 'Ah', 'Td', '2c'. "
               f"ranks: 2-9, T, J, Q, K, A. suits: c, d, h, s."
      )

  if not validate_no_duplicates(all_cards):
    raise HTTPException(
      status_code=400,
      detail="duplicate cards found. each card can only appear once."
    )

  if len(board) > 5:
    raise HTTPException(status_code=400, detail="board can have at most 5 cards.")
  if len(board) in (1, 2):
    raise HTTPException(
      status_code=400,
      detail="board must have 0 (pre-flop), 3 (flop), 4 (turn), or 5 (river) cards."
    )


# --- request/response models ---

class EquityRequest(BaseModel):
  hand: list[str] = Field(..., min_length=2, max_length=2,
                          description="your 2 hole cards, e.g. ['Ah', 'Kd']")
  board: list[str] = Field(default=[],
                           description="community cards (0-5), e.g. ['Ts', '9s', '2c']")
  opponents: int = Field(default=1, ge=1, le=9,
                         description="number of opponents (1-9)")
  iterations: int = Field(default=10000, ge=1000, le=50000,
                          description="monte carlo iterations (1000-50000)")

  model_config = ConfigDict(json_schema_extra={
    "example": {
      "hand": ["Ah", "Kd"],
      "board": ["Ts", "9s", "2c"],
      "opponents": 2,
      "iterations": 10000
    }
  })


class EquityResponse(BaseModel):
  win: float
  tie: float
  loss: float
  iterations: int
  time_ms: int


class FastEquityRequest(BaseModel):
  hand: list[str] = Field(..., min_length=2, max_length=2,
                          description="your 2 hole cards, e.g. ['Ah', 'Kd']")
  board: list[str] = Field(default=[],
                           description="community cards (0-5), e.g. ['Ts', '9s', '2c']")
  opponents: int = Field(default=1, ge=1, le=9,
                         description="number of opponents (1-9)")


class FastEquityResponse(BaseModel):
  equity: float
  method: str
  time_ms: float


# --- endpoints ---

@app.get("/")
def root():
  return {"status": "ok", "service": "pokerlens-api", "version": "0.2.0"}


@app.get("/health")
def health():
  return {"status": "healthy"}


@app.post("/api/equity", response_model=EquityResponse)
def equity(req: EquityRequest, request: Request):
  """compute equity using monte carlo simulation."""
  check_rate_limit(request.client.host)
  validate_request(req.hand, req.board)

  cards_used = len(req.hand) + len(req.board)
  cards_needed = (5 - len(req.board)) + (req.opponents * 2)
  cards_remaining = 52 - cards_used
  if cards_needed > cards_remaining:
    raise HTTPException(
      status_code=400,
      detail=f"not enough cards in deck for {req.opponents} opponents. "
             f"need {cards_needed} cards but only {cards_remaining} remain."
    )

  result = compute_equity(
    hand_strs=req.hand,
    board_strs=req.board,
    num_opponents=req.opponents,
    iterations=req.iterations
  )

  return EquityResponse(**result)


@app.post("/api/equity-fast", response_model=FastEquityResponse)
def equity_fast(req: FastEquityRequest, request: Request):
  """compute equity using the trained neural network.
  returns a single equity value (win + 0.5 * tie) in under 1ms.
  falls back to monte carlo if the model is not loaded.
  """
  check_rate_limit(request.client.host)
  validate_request(req.hand, req.board)

  start = time.perf_counter()

  if model_server.is_loaded():
    eq = model_server.predict_equity(req.hand, req.board, req.opponents)
    elapsed = (time.perf_counter() - start) * 1000
    return FastEquityResponse(equity=round(eq, 4), method="neural_net", time_ms=round(elapsed, 3))
  else:
    result = compute_equity(
      hand_strs=req.hand,
      board_strs=req.board,
      num_opponents=req.opponents,
      iterations=3000
    )
    elapsed = (time.perf_counter() - start) * 1000
    eq = result['win'] + result['tie'] * 0.5
    return FastEquityResponse(equity=round(eq, 4), method="monte_carlo_fallback", time_ms=round(elapsed, 3))


@app.get("/api/model-status")
def model_status():
  return {"loaded": model_server.is_loaded()}


# --- range chart endpoint ---

from app.range_chart import compute_range_chart

class RangeChartRequest(BaseModel):
  opponents: int = Field(default=1, ge=1, le=4,
                         description="number of opponents (1-4)")


@app.post("/api/range-chart")
def range_chart(req: RangeChartRequest, request: Request):
  """compute pre-flop equity for all 169 starting hands.
  returns a 13x13 grid of equity values for the range heatmap.
  limited to 1-4 opponents to keep computation reasonable.
  """
  check_rate_limit(request.client.host)

  start = time.perf_counter()
  result = compute_range_chart(req.opponents)
  elapsed = (time.perf_counter() - start) * 1000
  result['time_ms'] = round(elapsed, 1)
  return result


# --- hand history parser endpoint ---

import re
from app.hand_parser import parse_pokerstars_hands

MAX_UPLOAD_SIZE = 512 * 1024  # 512 KB max upload

class HandHistoryResponse(BaseModel):
  hands_parsed: int
  hands: list


@app.post("/api/parse-history", response_model=HandHistoryResponse)
async def parse_history(request: Request):
  """parse a PokerStars hand history text file.
  upload the raw .txt file as the request body (Content-Type: text/plain).
  returns parsed hands with street-by-street actions and equity at each street.
  """
  check_rate_limit(request.client.host)

  content_type = request.headers.get("content-type", "")
  if "text/plain" not in content_type and "application/octet-stream" not in content_type:
    raise HTTPException(status_code=400, detail="expected text/plain content type")

  body = await request.body()
  if len(body) > MAX_UPLOAD_SIZE:
    raise HTTPException(
      status_code=400,
      detail=f"file too large. max size is {MAX_UPLOAD_SIZE // 1024} KB."
    )

  try:
    text = body.decode('utf-8', errors='replace')
  except Exception:
    raise HTTPException(status_code=400, detail="could not decode file as text")

  # basic sanitization: strip null bytes and non-printable chars
  text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)

  hands = parse_pokerstars_hands(text)
  return HandHistoryResponse(hands_parsed=len(hands), hands=hands[:100])


# --- action advisor endpoint ---

from app.advisor import compute_advice

class AdvisorRequest(BaseModel):
  hand: list[str] = Field(..., min_length=2, max_length=2,
                          description="your 2 hole cards")
  board: list[str] = Field(default=[],
                           description="community cards (0-5)")
  opponents: int = Field(default=1, ge=1, le=9,
                         description="number of opponents")
  pot_size: float = Field(..., ge=0,
                          description="current pot size")
  bet_to_call: float = Field(default=0, ge=0,
                              description="amount you need to call (0 if no bet)")


@app.post("/api/advisor")
def advisor(req: AdvisorRequest, request: Request):
  """get an action recommendation based on equity, pot odds, and draw analysis.
  returns fold, call, raise, check, or bet with reasoning.
  """
  check_rate_limit(request.client.host)
  validate_request(req.hand, req.board)

  result = compute_advice(
    hand=req.hand,
    board=req.board,
    opponents=req.opponents,
    pot_size=req.pot_size,
    bet_to_call=req.bet_to_call,
  )
  return result

