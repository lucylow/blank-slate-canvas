# Models Directory

This directory contains trained machine learning models for the PitWall A.I. system.

## Structure

```
models/
├── total_time_predictor.joblib    # Main predictive model for finishing time
├── agents/                        # Agent ensemble models (optional)
│   ├── agent1.joblib
│   ├── agent2.joblib
│   └── ...
└── README.md                      # This file
```

## Model Contract

### Main Model: `total_time_predictor.joblib`

**Input Format:**
- Pandas DataFrame with one row per car
- Required columns:
  - `car`: Car identifier (string)
  - `baseline_time`: Current total race time in seconds (float)
  - `avg_lap_time`: Average lap time in seconds (float)
  - `laps_completed`: Number of laps completed (int)
  - `laps_remaining`: Number of laps remaining (int)
  - `pit_at_lap`: Lap number when pit occurs (0 if no pit) (int)
  - `pit_time_cost`: Time cost of pit stop in seconds (float)
  - `outlap_penalty`: Penalty for outlap in seconds (float)

**Output Format:**
- NumPy array or list of predicted final total times (seconds)
- One prediction per car, matching input order

### Training Target

The model should be trained to predict:
- **Final total race time** (seconds) for each car given the race state

### Example Training Data

```python
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
import joblib

# Example training features
features = ['baseline_time', 'avg_lap_time', 'laps_completed', 
            'laps_remaining', 'pit_at_lap', 'pit_time_cost', 'outlap_penalty']

# Train model
model = GradientBoostingRegressor(n_estimators=100, max_depth=5)
model.fit(X_train[features], y_train)  # y_train = final total times

# Save model
joblib.dump(model, 'models/total_time_predictor.joblib')
```

## Agent Models (Optional)

Place individual agent models in `models/agents/` directory. Each agent model should follow the same contract as the main model.

The replay API will automatically load all `.joblib` files from this directory and can combine their predictions for ensemble voting.

## Usage

The replay API (`src/backend/replay_api.py`) will automatically load models from this directory at startup:

1. Main model: `models/total_time_predictor.joblib`
2. Agent models: `models/agents/*.joblib`

If no model is found, the system falls back to a naive deterministic simulator.

## Model Development

To train a new model:

1. Prepare training data with features matching the contract above
2. Train using scikit-learn, XGBoost, or your preferred ML framework
3. Save as `joblib` format: `joblib.dump(model, 'models/total_time_predictor.joblib')`
4. Restart the replay API server

## Notes

- Models are loaded at server startup
- If a model fails to load, the system continues with naive simulation
- Model predictions are compared against naive results in the API response
- See `src/backend/replay_api.py` for implementation details

