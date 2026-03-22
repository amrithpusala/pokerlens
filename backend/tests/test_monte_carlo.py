# test_monte_carlo.py — verify MC engine with known equity scenarios
# run with: cd backend && PYTHONPATH=. pytest tests/ -v
# note: these tests use 50K iterations so they take ~15-20 seconds total

import pytest
from app.monte_carlo import compute_equity

ITERS = 50000
TOL = 0.03  # 3% tolerance for stochastic results


def _check_equity(hand, board, opponents, expected_win, tol=TOL):
  result = compute_equity(hand, board, opponents, iterations=ITERS)
  assert abs(result['win'] - expected_win) <= tol, (
    f"win={result['win']:.3f}, expected ~{expected_win:.3f}, "
    f"tie={result['tie']:.3f}, loss={result['loss']:.3f}"
  )
  # sanity: win + tie + loss should sum to 1
  total = result['win'] + result['tie'] + result['loss']
  assert abs(total - 1.0) < 0.001


# --- pre-flop equities (well-known matchups) ---

def test_aces_vs_one():
  # AA vs 1 random opponent: ~85%
  _check_equity(['As', 'Ah'], [], 1, 0.85)

def test_ak_suited_vs_one():
  # AKs vs 1 random: ~67%
  _check_equity(['Ah', 'Kh'], [], 1, 0.67)

def test_worst_hand_vs_one():
  # 72o vs 1 random: ~31% win (plus ~5% tie)
  _check_equity(['7s', '2d'], [], 1, 0.31, tol=0.04)

def test_aces_vs_two():
  # AA vs 2 randoms: ~73%
  _check_equity(['As', 'Ah'], [], 2, 0.73)


# --- post-flop ---

def test_top_pair_top_kicker():
  _check_equity(['Ah', 'Kd'], ['Ac', '7s', '2d'], 1, 0.88, tol=0.04)

def test_overpair_wet_board():
  # KK on T95 with two spades, vs random: ~83%
  _check_equity(['Ks', 'Kd'], ['Ts', '9s', '5h'], 1, 0.83, tol=0.04)

def test_flopped_set():
  _check_equity(['8s', '8h'], ['8d', '5c', '2s'], 1, 0.96, tol=0.03)


# --- river (deterministic board) ---

def test_nut_flush_river():
  # ace-high flush, no straight flush possible — unbeatable
  _check_equity(
    ['Ah', 'Kh'], ['Qh', '7h', '3h', 'Ts', '2d'], 1, 1.00, tol=0.01
  )
