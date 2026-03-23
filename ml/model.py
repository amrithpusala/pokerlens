# model.py — neural network architecture for equity prediction
#
# this is a feedforward (fully connected) network. the architecture:
#   input:  53 dimensions (52 card flags + opponent count)
#   hidden: 4 layers of 256 units each, with ReLU and BatchNorm
#   output: 1 float (predicted equity, 0 to 1)
#
# why this architecture:
#   - feedforward is the simplest option and works well here because
#     the input is a fixed-size vector, not a sequence
#   - 4 layers with 256 units gives enough capacity to learn the
#     nonlinear relationship between card combinations and equity
#   - BatchNorm stabilizes training and lets us use higher learning rates
#   - sigmoid output clamps the prediction to [0, 1]
#   - dropout prevents overfitting on the training data

import torch
import torch.nn as nn


class EquityNet(nn.Module):
  def __init__(self, input_dim=53, hidden_dim=256, num_layers=4, dropout=0.1):
    super().__init__()

    layers = []

    # first hidden layer: input_dim -> hidden_dim
    layers.append(nn.Linear(input_dim, hidden_dim))
    layers.append(nn.BatchNorm1d(hidden_dim))
    layers.append(nn.ReLU())
    layers.append(nn.Dropout(dropout))

    # remaining hidden layers: hidden_dim -> hidden_dim
    for _ in range(num_layers - 1):
      layers.append(nn.Linear(hidden_dim, hidden_dim))
      layers.append(nn.BatchNorm1d(hidden_dim))
      layers.append(nn.ReLU())
      layers.append(nn.Dropout(dropout))

    # output layer: hidden_dim -> 1
    layers.append(nn.Linear(hidden_dim, 1))
    layers.append(nn.Sigmoid())  # clamp output to [0, 1]

    self.net = nn.Sequential(*layers)

  def forward(self, x):
    # x shape: (batch_size, 53)
    # output shape: (batch_size, 1)
    return self.net(x)


def count_parameters(model):
  """count total trainable parameters in the model."""
  return sum(p.numel() for p in model.parameters() if p.requires_grad)


if __name__ == '__main__':
  # quick sanity check: create model, pass random input, check output shape
  model = EquityNet()
  print(f'model parameters: {count_parameters(model):,}')
  print()
  print(model)
  print()

  # test with a batch of 8 random inputs
  dummy_input = torch.randn(8, 53)
  output = model(dummy_input)
  print(f'input shape:  {dummy_input.shape}')
  print(f'output shape: {output.shape}')
  print(f'output range: [{output.min().item():.4f}, {output.max().item():.4f}]')
