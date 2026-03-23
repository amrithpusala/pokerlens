# evaluate.py — benchmark the trained model against monte carlo
#
# usage:
#   python ml/evaluate.py --model ml/model.pt --data ml/data/train.csv
#
# reports:
#   - correlation with MC equity (target: >0.99)
#   - mean absolute error (target: <1%)
#   - max absolute error
#   - inference latency (target: <10ms per query)

import argparse
import csv
import os
import sys
import time

import torch
import numpy as np

from model import EquityNet

# add backend to path for card encoding
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
from app.card_encoding import encode_scenario


def load_model(model_path, device):
  """load a trained model from a checkpoint file."""
  checkpoint = torch.load(model_path, map_location=device, weights_only=True)

  model = EquityNet(
    hidden_dim=checkpoint['hidden_dim'],
    num_layers=checkpoint['num_layers']
  ).to(device)
  model.load_state_dict(checkpoint['model_state_dict'])
  model.eval()

  print(f'loaded model from {model_path}')
  print(f'  trained for {checkpoint["epoch"]} epochs')
  print(f'  val_loss: {checkpoint["val_loss"]:.6f}')
  print(f'  val_mae:  {checkpoint["val_mae"]:.4f}')

  return model


def load_test_data(csv_path, max_samples=10000):
  """load test data from CSV, taking the last max_samples rows."""
  features = []
  labels = []

  with open(csv_path, 'r') as f:
    reader = csv.reader(f)
    next(reader)  # skip header
    rows = list(reader)

  # use the last N rows as test data (these weren't used for training
  # since the training script splits 80/10/10 from the beginning)
  test_rows = rows[-max_samples:] if len(rows) > max_samples else rows

  for row in test_rows:
    feats = [float(x) for x in row[:53]]
    label = float(row[53])
    features.append(feats)
    labels.append(label)

  return (
    torch.tensor(features, dtype=torch.float32),
    np.array(labels)
  )


def benchmark_accuracy(model, features, labels, device):
  """compare model predictions against MC equity labels."""
  with torch.no_grad():
    predictions = model(features.to(device)).cpu().numpy().flatten()

  # correlation
  correlation = np.corrcoef(predictions, labels)[0, 1]

  # mean absolute error
  errors = np.abs(predictions - labels)
  mae = errors.mean()
  max_error = errors.max()

  # error distribution
  pct_under_1 = (errors < 0.01).mean() * 100
  pct_under_2 = (errors < 0.02).mean() * 100
  pct_under_5 = (errors < 0.05).mean() * 100

  print(f'\naccuracy metrics ({len(labels)} samples):')
  print(f'  correlation:    {correlation:.6f}')
  print(f'  mean abs error: {mae:.4f} ({mae * 100:.2f}%)')
  print(f'  max abs error:  {max_error:.4f} ({max_error * 100:.2f}%)')
  print(f'\n  error < 1%:     {pct_under_1:.1f}% of samples')
  print(f'  error < 2%:     {pct_under_2:.1f}% of samples')
  print(f'  error < 5%:     {pct_under_5:.1f}% of samples')

  return correlation, mae


def benchmark_latency(model, device, num_queries=1000):
  """measure single-query inference latency."""
  dummy = torch.randn(1, 53).to(device)

  # warmup
  for _ in range(100):
    model(dummy)

  # timed run
  start = time.perf_counter()
  for _ in range(num_queries):
    model(dummy)
  elapsed = time.perf_counter() - start

  latency_us = elapsed / num_queries * 1_000_000
  latency_ms = elapsed / num_queries * 1000

  print(f'\ninference latency ({num_queries} queries):')
  print(f'  per query: {latency_us:.0f} us ({latency_ms:.2f} ms)')
  print(f'  throughput: {num_queries / elapsed:.0f} queries/sec')

  return latency_ms


def benchmark_batch_latency(model, device, batch_sizes=[1, 8, 32, 128]):
  """measure latency at different batch sizes."""
  print(f'\nbatch inference latency:')
  for bs in batch_sizes:
    dummy = torch.randn(bs, 53).to(device)
    # warmup
    for _ in range(50):
      model(dummy)
    # timed
    start = time.perf_counter()
    for _ in range(500):
      model(dummy)
    elapsed = time.perf_counter() - start
    per_query = elapsed / 500 * 1000
    print(f'  batch={bs:>4d}: {per_query:.2f} ms/batch, {per_query/bs*1000:.0f} us/sample')


def main():
  parser = argparse.ArgumentParser(description='evaluate trained equity model')
  parser.add_argument('--model', type=str, required=True, help='path to model.pt')
  parser.add_argument('--data', type=str, required=True, help='path to test CSV')
  parser.add_argument('--max-samples', type=int, default=10000,
                      help='max test samples to evaluate')
  args = parser.parse_args()

  device = torch.device('cpu')  # inference benchmarks should use CPU for fair comparison
  print(f'using device: {device}')

  model = load_model(args.model, device)
  features, labels = load_test_data(args.data, args.max_samples)

  correlation, mae = benchmark_accuracy(model, features, labels, device)
  latency = benchmark_latency(model, device)
  benchmark_batch_latency(model, device)

  # summary
  print(f'\n{"=" * 50}')
  print(f'summary:')
  print(f'  correlation:  {correlation:.4f} (target: >0.99)')
  print(f'  MAE:          {mae * 100:.2f}%   (target: <1%)')
  print(f'  latency:      {latency:.2f}ms (target: <10ms)')

  checks = []
  checks.append(('correlation > 0.99', correlation > 0.99))
  checks.append(('MAE < 1%', mae < 0.01))
  checks.append(('latency < 10ms', latency < 10))

  print()
  for label, passed in checks:
    status = 'PASS' if passed else 'MISS'
    print(f'  [{status}] {label}')


if __name__ == '__main__':
  main()
