# card_encoding.py — convert poker scenarios to neural net input vectors
#
# the neural net needs a fixed-size numeric input. we encode each scenario
# as a 53-dimensional vector:
#   - dimensions 0-51: binary flags for each card in the deck
#     (1 = card is known, i.e. in your hand or on the board)
#   - dimension 52: number of opponents (integer, 1-9)
#
# card indexing: index = rank * 4 + suit
#   ranks: 2=0, 3=1, 4=2, ..., T=8, J=9, Q=10, K=11, A=12
#   suits: c=0, d=1, h=2, s=3

RANK_TO_INT = {
  '2': 0, '3': 1, '4': 2, '5': 3, '6': 4, '7': 5,
  '8': 6, '9': 7, 'T': 8, 'J': 9, 'Q': 10, 'K': 11, 'A': 12
}
SUIT_TO_INT = {'c': 0, 'd': 1, 'h': 2, 's': 3}

INT_TO_RANK = {v: k for k, v in RANK_TO_INT.items()}
INT_TO_SUIT = {v: k for k, v in SUIT_TO_INT.items()}


def card_to_index(card_str):
  """convert a card string like 'Ah' to its deck index (0-51)."""
  rank = RANK_TO_INT[card_str[0]]
  suit = SUIT_TO_INT[card_str[1]]
  return rank * 4 + suit


def index_to_card(idx):
  """convert a deck index (0-51) back to a card string like 'Ah'."""
  rank = idx // 4
  suit = idx % 4
  return INT_TO_RANK[rank] + INT_TO_SUIT[suit]


def encode_scenario(hand_strs, board_strs, num_opponents):
  """encode a poker scenario as a 53-dim list of floats.

  args:
    hand_strs: list of 2 card strings, e.g. ['Ah', 'Kd']
    board_strs: list of 0-5 card strings
    num_opponents: int (1-9)

  returns:
    list of 53 floats (52 binary card flags + opponent count)
  """
  vec = [0.0] * 53
  for card in hand_strs:
    vec[card_to_index(card)] = 1.0
  for card in board_strs:
    vec[card_to_index(card)] = 1.0
  vec[52] = float(num_opponents)
  return vec


def decode_scenario(vec):
  """decode a 53-dim vector back to (hand, board, opponents).
  useful for debugging and sanity checks.
  """
  cards = []
  for i in range(52):
    if vec[i] > 0.5:
      cards.append(index_to_card(i))
  opponents = int(vec[52])
  # first 2 cards are hand, rest are board (by convention)
  # but we can't distinguish hand from board in the encoding,
  # which is fine because equity doesn't depend on which are which
  return cards, opponents
