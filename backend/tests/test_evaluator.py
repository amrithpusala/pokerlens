# test_evaluator.py — verify every hand category and edge case
# run with: cd backend && PYTHONPATH=. pytest tests/ -v

from app.evaluator import (
  parse_hand, evaluate_hand, hand_category_name,
  HIGH_CARD, ONE_PAIR, TWO_PAIR, THREE_KIND, STRAIGHT,
  FLUSH, FULL_HOUSE, FOUR_KIND, STRAIGHT_FLUSH, ROYAL_FLUSH
)


def _eval(hand_strs, board_strs=None):
  cards = parse_hand(hand_strs)
  if board_strs:
    cards += parse_hand(board_strs)
  return evaluate_hand(cards)


# --- hand category recognition (5 cards) ---

def test_royal_flush():
  assert _eval(["Ah", "Kh", "Qh", "Jh", "Th"])[0] == ROYAL_FLUSH

def test_straight_flush():
  assert _eval(["9d", "8d", "7d", "6d", "5d"])[0] == STRAIGHT_FLUSH

def test_wheel_straight_flush():
  assert _eval(["Ac", "2c", "3c", "4c", "5c"])[0] == STRAIGHT_FLUSH

def test_four_of_a_kind():
  assert _eval(["Ks", "Kh", "Kd", "Kc", "7s"])[0] == FOUR_KIND

def test_full_house():
  assert _eval(["Js", "Jh", "Jd", "4c", "4s"])[0] == FULL_HOUSE

def test_flush():
  assert _eval(["Ah", "9h", "7h", "4h", "2h"])[0] == FLUSH

def test_straight():
  assert _eval(["Ts", "9d", "8h", "7c", "6s"])[0] == STRAIGHT

def test_wheel_straight():
  assert _eval(["As", "2d", "3h", "4c", "5s"])[0] == STRAIGHT

def test_broadway_straight():
  assert _eval(["As", "Kd", "Qh", "Jc", "Ts"])[0] == STRAIGHT

def test_three_of_a_kind():
  assert _eval(["8s", "8h", "8d", "Kc", "3s"])[0] == THREE_KIND

def test_two_pair():
  assert _eval(["Qs", "Qh", "5d", "5c", "As"])[0] == TWO_PAIR

def test_one_pair():
  assert _eval(["Td", "Th", "As", "8c", "3d"])[0] == ONE_PAIR

def test_high_card():
  assert _eval(["As", "Jd", "9h", "5c", "2s"])[0] == HIGH_CARD


# --- 7-card evaluation (texas hold'em) ---

def test_7card_flush():
  assert _eval(["Ah", "3h"], ["Kh", "9h", "7h", "2d", "4c"])[0] == FLUSH

def test_7card_full_house():
  assert _eval(["Ks", "Kh"], ["Kd", "7c", "7s", "2d", "9h"])[0] == FULL_HOUSE

def test_7card_straight():
  assert _eval(["8s", "7d"], ["6h", "5c", "4s", "Kd", "2h"])[0] == STRAIGHT

def test_7card_two_pair():
  assert _eval(["Qs", "Jd"], ["Qd", "Jh", "3c", "7s", "2d"])[0] == TWO_PAIR

def test_7card_high_card():
  assert _eval(["Ks", "8d"], ["6h", "4c", "2s", "Td", "3h"])[0] == HIGH_CARD


# --- tie-breaking ---

def test_higher_flush_kicker():
  assert _eval(["Ah", "Kh", "Qh", "Jh", "9h"]) > _eval(["Ah", "Kh", "Qh", "Jh", "8h"])

def test_higher_pair():
  assert _eval(["As", "Ah", "Kd", "Qc", "Js"]) > _eval(["Ks", "Kh", "Ad", "Qc", "Js"])

def test_same_pair_better_kicker():
  assert _eval(["As", "Ah", "Kd", "Qc", "Js"]) > _eval(["As", "Ah", "Kd", "Qc", "9s"])

def test_higher_two_pair():
  assert _eval(["As", "Ah", "Kd", "Kc", "2s"]) > _eval(["As", "Ah", "Qd", "Qc", "Ks"])

def test_same_two_pair_better_kicker():
  assert _eval(["Ks", "Kh", "Qd", "Qc", "As"]) > _eval(["Ks", "Kh", "Qd", "Qc", "Js"])

def test_higher_straight():
  assert _eval(["Ts", "9d", "8h", "7c", "6s"]) > _eval(["9s", "8d", "7h", "6c", "5s"])

def test_higher_full_house():
  assert _eval(["As", "Ah", "Ad", "2c", "2s"]) > _eval(["Ks", "Kh", "Kd", "Ac", "As"])

def test_higher_quads():
  assert _eval(["As", "Ah", "Ad", "Ac", "2s"]) > _eval(["Ks", "Kh", "Kd", "Kc", "As"])


# --- category ordering ---

def test_pair_beats_high_card():
  assert _eval(["2s", "2h", "3d", "4c", "5s"]) > _eval(["As", "Kh", "Qd", "Jc", "9s"])

def test_two_pair_beats_pair():
  assert _eval(["2s", "2h", "3d", "3c", "4s"]) > _eval(["As", "Ah", "Kd", "Qc", "Js"])

def test_trips_beats_two_pair():
  assert _eval(["2s", "2h", "2d", "3c", "4s"]) > _eval(["As", "Ah", "Kd", "Kc", "Qs"])

def test_straight_beats_trips():
  assert _eval(["5s", "4h", "3d", "2c", "As"]) > _eval(["As", "Ah", "Ad", "Kc", "Qs"])

def test_flush_beats_straight():
  assert _eval(["2h", "4h", "6h", "8h", "Th"]) > _eval(["As", "Kd", "Qh", "Jc", "Ts"])

def test_full_house_beats_flush():
  assert _eval(["2s", "2h", "2d", "3c", "3s"]) > _eval(["Ah", "Kh", "Qh", "Jh", "9h"])

def test_quads_beats_full_house():
  assert _eval(["2s", "2h", "2d", "2c", "3s"]) > _eval(["As", "Ah", "Ad", "Kc", "Ks"])

def test_straight_flush_beats_quads():
  assert _eval(["5h", "4h", "3h", "2h", "Ah"]) > _eval(["As", "Ah", "Ad", "Ac", "Ks"])

def test_royal_beats_straight_flush():
  assert _eval(["Ah", "Kh", "Qh", "Jh", "Th"]) > _eval(["Kd", "Qd", "Jd", "Td", "9d"])


# --- edge cases ---

def test_six_high_straight_beats_wheel():
  assert _eval(["6s", "5d", "4h", "3c", "2s"]) > _eval(["As", "2d", "3h", "4c", "5s"])

def test_ace_high_straight_beats_king_high():
  assert _eval(["As", "Kd", "Qh", "Jc", "Ts"]) > _eval(["Ks", "Qd", "Jh", "Tc", "9s"])
