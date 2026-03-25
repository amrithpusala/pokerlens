# hand_parser.py — parse PokerStars hand history files
#
# pokerstars hand histories follow a well-defined text format.
# each hand starts with "PokerStars Hand #" and contains:
#   - hand ID, game type, stakes, timestamp
#   - seat assignments and stack sizes
#   - hole cards (for the hero)
#   - community cards dealt at each street
#   - actions (bets, calls, folds, raises)
#   - summary with pot size and winner
#
# this parser extracts the key data and computes equity at each
# street using the neural net (if loaded) or a quick MC fallback.

import re
from app import model_server
from app.monte_carlo import compute_equity


def _compute_equity_at_street(hero_hand, board, num_opponents):
  """compute equity using NN if available, otherwise MC with low iterations."""
  if model_server.is_loaded():
    eq = model_server.predict_equity(hero_hand, board, num_opponents)
    return round(eq, 4)
  else:
    result = compute_equity(
      hand_strs=hero_hand,
      board_strs=board,
      num_opponents=num_opponents,
      iterations=2000,
      num_workers=1
    )
    return round(result['win'] + result['tie'] * 0.5, 4)


def _parse_single_hand(block):
  """parse one hand history block into a structured dict."""
  lines = block.strip().split('\n')
  if not lines:
    return None

  hand_data = {
    'hand_id': None,
    'game_type': None,
    'hero': None,
    'hero_hand': [],
    'board': { 'flop': [], 'turn': [], 'river': [] },
    'equity': { 'preflop': None, 'flop': None, 'turn': None, 'river': None },
    'pot': None,
    'result': None,
    'players_at_start': 0,
    'actions': { 'preflop': [], 'flop': [], 'turn': [], 'river': [] },
  }

  # extract hand ID
  id_match = re.search(r'Hand #(\d+)', lines[0])
  if id_match:
    hand_data['hand_id'] = id_match.group(1)

  # extract game type (Hold'em No Limit, etc.)
  game_match = re.search(r"Hold'em\s+(No Limit|Pot Limit|Limit)", lines[0])
  if game_match:
    hand_data['game_type'] = f"Hold'em {game_match.group(1)}"

  # count players and find hero
  seat_count = 0
  current_street = 'preflop'

  for line in lines:
    # count seats
    if line.startswith('Seat ') and ':' in line and 'in chips' in line:
      seat_count += 1

    # find hero and hole cards
    hero_match = re.match(r'Dealt to (.+?) \[(.+?)\]', line)
    if hero_match:
      hand_data['hero'] = hero_match.group(1)
      cards_str = hero_match.group(2)
      hand_data['hero_hand'] = _parse_cards(cards_str)

    # track streets
    if '*** FLOP ***' in line:
      current_street = 'flop'
      flop_match = re.search(r'\[(.+?)\]', line)
      if flop_match:
        hand_data['board']['flop'] = _parse_cards(flop_match.group(1))

    elif '*** TURN ***' in line:
      current_street = 'turn'
      turn_match = re.search(r'\] \[(.+?)\]', line)
      if turn_match:
        hand_data['board']['turn'] = _parse_cards(turn_match.group(1))

    elif '*** RIVER ***' in line:
      current_street = 'river'
      river_match = re.search(r'\] \[(.+?)\]', line)
      if river_match:
        hand_data['board']['river'] = _parse_cards(river_match.group(1))

    elif '*** SUMMARY ***' in line:
      current_street = 'summary'

    # parse actions (bets, calls, raises, folds, checks)
    if current_street in ('preflop', 'flop', 'turn', 'river'):
      action_match = re.match(
        r'^(.+?): (folds|checks|calls|bets|raises)(.*)$', line
      )
      if action_match:
        player = action_match.group(1)
        action = action_match.group(2)
        detail = action_match.group(3).strip()
        hand_data['actions'][current_street].append({
          'player': player,
          'action': action,
          'detail': detail
        })

    # extract pot from summary
    pot_match = re.search(r'Total pot (\$?[\d.]+)', line)
    if pot_match:
      hand_data['pot'] = pot_match.group(1)

    # extract result
    if hand_data['hero'] and 'collected' in line and hand_data['hero'] in line:
      hand_data['result'] = 'won'
    elif hand_data['hero'] and 'folded' in line and hand_data['hero'] in line:
      hand_data['result'] = 'folded'

  hand_data['players_at_start'] = seat_count

  # skip hands where we don't have hole cards (we were sitting out)
  if not hand_data['hero_hand'] or len(hand_data['hero_hand']) != 2:
    return None

  # compute equity at each street
  opponents = max(seat_count - 1, 1)

  # track active opponents (subtract players who folded)
  active_opponents = opponents

  hand_data['equity']['preflop'] = _compute_equity_at_street(
    hand_data['hero_hand'], [], min(active_opponents, 4)
  )

  # count folds at each street to estimate remaining opponents
  for action in hand_data['actions']['preflop']:
    if action['action'] == 'folds':
      active_opponents = max(active_opponents - 1, 1)

  if hand_data['board']['flop']:
    board_flop = hand_data['board']['flop']
    hand_data['equity']['flop'] = _compute_equity_at_street(
      hand_data['hero_hand'], board_flop, min(active_opponents, 4)
    )

    for action in hand_data['actions']['flop']:
      if action['action'] == 'folds':
        active_opponents = max(active_opponents - 1, 1)

  if hand_data['board']['turn']:
    board_turn = hand_data['board']['flop'] + hand_data['board']['turn']
    hand_data['equity']['turn'] = _compute_equity_at_street(
      hand_data['hero_hand'], board_turn, min(active_opponents, 4)
    )

    for action in hand_data['actions']['turn']:
      if action['action'] == 'folds':
        active_opponents = max(active_opponents - 1, 1)

  if hand_data['board']['river']:
    board_river = (hand_data['board']['flop'] +
                   hand_data['board']['turn'] +
                   hand_data['board']['river'])
    hand_data['equity']['river'] = _compute_equity_at_street(
      hand_data['hero_hand'], board_river, min(active_opponents, 4)
    )

  if hand_data['result'] is None:
    hand_data['result'] = 'lost'

  return hand_data


def _parse_cards(cards_str):
  """convert a space-separated card string like 'Ah Kd 2c' to a list.
  pokerstars uses the same notation we use internally.
  """
  cards = cards_str.strip().split()
  valid = []
  for c in cards:
    c = c.strip()
    if len(c) == 2 and c[0] in 'AKQJT98765432' and c[1] in 'shdc':
      valid.append(c)
  return valid


def parse_pokerstars_hands(text, max_hands=100):
  """parse a full pokerstars hand history file.
  splits on hand boundaries and parses each one.
  returns a list of parsed hand dicts, capped at max_hands.
  """
  # split on hand boundaries
  blocks = re.split(r'\n(?=PokerStars Hand #)', text)

  hands = []
  for block in blocks:
    if not block.strip():
      continue
    if not block.strip().startswith('PokerStars'):
      continue

    parsed = _parse_single_hand(block)
    if parsed:
      hands.append(parsed)
      if len(hands) >= max_hands:
        break

  return hands
