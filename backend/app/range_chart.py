# range_chart.py — compute pre-flop equity for all 169 starting hands
#
# a pre-flop range grid is a 13x13 matrix where:
#   - rows and columns are ranks: A, K, Q, J, T, 9, 8, 7, 6, 5, 4, 3, 2
#   - diagonal cells = pocket pairs (AA, KK, QQ, ...)
#   - above diagonal = suited hands (AKs, AQs, ...)
#   - below diagonal = offsuit hands (AKo, AQo, ...)
#   - each cell stores the equity for that starting hand
#
# for suited hands, we pick one representative combo (e.g. AhKh).
# for offsuit hands, we pick one combo (e.g. AhKd).
# for pairs, we pick one combo (e.g. AhAd).
# equity is symmetric across combos of the same type, so one sample is enough.

from app import model_server
from app.monte_carlo import compute_equity

RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']


def _representative_hand(rank1, rank2, suited):
  """pick a representative 2-card combo for this hand type.
  rank1 and rank2 are characters like 'A', 'K', etc.
  suited is True for suited hands, False for offsuit/pairs.
  """
  if rank1 == rank2:
    # pocket pair: use hearts and diamonds
    return [rank1 + 'h', rank2 + 'd']
  elif suited:
    # suited: both hearts
    return [rank1 + 'h', rank2 + 'h']
  else:
    # offsuit: first card hearts, second card diamonds
    return [rank1 + 'h', rank2 + 'd']


def compute_range_chart(num_opponents, use_nn=True):
  """compute equity for all 169 starting hands.

  returns a dict with:
    - ranks: list of rank labels ['A', 'K', ..., '2']
    - grid: 13x13 list of dicts, each with:
        - label: hand label like 'AKs', 'AKo', 'AA'
        - equity: float 0-1
        - type: 'pair', 'suited', or 'offsuit'
    - method: 'neural_net' or 'monte_carlo'
  """
  grid = []
  method = 'neural_net' if (use_nn and model_server.is_loaded()) else 'monte_carlo'

  for row_idx, rank1 in enumerate(RANKS):
    row = []
    for col_idx, rank2 in enumerate(RANKS):
      if row_idx == col_idx:
        # diagonal: pocket pair
        label = rank1 + rank2
        hand_type = 'pair'
        suited = False
      elif row_idx < col_idx:
        # above diagonal: suited
        label = rank1 + rank2 + 's'
        hand_type = 'suited'
        suited = True
      else:
        # below diagonal: offsuit
        label = rank2 + rank1 + 'o'
        hand_type = 'offsuit'
        suited = False

      hand = _representative_hand(rank1, rank2, suited)

      if method == 'neural_net':
        equity = model_server.predict_equity(hand, [], num_opponents)
      else:
        result = compute_equity(
          hand_strs=hand,
          board_strs=[],
          num_opponents=num_opponents,
          iterations=2000,
          num_workers=1
        )
        equity = result['win'] + result['tie'] * 0.5

      row.append({
        'label': label,
        'equity': round(equity, 4),
        'type': hand_type
      })

    grid.append(row)

  return {
    'ranks': RANKS,
    'grid': grid,
    'opponents': num_opponents,
    'method': method
  }
