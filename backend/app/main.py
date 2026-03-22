# main.py — fastapi app with equity calculation endpoints
# run with: uvicorn app.main:app --reload --port 8000

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

from app.monte_carlo import compute_equity
from app.evaluator import RANK_MAP, SUIT_MAP

app = FastAPI(
  title="PokerLens API",
  description="poker equity calculator using monte carlo simulation",
  version="0.1.0"
)

# allow frontend to call the api from a different origin (e.g. localhost:5173)
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],
  allow_methods=["*"],
  allow_headers=["*"],
)

# valid card strings for input validation
VALID_RANKS = set(RANK_MAP.keys())
VALID_SUITS = set(SUIT_MAP.keys())


def validate_card(card: str) -> bool:
  """check that a card string like 'Ah' is valid."""
  if len(card) != 2:
    return False
  return card[0] in VALID_RANKS and card[1] in VALID_SUITS


def validate_no_duplicates(cards: list[str]) -> bool:
  """check that no card appears twice."""
  return len(cards) == len(set(cards))


class EquityRequest(BaseModel):
  hand: list[str] = Field(..., min_length=2, max_length=2,
                          description="your 2 hole cards, e.g. ['Ah', 'Kd']")
  board: list[str] = Field(default=[],
                           description="community cards (0-5), e.g. ['Ts', '9s', '2c']")
  opponents: int = Field(default=1, ge=1, le=9,
                         description="number of opponents (1-9)")
  iterations: int = Field(default=10000, ge=1000, le=200000,
                          description="monte carlo iterations (1000-200000)")

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


@app.get("/")
def root():
  return {"status": "ok", "service": "pokerlens-api", "version": "0.1.0"}


@app.get("/health")
def health():
  return {"status": "healthy"}


@app.post("/api/equity", response_model=EquityResponse)
def equity(req: EquityRequest):
  """compute equity using monte carlo simulation.
  pass your 2 hole cards, optional board cards (0-5),
  number of opponents, and iteration count.
  """
  all_cards = req.hand + req.board

  # validate each card string
  for card in all_cards:
    if not validate_card(card):
      raise HTTPException(
        status_code=400,
        detail=f"invalid card: '{card}'. use format like 'Ah', 'Td', '2c'. "
               f"ranks: 2-9, T, J, Q, K, A. suits: c, d, h, s."
      )

  # check for duplicate cards
  if not validate_no_duplicates(all_cards):
    raise HTTPException(
      status_code=400,
      detail="duplicate cards found. each card can only appear once."
    )

  # validate board length
  if len(req.board) > 5:
    raise HTTPException(status_code=400, detail="board can have at most 5 cards.")
  if len(req.board) in (1, 2):
    raise HTTPException(
      status_code=400,
      detail="board must have 0 (pre-flop), 3 (flop), 4 (turn), or 5 (river) cards."
    )

  # make sure we have enough cards left in the deck for all opponents
  cards_used = len(all_cards)
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
