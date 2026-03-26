# advisor.py — poker action advisor
#
# given a player's hand, board, pot size, bet to call, and number of
# opponents, computes equity and pot odds to recommend an action.
#
# this is not a full GTO solver (those take minutes to compute).
# instead, it gives a practical recommendation based on:
#   1. hand equity (from the neural net or MC engine)
#   2. pot odds (is the call mathematically profitable?)
#   3. draw analysis (flush draws, straight draws, overcards)
#   4. hand strength category (top pair, overpair, draw, etc.)
#
# the output explains the reasoning so users learn the math.

from app import model_server
from app.monte_carlo import compute_equity
from app.evaluator import parse_hand, evaluate_hand, hand_category_name, RANK_MAP

RANK_VALUES = {v: k for k, v in RANK_MAP.items()}


def _get_equity(hand, board, opponents):
  """get equity using NN if available, otherwise MC."""
  if model_server.is_loaded():
    eq = model_server.predict_equity(hand, board, opponents)
    return round(eq, 4), 'neural_net'
  else:
    result = compute_equity(
      hand_strs=hand, board_strs=board,
      num_opponents=opponents, iterations=5000, num_workers=1
    )
    eq = result['win'] + result['tie'] * 0.5
    return round(eq, 4), 'monte_carlo'


def _count_outs(hand, board):
  """count drawing outs for common draws.
  returns a list of draw descriptions with out counts.
  """
  if len(board) < 3:
    return []

  draws = []
  hand_cards = parse_hand(hand)
  board_cards = parse_hand(board)
  all_cards = hand_cards + board_cards

  all_ranks = [c[0] for c in all_cards]
  all_suits = [c[1] for c in all_cards]
  hand_ranks = [c[0] for c in hand_cards]
  hand_suits = [c[1] for c in hand_cards]

  # flush draw: 4 cards of same suit
  for suit in range(4):
    suited_count = sum(1 for c in all_cards if c[1] == suit)
    if suited_count == 4:
      draws.append({'draw': 'flush draw', 'outs': 9})
    elif suited_count == 3 and len(board) == 3:
      # backdoor flush draw
      hand_in_suit = sum(1 for c in hand_cards if c[1] == suit)
      if hand_in_suit >= 1:
        draws.append({'draw': 'backdoor flush draw', 'outs': 1})

  # straight draw: check for open-ended and gutshot
  unique_ranks = sorted(set(all_ranks))
  for start in range(9):  # check windows of 5 consecutive ranks
    window = set(range(start, start + 5))
    # also check ace-low (A-2-3-4-5)
    matched = window.intersection(set(unique_ranks))
    if len(matched) == 4:
      # check if at least one of the missing cards uses a hand card
      missing = window - set(unique_ranks)
      if len(missing) == 1:
        # open-ended if the missing card is at either end
        missing_rank = list(missing)[0]
        if missing_rank == start or missing_rank == start + 4:
          if not any(d['draw'] == 'open-ended straight draw' for d in draws):
            draws.append({'draw': 'open-ended straight draw', 'outs': 8})
        else:
          if not any(d['draw'] == 'gutshot straight draw' for d in draws):
            draws.append({'draw': 'gutshot straight draw', 'outs': 4})

  # overcard outs (if no pair and board has been dealt)
  if len(board) >= 3:
    board_ranks = [c[0] for c in board_cards]
    max_board_rank = max(board_ranks)
    overcards = sum(1 for r in hand_ranks if r > max_board_rank)
    if overcards > 0:
      strength = evaluate_hand(all_cards)
      # only count overcard outs if we don't already have a pair or better
      if strength[0] == 0:  # high card
        draws.append({'draw': f'{overcards} overcard(s)', 'outs': overcards * 3})

  return draws


def _categorize_hand(hand, board):
  """categorize the current hand strength in plain language."""
  if len(board) == 0:
    # preflop categorization
    r1 = RANK_MAP[hand[0][0]]
    r2 = RANK_MAP[hand[1][0]]
    suited = hand[0][1] == hand[1][1]

    if r1 == r2:
      if r1 >= 10:  # JJ+
        return 'premium pocket pair'
      elif r1 >= 7:
        return 'medium pocket pair'
      else:
        return 'small pocket pair'
    elif r1 >= 11 and r2 >= 11:
      return 'premium broadway'
    elif r1 >= 10 and r2 >= 10:
      return 'broadway hand'
    elif r1 == 12:  # ace
      if suited:
        return 'suited ace'
      elif r2 >= 8:
        return 'strong ace'
      else:
        return 'weak ace'
    elif suited and abs(r1 - r2) <= 2:
      return 'suited connector'
    elif suited:
      return 'suited hand'
    else:
      return 'offsuit hand'

  # postflop: evaluate the made hand
  all_cards = parse_hand(hand) + parse_hand(board)
  strength = evaluate_hand(all_cards)
  return hand_category_name(strength)


def compute_advice(hand, board, opponents, pot_size, bet_to_call):
  """compute an action recommendation.

  args:
    hand: list of 2 card strings
    board: list of 0-5 card strings
    opponents: int (1-9)
    pot_size: float (current pot before your action)
    bet_to_call: float (amount you need to call, 0 if no bet)

  returns:
    dict with recommendation, reasoning, and supporting math
  """
  equity, method = _get_equity(hand, board, opponents)
  draws = _count_outs(hand, board)
  hand_category = _categorize_hand(hand, board)

  # pot odds calculation
  if bet_to_call > 0:
    pot_odds = bet_to_call / (pot_size + bet_to_call)
  else:
    pot_odds = 0.0

  # total outs and draw equity (rule of 2 and 4)
  total_outs = sum(d['outs'] for d in draws)
  streets_remaining = max(0, 5 - len(board))
  if streets_remaining == 2:
    draw_equity = min(total_outs * 4, 60) / 100  # rule of 4 for flop
  elif streets_remaining == 1:
    draw_equity = min(total_outs * 2, 40) / 100  # rule of 2 for turn
  else:
    draw_equity = 0

  # decision logic
  reasoning = []
  action = 'fold'
  confidence = 'low'

  if bet_to_call == 0:
    # no bet to call (we can check or bet)
    if equity > 0.65:
      action = 'bet'
      confidence = 'high'
      reasoning.append(f'strong hand with {equity*100:.1f}% equity')
      reasoning.append('betting for value to build the pot')
    elif equity > 0.45:
      action = 'check'
      confidence = 'medium'
      reasoning.append(f'decent hand with {equity*100:.1f}% equity')
      reasoning.append('checking to control the pot size')
      if total_outs > 0:
        reasoning.append(f'{total_outs} outs to improve')
    else:
      if total_outs >= 8:
        action = 'bet'
        confidence = 'medium'
        reasoning.append(f'weak hand but {total_outs} outs to improve')
        reasoning.append('semi-bluff to win the pot now or improve later')
      else:
        action = 'check'
        confidence = 'medium'
        reasoning.append(f'weak hand with {equity*100:.1f}% equity')
        reasoning.append('check and fold to aggression')
  else:
    # facing a bet
    equity_needed = pot_odds
    equity_surplus = equity - equity_needed

    reasoning.append(f'pot odds: need {pot_odds*100:.1f}% equity to call')
    reasoning.append(f'your equity: {equity*100:.1f}%')

    if equity > 0.65 and equity_surplus > 0.15:
      action = 'raise'
      confidence = 'high'
      reasoning.append(f'strong hand with {equity_surplus*100:.1f}% equity surplus')
      reasoning.append('raising for value')
    elif equity > equity_needed + 0.05:
      action = 'call'
      confidence = 'high'
      reasoning.append(f'profitable call with {equity_surplus*100:.1f}% equity surplus')
    elif equity > equity_needed - 0.03:
      # borderline
      if total_outs >= 6:
        action = 'call'
        confidence = 'medium'
        reasoning.append(f'borderline but {total_outs} outs provide implied odds')
      else:
        action = 'fold'
        confidence = 'low'
        reasoning.append('borderline spot, slightly unprofitable without draws')
    else:
      if total_outs >= 9 and draw_equity > equity_needed:
        action = 'call'
        confidence = 'medium'
        reasoning.append(f'{total_outs} outs ({draw_equity*100:.0f}% draw equity) justify a call')
      elif total_outs >= 12:
        action = 'raise'
        confidence = 'medium'
        reasoning.append(f'{total_outs} outs make this a strong semi-bluff raise')
      else:
        action = 'fold'
        confidence = 'high'
        reasoning.append(f'equity ({equity*100:.1f}%) is below pot odds ({pot_odds*100:.1f}%)')
        reasoning.append('folding is the most profitable play')

  return {
    'action': action,
    'confidence': confidence,
    'equity': equity,
    'pot_odds': round(pot_odds, 4) if bet_to_call > 0 else None,
    'hand_category': hand_category,
    'draws': draws,
    'total_outs': total_outs,
    'reasoning': reasoning,
    'method': method,
    'pot_size': pot_size,
    'bet_to_call': bet_to_call,
  }
