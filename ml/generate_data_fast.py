# generate_data_fast.py — parallelized training data generation
#
# the original generate_data.py runs one sample at a time, each using
# a single-threaded MC simulation. this version runs multiple samples
# in parallel across all CPU cores, which is 4-8x faster.
#
# usage:
#   cd backend
#   PYTHONPATH=. python ../ml/generate_data_fast.py --samples 500000 --output ../ml/data/train_500k.csv
#
# on a 10-core M1/M2 Mac, expect ~40-50 samples/sec (vs ~8 single-threaded)
# 500K samples at 45 samples/sec takes roughly 3 hours

import argparse
import csv
import os
import sys
import time
import random
from multiprocessing import Pool, cpu_count

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.monte_carlo import compute_equity
from app.card_encoding import encode_scenario

ALL_CARDS = [r + s for r in '23456789TJQKA' for s in 'cdhs']
BOARD_SIZES = [0, 0, 0, 3, 3, 4, 5]  # oversample preflop


def generate_one_sample(seed):
  """generate a single training sample. takes a seed for reproducibility."""
  rng = random.Random(seed)

  board_size = rng.choice(BOARD_SIZES)
  num_opponents = rng.randint(1, 4)
  total_cards = 2 + board_size
  cards = rng.sample(ALL_CARDS, total_cards)
  hand = cards[:2]
  board = cards[2:]

  result = compute_equity(
    hand_strs=hand,
    board_strs=board,
    num_opponents=num_opponents,
    iterations=3000,  # 3K is enough for training labels
    num_workers=1     # single worker per sample since we parallelize at sample level
  )

  features = encode_scenario(hand, board, num_opponents)
  equity = result['win'] + result['tie'] * 0.5

  return features + [round(equity, 6)]


def generate_batch(args):
  """generate a batch of samples. used by the process pool."""
  start_seed, count = args
  results = []
  for i in range(count):
    try:
      row = generate_one_sample(start_seed + i)
      results.append(row)
    except Exception as e:
      pass  # skip failed samples
  return results


def main():
  parser = argparse.ArgumentParser(description='fast parallel training data generation')
  parser.add_argument('--samples', type=int, default=500000)
  parser.add_argument('--output', type=str, default='../ml/data/train_500k.csv')
  parser.add_argument('--workers', type=int, default=None,
                      help='number of parallel workers (default: cpu count)')
  parser.add_argument('--batch-size', type=int, default=100,
                      help='samples per worker batch')
  parser.add_argument('--seed', type=int, default=42)
  args = parser.parse_args()

  num_workers = args.workers or min(cpu_count(), 10)
  os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

  feature_cols = [f'f{i}' for i in range(53)]
  header = feature_cols + ['equity']

  # split work into batches
  batches = []
  seed = args.seed
  remaining = args.samples
  while remaining > 0:
    batch_count = min(args.batch_size, remaining)
    batches.append((seed, batch_count))
    seed += batch_count
    remaining -= batch_count

  total_batches = len(batches)
  est_time = args.samples / (num_workers * 5) / 60  # rough estimate

  print(f'generating {args.samples} samples')
  print(f'workers: {num_workers}, batch size: {args.batch_size}, total batches: {total_batches}')
  print(f'output: {args.output}')
  print(f'estimated time: ~{est_time:.0f} minutes')
  print()

  start = time.time()
  completed = 0

  with open(args.output, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)

    with Pool(num_workers) as pool:
      for batch_results in pool.imap_unordered(generate_batch, batches):
        for row in batch_results:
          writer.writerow(row)
        completed += len(batch_results)

        # progress every 1000 samples
        if completed % 1000 < args.batch_size:
          elapsed = time.time() - start
          rate = completed / elapsed
          remaining_time = (args.samples - completed) / rate if rate > 0 else 0
          print(f'  [{completed:>7d}/{args.samples}] '
                f'{rate:.1f} samples/sec, '
                f'~{remaining_time / 60:.1f} min remaining')

  elapsed = time.time() - start
  print(f'\ndone. {completed} samples in {elapsed / 60:.1f} minutes')
  print(f'rate: {completed / elapsed:.1f} samples/sec')
  print(f'saved to {args.output}')
  print(f'\nnext steps:')
  print(f'  cd ml')
  print(f'  python train.py --data data/train_500k.csv --output model.pt --epochs 50')


if __name__ == '__main__':
  main()
