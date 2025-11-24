# Physics-Informed Tire Wear Prediction

This document describes the physics-informed ML models for per-tire degradation prediction with 95%+ accuracy.

## Overview

The tire wear prediction system combines domain knowledge (frictional energy, heat, slip) with ML residual learning:

- **Physics core**: Provides correct long-term trends and constraint satisfaction (e.g., wear increases with dissipated energy)
- **ML residual**: Models complex unmodeled effects (compound chemistry, track micro-features, driver style)

Benefits: better sample efficiency, constrained extrapolation, easier debugging, and improved trust.

## Architecture

### Components

1. **Feature Precomputation** (`app/data/precompute_features.py`)
   - Extracts per-sample, per-sector, and per-lap aggregates from telemetry archives
   - Computes physics-based features: brake energy, cornering energy, tire stress, temperature rise
   - Outputs per-track Parquet files

2. **Model Training** (`app/models/train_tire_model.py`)
   - Trains physics baseline (Ridge regression)
   - Trains ML residual model (LightGBM)
   - Optional: TCN sequence model for time-series patterns
   - Cross-validates and outputs metrics

3. **TCN Residual Model** (`app/models/tcn_residual.py`)
   - PyTorch-based Temporal Convolutional Network
   - Processes sliding-window sequences of aggregated features
   - Predicts residual wear beyond physics baseline

4. **Inference Service** (`app/services/tire_wear_predictor_physics.py`)
   - Loads trained models
   - Computes physics baseline + residual predictions
   - Provides uncertainty quantification (confidence intervals)
   - Feature importance via ablation analysis

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

Key dependencies:
- `lightgbm>=4.0.0` - For residual model
- `pyarrow>=12.0.0` - For Parquet I/O
- `torch>=1.10.0` - Optional, for TCN model

### 2. Precompute Features

Extract and precompute features from telemetry archive:

```bash
mkdir -p data/precomputed models

python app/data/precompute_features.py \
  --archive file:///path/to/pitwall-backend-v2.tar.gz \
  --out-dir data/precomputed
```

This will:
- Extract the archive
- Scan for telemetry files (CSV/Parquet/JSONL)
- Compute per-lap aggregates (brake energy, cornering energy, tire temps, etc.)
- Write per-track Parquet files to `data/precomputed/`

### 3. Train Model

Train the physics-informed residual model:

```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v1.0 \
  --cv-folds 5
```

Optional: Train with TCN sequence model:

```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v1.0 \
  --use-tcn \
  --tcn-epochs 20 \
  --cv-folds 5
```

Outputs:
- `models/tire-v1.0.pkl` - Model bundle (physics + residual models)
- `models/manifest.json` - Metadata and CV metrics

### 4. Use Inference Service

```python
from app.services.tire_wear_predictor_physics import predict_tire_wear_physics

result = predict_tire_wear_physics(
    features={
        'total_brake_energy': 1500.0,
        'total_cornering_energy': 800.0,
        'avg_speed': 120.0,
        'peak_speed': 140.0,
        'mean_tire_temp': 85.0,
        'tire_temp_rise': 5.0,
        'mean_tire_stress': 2.5,
        'dt_total': 120.0,
        'n_samples': 6000
    },
    track='sebring'
)

print(f"Laps until cliff: {result['laps_until_cliff']:.1f}")
print(f"Confidence: {result['confidence']:.2f}")
print(f"Top contributing features: {[f['name'] for f in result['top_features']]}")
```

## Features

### Computed Features

Per-lap aggregates computed by `precompute_features.py`:

- `total_brake_energy` - Integrated brake work (brake_pressure × speed × dt)
- `total_cornering_energy` - Lateral acceleration energy (accy² × dt)
- `avg_speed` - Mean speed over lap
- `peak_speed` - Maximum speed
- `mean_tire_temp` - Average tire temperature across all wheels
- `tire_temp_rise` - Temperature increase over lap
- `mean_tire_stress` - Combined stress proxy (ax² + ay² + steering²)
- `dt_total` - Total lap time
- `n_samples` - Number of telemetry samples

### Labels

The training script creates labels for `laps_until_cliff`:

- **Definition**: Number of laps until lap time increases by >0.5s sustained for 2 laps
- **Fallback**: If lap times unavailable, uses rising tire stress trend

## Model Architecture

### Physics Baseline

Simple Ridge regression:
```
wear_phys = α × brake_energy + β × cornering_energy + γ × avg_speed + δ × temp_rise
```

Coefficients are learned from data but constrained to be interpretable.

### Residual Model

LightGBM gradient boosting:
- Predicts residual = `wear_true - wear_phys`
- Captures non-linear effects, compound chemistry, track-specific features
- Final prediction: `wear_pred = wear_phys + residual_pred`

### TCN Sequence Model (Optional)

Temporal Convolutional Network:
- Processes sliding windows of 8 consecutive laps
- Captures temporal patterns in wear progression
- Can replace or complement LightGBM residual

## Evaluation Metrics

Cross-validation reports:
- **RMSE** (Root Mean Squared Error) of `laps_until_cliff`
- **MAE** (Mean Absolute Error)
- Per-track breakdowns

Target: 95%+ accuracy (defined as RMSE < 5% of mean label value, or R² > 0.95)

## Uncertainty Quantification

The inference service provides:
- **Confidence intervals** (5th and 95th percentiles) via bootstrap sampling
- **Confidence score** (0-1) based on CI width
- **Feature importance** via ablation analysis

## Integration with API

The inference service can be integrated into FastAPI endpoints:

```python
from app.services.tire_wear_predictor_physics import predict_tire_wear_physics
from fastapi import APIRouter

router = APIRouter()

@router.post("/api/tire-wear/predict")
async def predict_tire_wear(features: dict):
    result = predict_tire_wear_physics(features)
    return {
        "insight_id": generate_id(),
        "predictions": {
            "laps_until_cliff": result["laps_until_cliff"],
            "confidence": result["confidence"],
            "ci_lower": result["ci_5"],
            "ci_upper": result["ci_95"]
        },
        "explanation": {
            "top_features": result["top_features"],
            "physics_baseline": result["physics_baseline"],
            "residual": result["residual"]
        },
        "model_version": result["model_version"]
    }
```

## Model Files

### Model Bundle (`tire-v1.0.pkl`)

Joblib-serialized dictionary containing:
- `phys_model` - Scikit-learn Ridge model
- `residual_model_lgb` - LightGBM Booster
- `feature_columns` - List of feature names
- `model_name` - Model identifier
- `created_at` - Timestamp
- `metrics` - CV metrics
- `tcn_path` - Optional path to TCN weights

### Manifest (`manifest.json`)

JSON metadata:
```json
{
  "model_name": "tire-v1.0",
  "created_at": "2024-01-15T10:30:00Z",
  "model_file": "models/tire-v1.0.pkl",
  "metrics": {
    "rmse_mean": 2.5,
    "rmse_std": 0.3,
    "mae_mean": 1.8
  },
  "feature_columns": [...]
}
```

## Advanced Usage

### Per-Track Fine-Tuning

Train base model on multi-track data, then fine-tune per-track:

```python
# Train base model
python app/models/train_tire_model.py --data-dir data/precomputed --out-dir models/base

# Fine-tune for specific track
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models/sebring \
  --model-name tire-sebring-v1.0 \
  --filter-track sebring
```

### Simulation Augmentation

Generate synthetic stints using vehicle dynamics simulator to learn rare events (lockups, temp spikes).

### Ensemble Predictions

Combine multiple models for improved accuracy:

```python
models = ['tire-v1.0.pkl', 'tire-v1.1.pkl', 'tire-tcn-v1.0.pkl']
predictions = [predict_tire_wear_physics(features, model_path=m) for m in models]
ensemble_pred = np.median([p['pred_median'] for p in predictions])
```

## Troubleshooting

### Model Not Found

If model file is missing, the service falls back to dummy predictions. Check:
- Model path in environment variable `TIRE_MODEL_PATH`
- Model file exists at specified path
- Permissions to read model file

### Feature Mismatch

Ensure input features match model's `feature_columns`. Missing features are set to 0.0.

### Low Accuracy

To improve accuracy:
1. Increase training data (more tracks, more stints)
2. Fine-tune per-track models
3. Add simulation-augmented data
4. Use TCN for temporal patterns
5. Ensemble multiple models

## References

- Physics-informed neural networks (PINNs) for wear modeling
- Temporal Convolutional Networks for sequence prediction
- LightGBM for gradient boosting
- Bootstrap methods for uncertainty quantification



