# test_api.py — endpoint tests for the fastapi app
# run with: cd backend && pytest tests/test_api.py -v

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# --- health checks ---

def test_root():
  resp = client.get("/")
  assert resp.status_code == 200
  data = resp.json()
  assert data["status"] == "ok"
  assert data["service"] == "pokerlens-api"


def test_health():
  resp = client.get("/health")
  assert resp.status_code == 200
  assert resp.json()["status"] == "healthy"


# --- valid equity requests ---

def test_equity_preflop():
  resp = client.post("/api/equity", json={
    "hand": ["As", "Ah"],
    "board": [],
    "opponents": 1,
    "iterations": 5000
  })
  assert resp.status_code == 200
  data = resp.json()
  assert 0.0 <= data["win"] <= 1.0
  assert 0.0 <= data["tie"] <= 1.0
  assert 0.0 <= data["loss"] <= 1.0
  # win + tie + loss should sum to 1
  assert abs(data["win"] + data["tie"] + data["loss"] - 1.0) < 0.01
  assert data["iterations"] == 5000
  assert data["time_ms"] >= 0


def test_equity_flop():
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kh"],
    "board": ["Qh", "7d", "2c"],
    "opponents": 2,
    "iterations": 3000
  })
  assert resp.status_code == 200
  data = resp.json()
  assert data["win"] > 0.3  # AK on Q-high board should win a decent amount


def test_equity_turn():
  resp = client.post("/api/equity", json={
    "hand": ["Ts", "Td"],
    "board": ["Tc", "5h", "2d", "8s"],
    "opponents": 1,
    "iterations": 3000
  })
  assert resp.status_code == 200
  data = resp.json()
  assert data["win"] > 0.9  # set of tens on a dry board is very strong


def test_equity_river():
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kh"],
    "board": ["Qh", "Jh", "3h", "9d", "4c"],
    "opponents": 1,
    "iterations": 3000
  })
  assert resp.status_code == 200
  data = resp.json()
  assert data["win"] > 0.95  # ace-high flush on the river


def test_equity_defaults():
  # only hand is required, everything else has defaults
  resp = client.post("/api/equity", json={
    "hand": ["Js", "Jh"]
  })
  assert resp.status_code == 200
  data = resp.json()
  assert data["iterations"] == 10000


# --- validation errors ---

def test_invalid_card_format():
  resp = client.post("/api/equity", json={
    "hand": ["Ax", "Kd"],  # 'x' is not a valid suit
    "opponents": 1,
    "iterations": 1000
  })
  assert resp.status_code == 400
  assert "invalid card" in resp.json()["detail"]


def test_duplicate_cards():
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kd"],
    "board": ["Ah", "7s", "2c"],  # Ah appears in both hand and board
    "opponents": 1,
    "iterations": 1000
  })
  assert resp.status_code == 400
  assert "duplicate" in resp.json()["detail"]


def test_invalid_board_size():
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kd"],
    "board": ["Ts", "9s"],  # 2 cards isn't a valid board state
    "opponents": 1,
    "iterations": 1000
  })
  assert resp.status_code == 400
  assert "0" in resp.json()["detail"] and "3" in resp.json()["detail"]


def test_too_many_opponents():
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kd"],
    "board": [],
    "opponents": 10,  # max is 9
    "iterations": 1000
  })
  assert resp.status_code == 422  # pydantic validation error


def test_hand_wrong_size():
  resp = client.post("/api/equity", json={
    "hand": ["Ah"],  # need exactly 2 cards
    "opponents": 1,
    "iterations": 1000
  })
  assert resp.status_code == 422


def test_too_many_opponents_for_deck():
  # 5 board cards dealt + 9 opponents need 18 cards = 23 total
  # with 2 hole cards that's 25, only 27 left in deck — fine
  # but let's test the edge: pre-flop with 9 opponents needs 5+18=23 cards
  # from 50 remaining (52-2), that's fine too
  # we'd need a really extreme case to fail — skip for now
  resp = client.post("/api/equity", json={
    "hand": ["Ah", "Kd"],
    "board": [],
    "opponents": 9,
    "iterations": 1000
  })
  assert resp.status_code == 200
