# generate_data.py — produce training data for the equity neural net
#
# this script generates random poker scenarios (hand + board + opponents),
# runs the monte carlo engine on each one, and saves the results as a CSV.
# each row is one training sample: 53 input features + 1 equity label.
#
# usage:
#   cd backend
#   PYTHONPATH=. python ../ml/generate_data.py --samples 10000 --output ../ml/data/train.csv
#
# for the full training set (500K+ samples), run this on a machine with
# multiple cores. at ~500ms per sample, 500K takes roughly 70 hours on
# 1 core, or ~9 hours on 8 cores. google colab works well for this.

import argparse
import csv
import os
import random
import sys
import time

# add backend to path so we can import the MC engine
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.monte_carlo import compute_equity
from app.card_encoding import encode_scenario

ALL_CARDS = [
  r + s
  for r in '23456789TJQKA'
  for s in 'cdhs'
]

# board states to sample from. pre-flop scenarios are the most
# common and hardest for the NN, so we oversample them.
BOARD_SIZES = [0, 0, 0, 3, 3, 4, 5]


def generate_random_scenario():
  """create a random (hand, board, opponents) scenario."""
  board_size = random.choice(BOARD_SIZES)
  num_opponents = random.randint(1, 4)

  # pick random cards without replacement
  total_cards = 2 + board_size
  cards = random.sample(ALL_CARDS, total_cards)
  hand = cards[:2]
  board = cards[2:]

  return hand, board, num_opponents


def generate_sample(mc_iterations=5000):
  """generate one training sample: encoded input + equity label."""
  hand, board, opponents = generate_random_scenario()

  result = compute_equity(
    hand_strs=hand,
    board_strs=board,
    num_opponents=opponents,
    iterations=mc_iterations,
    num_workers=1  # single worker since we're already parallelizing at the sample level
  )

  features = encode_scenario(hand, board, opponents)
  equity = result['win'] + result['tie'] * 0.5  # standard equity = win + half of ties

  return features, equity


def main():
  parser = argparse.ArgumentParser(description='generate training data for equity NN')
  parser.add_argument('--samples', type=int, default=10000,
                      help='number of training samples to generate')
  parser.add_argument('--output', type=str, default='../ml/data/train.csv',
                      help='output CSV file path')
  parser.add_argument('--mc-iters', type=int, default=5000,
                      help='MC iterations per sample (higher = more accurate labels)')
  parser.add_argument('--seed', type=int, default=42,
                      help='random seed for reproducibility')
  args = parser.parse_args()

  random.seed(args.seed)

  # make sure output directory exists
  os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

  # column names: f0..f52 for features, equity for label
  feature_cols = [f'f{i}' for i in range(53)]
  header = feature_cols + ['equity']

  print(f'generating {args.samples} samples with {args.mc_iters} MC iterations each')
  print(f'output: {args.output}')
  print(f'estimated time: ~{args.samples * 0.3 / 60:.1f} minutes')
  print()

  start = time.time()
  completed = 0

  with open(args.output, 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)

    for i in range(args.samples):
      features, equity = generate_sample(mc_iterations=args.mc_iters)
      writer.writerow(features + [round(equity, 6)])
      completed += 1

      # progress update every 100 samples
      if completed % 100 == 0:
        elapsed = time.time() - start
        rate = completed / elapsed
        remaining = (args.samples - completed) / rate
        print(f'  [{completed}/{args.samples}] '
              f'{rate:.1f} samples/sec, '
              f'~{remaining / 60:.1f} min remaining')

  elapsed = time.time() - start
  print(f'\ndone. {completed} samples in {elapsed / 60:.1f} minutes')
  print(f'saved to {args.output}')


if __name__ == '__main__':
  main()
