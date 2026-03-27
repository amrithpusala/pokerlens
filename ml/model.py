# model.py — neural network architecture for equity prediction
#
# architecture v2: wider layers with residual (skip) connections.
#
# the original 4x256 network (213K params) plateaued at ~88% correlation
# with 500K samples. this version uses:
#   - 6 layers of 512 units (1.6M params, 8x more capacity)
#   - residual connections every 2 layers (helps gradient flow in deeper nets)
#   - lower dropout (0.05) since 500K samples reduces overfitting risk
#   - the same sigmoid output to clamp equity to [0, 1]
#
# residual connections explained:
#   instead of output = layer(input), we do output = layer(input) + input.
#   this lets the network learn "corrections" on top of the identity function,
#   which makes training deeper networks much easier. this is the same idea
#   behind ResNet, which won ImageNet in 2015.

import torch
import torch.nn as nn


class ResidualBlock(nn.Module):
  """two linear layers with a skip connection.
  input -> Linear -> BN -> ReLU -> Dropout -> Linear -> BN -> (+input) -> ReLU
  """
  def __init__(self, dim, dropout=0.05):
    super().__init__()
    self.block = nn.Sequential(
      nn.Linear(dim, dim),
      nn.BatchNorm1d(dim),
      nn.ReLU(),
      nn.Dropout(dropout),
      nn.Linear(dim, dim),
      nn.BatchNorm1d(dim),
    )
    self.relu = nn.ReLU()

  def forward(self, x):
    return self.relu(self.block(x) + x)


class EquityNet(nn.Module):
  def __init__(self, input_dim=53, hidden_dim=512, num_layers=6, dropout=0.05):
    super().__init__()

    # project input to hidden dimension
    self.input_proj = nn.Sequential(
      nn.Linear(input_dim, hidden_dim),
      nn.BatchNorm1d(hidden_dim),
      nn.ReLU(),
      nn.Dropout(dropout),
    )

    # stack of residual blocks (each block = 2 layers)
    num_blocks = num_layers // 2
    self.blocks = nn.Sequential(
      *[ResidualBlock(hidden_dim, dropout) for _ in range(num_blocks)]
    )

    # output head
    self.output_head = nn.Sequential(
      nn.Linear(hidden_dim, 1),
      nn.Sigmoid(),
    )

  def forward(self, x):
    x = self.input_proj(x)
    x = self.blocks(x)
    return self.output_head(x)


def count_parameters(model):
  """count total trainable parameters in the model."""
  return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == '__main__':
  model = EquityNet()
  print(f'model parameters: {count_parameters(model):,}')
  print()
  print(model)
  print()

  dummy_input = torch.randn(8, 53)
  output = model(dummy_input)
  print(f'input shape:  {dummy_input.shape}')
  print(f'output shape: {output.shape}')
  print(f'output range: [{output.min().item():.4f}, {output.max().item():.4f}]')
