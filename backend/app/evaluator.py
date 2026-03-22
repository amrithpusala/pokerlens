# evaluator.py — poker hand ranking engine
# given 5-7 cards, determines the best poker hand and returns
# a comparable strength tuple for direct comparison between hands.

from collections import Counter
from itertools import combinations

# maps card string characters to integer values.
# ranks: 2=0 up to A=12. suits: c=0, d=1, h=2, s=3.
RANK_MAP = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5,
  '8': 6, '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
}
RANK_STR = {v: k for k, v in RANK_MAP.items()}
SUIT_MAP = {'c': 0, 'd': 1, 'h': 2, 's': 3}
SUIT_STR = {0: 'c', 1: 'd', 2: 'h', 3: 's'}

# hand categories — higher number = better hand
HIGH_CARD = 0
ONE_PAIR = 1
TWO_PAIR = 2
THREE_KIND = 3
STRAIGHT = 4
FLUSH = 5
FULL_HOUSE = 6
FOUR_KIND = 7
STRAIGHT_FLUSH = 8
ROYAL_FLUSH = 9

CATEGORY_NAMES = {
  0: "high card", 1: "one pair", 2: "two pair",
  3: "three of a kind", 4: "straight", 5: "flush",
  6: "full house", 7: "four of a kind",
  8: "straight flush", 9: "royal flush"
}


def parse_card(card_str):
  """convert a string like 'Ah' to an (int_rank, int_suit) tuple."""
  return (RANK_MAP[card_str[0]], SUIT_MAP[card_str[1]])


def card_to_str(card):
  """convert (rank, suit) back to a string like 'Ah'."""
  return RANK_STR[card[0]] + SUIT_STR[card[1]]


def parse_hand(card_strings):
  """convert a list of card strings to a list of (rank, suit) tuples."""
  return [parse_card(c) for c in card_strings]


def build_deck():
  """return all 52 cards as (rank, suit) tuples."""
  return [(r, s) for r in range(13) for s in range(4)]


def _evaluate_five(cards):
  """evaluate exactly 5 cards. returns a tuple where the first element
  is the hand category (0-9) and remaining elements are kickers
  for tie-breaking. higher tuple = better hand.

  this is the inner function — it assumes exactly 5 cards and
  doesn't do any validation. speed matters here since the MC
  loop calls this millions of times.
  """
  ranks = sorted((c[0] for c in cards), reverse=True)
  suits = [c[1] for c in cards]

  is_flush = (suits[0] == suits[1] == suits[2] == suits[3] == suits[4])

  # check for straight: 5 unique ranks with a span of exactly 4,
  # or the special case A-2-3-4-5 (wheel).
  unique_ranks = sorted(set(ranks), reverse=True)
  is_straight = False
  straight_high = -1

  if len(unique_ranks) == 5:
    if unique_ranks[0] - unique_ranks[4] == 4:
      is_straight = True
      straight_high = unique_ranks[0]
    elif unique_ranks == [12, 3, 2, 1, 0]:
      # ace-low straight (wheel): A-2-3-4-5
      # the "high" card is the 5, not the ace
      is_straight = True
      straight_high = 3

  # count how many of each rank we have, then sort by
  # (frequency desc, rank desc) so the most important group comes first.
  freq = Counter(ranks)
  groups = sorted(freq.items(), key=lambda x: (x[1], x[0]), reverse=True)
  counts = [g[1] for g in groups]
  group_ranks = [g[0] for g in groups]

  # straight flush / royal flush
  if is_straight and is_flush:
    if straight_high == 12:
      return (ROYAL_FLUSH,)
    return (STRAIGHT_FLUSH, straight_high)

  # four of a kind: [4, 1]
  if counts[0] == 4:
    return (FOUR_KIND, group_ranks[0], group_ranks[1])

  # full house: [3, 2]
  if counts[0] == 3 and counts[1] == 2:
    return (FULL_HOUSE, group_ranks[0], group_ranks[1])

  # flush: 5 suited cards, kickers are all 5 ranks descending
  if is_flush:
    return (FLUSH,) + tuple(ranks)

  # straight
  if is_straight:
    return (STRAIGHT, straight_high)

  # three of a kind: [3, 1, 1]
  if counts[0] == 3:
    return (THREE_KIND, group_ranks[0], group_ranks[1], group_ranks[2])

  # two pair: [2, 2, 1]
  if counts[0] == 2 and counts[1] == 2:
    return (TWO_PAIR, group_ranks[0], group_ranks[1], group_ranks[2])

  # one pair: [2, 1, 1, 1]
  if counts[0] == 2:
    return (ONE_PAIR, group_ranks[0], group_ranks[1],
            group_ranks[2], group_ranks[3])

  # high card: all 5 ranks as kickers
  return (HIGH_CARD,) + tuple(ranks)


def evaluate_hand(cards):
  """evaluate 5-7 cards and return the best possible hand strength tuple.
  for exactly 5 cards, evaluates directly.
  for 6 or 7 cards, tries all C(n,5) combinations and keeps the best.
  """
  n = len(cards)
  if n == 5:
    return _evaluate_five(cards)

  best = None
  for combo in combinations(cards, 5):
    strength = _evaluate_five(combo)
    if best is None or strength > best:
      best = strength
  return best


def hand_category_name(strength_tuple):
  """given a strength tuple from evaluate_hand, return the hand name."""
  return CATEGORY_NAMES[strength_tuple[0]]
