# train.py — train the equity neural network
#
# usage:
#   python ml/train.py --data ml/data/train.csv --output ml/model.pt
#
# PyTorch concepts used here (in case you're new to it):
#
#   tensor:      PyTorch's version of a numpy array, but it can run on GPU
#                and tracks gradients for backpropagation.
#
#   Dataset:     a class that holds your data and returns one sample at a time.
#                __len__ returns the total count, __getitem__ returns sample i.
#
#   DataLoader:  wraps a Dataset and handles batching, shuffling, and
#                loading data in parallel. you iterate over it in the
#                training loop and it gives you batches of (input, label).
#
#   optimizer:   adjusts the model weights after each batch to reduce the loss.
#                Adam is the default choice; it adapts the learning rate
#                per-parameter so you don't have to tune it as carefully.
#
#   loss function: measures how far off the predictions are from the true
#                  labels. MSE (mean squared error) works well for regression.
#
#   epoch:       one full pass through the entire training dataset.
#                typically you train for 20-50 epochs until validation loss
#                stops improving.

import argparse
import csv
import os
import time

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split

from model import EquityNet, count_parameters


class EquityDataset(Dataset):
  """loads training data from a CSV file into memory.
  each row has 53 feature columns (f0-f52) and 1 label column (equity).
  """
  def __init__(self, csv_path):
    self.features = []
    self.labels = []

    with open(csv_path, 'r') as f:
      reader = csv.reader(f)
      header = next(reader)  # skip header row

      for row in reader:
        # first 53 values are features, last value is the equity label
        feats = [float(x) for x in row[:53]]
        label = float(row[53])
        self.features.append(feats)
        self.labels.append(label)

    # convert to tensors (this loads everything into memory at once,
    # which is fine for datasets under a few million rows)
    self.features = torch.tensor(self.features, dtype=torch.float32)
    self.labels = torch.tensor(self.labels, dtype=torch.float32).unsqueeze(1)

    print(f'loaded {len(self)} samples from {csv_path}')

  def __len__(self):
    return len(self.labels)

  def __getitem__(self, idx):
    return self.features[idx], self.labels[idx]


def train_one_epoch(model, loader, optimizer, criterion, device):
  """run one training epoch. returns average loss."""
  model.train()  # enable dropout and batch norm in training mode
  total_loss = 0.0
  num_batches = 0

  for features, labels in loader:
    features = features.to(device)
    labels = labels.to(device)

    # forward pass: compute predictions
    predictions = model(features)
    loss = criterion(predictions, labels)

    # backward pass: compute gradients
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    total_loss += loss.item()
    num_batches += 1

  return total_loss / num_batches


def evaluate(model, loader, criterion, device):
  """evaluate model on validation data. returns average loss and MAE."""
  model.eval()  # disable dropout, use running stats for batch norm
  total_loss = 0.0
  total_mae = 0.0
  num_batches = 0

  with torch.no_grad():  # skip gradient computation for speed
    for features, labels in loader:
      features = features.to(device)
      labels = labels.to(device)

      predictions = model(features)
      loss = criterion(predictions, labels)

      mae = (predictions - labels).abs().mean()
      total_loss += loss.item()
      total_mae += mae.item()
      num_batches += 1

  avg_loss = total_loss / num_batches
  avg_mae = total_mae / num_batches
  return avg_loss, avg_mae


def main():
  parser = argparse.ArgumentParser(description='train equity neural network')
  parser.add_argument('--data', type=str, required=True,
                      help='path to training CSV')
  parser.add_argument('--output', type=str, default='ml/model.pt',
                      help='path to save trained model weights')
  parser.add_argument('--epochs', type=int, default=50,
                      help='number of training epochs')
  parser.add_argument('--batch-size', type=int, default=512,
                      help='batch size for training')
  parser.add_argument('--lr', type=float, default=0.001,
                      help='learning rate')
  parser.add_argument('--hidden-dim', type=int, default=512,
                      help='hidden layer size')
  parser.add_argument('--num-layers', type=int, default=6,
                      help='number of hidden layers')
  parser.add_argument('--patience', type=int, default=10,
                      help='early stopping patience (epochs without improvement)')
  args = parser.parse_args()

  # use GPU if available (mps for apple silicon, cuda for nvidia)
  if torch.cuda.is_available():
    device = torch.device('cuda')
  elif torch.backends.mps.is_available():
    device = torch.device('mps')
  else:
    device = torch.device('cpu')
  print(f'using device: {device}')

  # load data and split 80/10/10
  dataset = EquityDataset(args.data)
  total = len(dataset)
  train_size = int(0.8 * total)
  val_size = int(0.1 * total)
  test_size = total - train_size - val_size

  train_set, val_set, test_set = random_split(
    dataset, [train_size, val_size, test_size],
    generator=torch.Generator().manual_seed(42)
  )
  print(f'split: {train_size} train, {val_size} val, {test_size} test')

  train_loader = DataLoader(train_set, batch_size=args.batch_size, shuffle=True)
  val_loader = DataLoader(val_set, batch_size=args.batch_size)
  test_loader = DataLoader(test_set, batch_size=args.batch_size)

  # create model
  model = EquityNet(
    hidden_dim=args.hidden_dim,
    num_layers=args.num_layers
  ).to(device)
  print(f'model parameters: {count_parameters(model):,}')

  optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
  criterion = nn.MSELoss()

  # cosine annealing gives smoother LR decay than ReduceLROnPlateau
  scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
    optimizer, T_max=args.epochs, eta_min=1e-6
  )

  # training loop with early stopping
  best_val_loss = float('inf')
  epochs_without_improvement = 0

  print(f'\ntraining for up to {args.epochs} epochs...\n')
  print(f'{"epoch":>5} {"train_loss":>12} {"val_loss":>12} {"val_mae":>10} {"lr":>10} {"time":>8}')
  print('-' * 62)

  for epoch in range(1, args.epochs + 1):
    start = time.time()

    train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device)
    val_loss, val_mae = evaluate(model, val_loader, criterion, device)

    elapsed = time.time() - start
    current_lr = optimizer.param_groups[0]['lr']

    print(f'{epoch:5d} {train_loss:12.6f} {val_loss:12.6f} {val_mae:10.4f} {current_lr:10.6f} {elapsed:7.1f}s')

    scheduler.step()

    # save best model
    if val_loss < best_val_loss:
      best_val_loss = val_loss
      epochs_without_improvement = 0
      torch.save({
        'model_state_dict': model.state_dict(),
        'hidden_dim': args.hidden_dim,
        'num_layers': args.num_layers,
        'val_loss': val_loss,
        'val_mae': val_mae,
        'epoch': epoch,
      }, args.output)
    else:
      epochs_without_improvement += 1
      if epochs_without_improvement >= args.patience:
        print(f'\nearly stopping at epoch {epoch} (no improvement for {args.patience} epochs)')
        break

  # evaluate on test set using best saved model
  print(f'\nloading best model (epoch {epoch - epochs_without_improvement}, val_loss={best_val_loss:.6f})')
  checkpoint = torch.load(args.output, map_location=device, weights_only=True)
  model.load_state_dict(checkpoint['model_state_dict'])

  test_loss, test_mae = evaluate(model, test_loader, criterion, device)
  print(f'test MSE:  {test_loss:.6f}')
  print(f'test MAE:  {test_mae:.4f} ({test_mae * 100:.2f}% average error)')
  print(f'\nmodel saved to {args.output}')


if __name__ == '__main__':
  main()
