# model_server.py — load trained model and serve equity predictions
#
# this module is imported by main.py on startup. it loads the model
# weights once and keeps them in memory for fast inference.

import os
import torch
import sys

# add ml/ to path so we can import the model architecture
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'ml'))

from model import EquityNet
from app.card_encoding import encode_scenario

_model = None
_device = torch.device('cpu')  # cpu is faster than gpu for single-sample inference


def load_model(model_path=None):
  """load the trained model from disk. called once on server startup."""
  global _model

  if model_path is None:
    # default path: ml/model.pt relative to project root
    model_path = os.path.join(
      os.path.dirname(__file__), '..', '..', 'ml', 'model.pt'
    )

  if not os.path.exists(model_path):
    print(f'warning: model file not found at {model_path}')
    print('  the /api/equity-fast endpoint will not be available')
    print('  run ml/train.py to generate the model file')
    return False

  checkpoint = torch.load(model_path, map_location=_device, weights_only=True)

  _model = EquityNet(
    hidden_dim=checkpoint['hidden_dim'],
    num_layers=checkpoint['num_layers']
  ).to(_device)
  _model.load_state_dict(checkpoint['model_state_dict'])
  _model.eval()

  epoch = checkpoint['epoch']
  val_mae = checkpoint['val_mae']
  print(f'loaded equity model from {model_path}')
  print(f'  epoch {epoch}, val_mae: {val_mae:.4f}')
  return True


def predict_equity(hand_strs, board_strs, num_opponents):
  """run neural net inference on a single scenario.

  args:
    hand_strs: list of 2 card strings
    board_strs: list of 0-5 card strings
    num_opponents: int (1-9)

  returns:
    float: predicted equity (0 to 1), or None if model not loaded
  """
  if _model is None:
    return None

  features = encode_scenario(hand_strs, board_strs, num_opponents)
  tensor = torch.tensor([features], dtype=torch.float32).to(_device)

  with torch.no_grad():
    prediction = _model(tensor)

  return prediction.item()


def is_loaded():
  """check if the model has been loaded."""
  return _model is not None
