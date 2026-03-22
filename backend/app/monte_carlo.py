# monte_carlo.py — equity calculator using random simulation
# given your hole cards, the board, and number of opponents,
# deals out random remaining cards N times and counts wins/ties/losses.

import random
import time
from multiprocessing import Pool, cpu_count
from treys import Card, Evaluator

# single global evaluator instance (uses lookup tables internally)
_evaluator = Evaluator()


def _card_str_to_treys(card_str):
  """convert our format ('Ah') to treys format.
  treys uses the same notation so this is just Card.new()."""
  return Card.new(card_str)


def _parse_cards(card_strings):
  """convert list of our card strings to treys card ints."""
  return [Card.new(cs) for cs in card_strings]


def _build_deck(exclude):
  """build a full deck minus excluded cards. returns treys card ints."""
  full = [Card.new(r + s)
          for r in '23456789TJQKA'
          for s in 'shdc']
  exclude_set = set(exclude)
  return [c for c in full if c not in exclude_set]


def _run_chunk(args):
  """worker function for multiprocessing.
  runs a chunk of MC iterations and returns (wins, ties, total).

  NOTE on treys scoring: lower score = better hand.
  so we compare with < for wins and == for ties.
  """
  hand, board, num_opponents, iterations, seed = args
  rng = random.Random(seed)
  evaluator = Evaluator()

  deck = _build_deck(hand + board)
  cards_needed_board = 5 - len(board)
  cards_needed_total = cards_needed_board + (num_opponents * 2)

  wins = 0
  ties = 0

  for _ in range(iterations):
    # shuffle and deal from the top — faster than random.sample()
    # because we avoid creating a new list each iteration
    rng.shuffle(deck)
    idx = 0

    # deal remaining community cards
    sim_board = board + deck[idx:idx + cards_needed_board]
    idx += cards_needed_board

    # evaluate our hand (lower treys score = better)
    my_score = evaluator.evaluate(sim_board, hand)

    # evaluate each opponent and track the best (lowest score)
    best_opp = 7463  # worse than worst possible hand
    for _ in range(num_opponents):
      opp_hand = deck[idx:idx + 2]
      idx += 2
      opp_score = evaluator.evaluate(sim_board, opp_hand)
      if opp_score < best_opp:
        best_opp = opp_score

    # compare: lower score wins in treys
    if my_score < best_opp:
      wins += 1
    elif my_score == best_opp:
      ties += 1

  return (wins, ties, iterations)


def compute_equity(hand_strs, board_strs, num_opponents, iterations=10000,
                   num_workers=None):
  """compute equity using monte carlo simulation.

  args:
    hand_strs: list of 2 card strings, e.g. ['Ah', 'Kd']
    board_strs: list of 0-5 card strings, e.g. ['Ts', '9s', '2c']
    num_opponents: int, 1-9
    iterations: total number of MC rollouts
    num_workers: number of parallel processes (default: cpu count)

  returns:
    dict with 'win', 'tie', 'loss' (floats 0-1) and 'time_ms' (int)
  """
  start = time.perf_counter()

  hand = _parse_cards(hand_strs)
  board = _parse_cards(board_strs) if board_strs else []

  if num_workers is None:
    num_workers = min(cpu_count(), 8)

  # split iterations across workers, each gets a unique seed
  base_seed = random.randint(0, 2**31)
  chunk_size = iterations // num_workers
  remainder = iterations % num_workers

  chunks = []
  for i in range(num_workers):
    n = chunk_size + (1 if i < remainder else 0)
    if n > 0:
      chunks.append((hand, board, num_opponents, n, base_seed + i))

  # run in parallel
  if len(chunks) == 1:
    # single chunk — skip multiprocessing overhead
    results = [_run_chunk(chunks[0])]
  else:
    with Pool(num_workers) as pool:
      results = pool.map(_run_chunk, chunks)

  # aggregate results
  total_wins = sum(r[0] for r in results)
  total_ties = sum(r[1] for r in results)
  total_iters = sum(r[2] for r in results)

  elapsed_ms = int((time.perf_counter() - start) * 1000)

  win_pct = total_wins / total_iters
  tie_pct = total_ties / total_iters
  loss_pct = 1.0 - win_pct - tie_pct

  return {
    'win': round(win_pct, 4),
    'tie': round(tie_pct, 4),
    'loss': round(loss_pct, 4),
    'iterations': total_iters,
    'time_ms': elapsed_ms
  }
