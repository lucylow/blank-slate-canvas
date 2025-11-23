# Tire Wear Prediction Implementation Summary

## Files Created

### 1. Feature Precomputation (`app/data/precompute_features.py`)
- Extracts telemetry from archives (tar.gz)
- Computes per-sample derived features (brake energy, cornering energy, tire stress)
- Aggregates to per-lap and per-sector levels
- Outputs Parquet files per track

**Usage:**
```bash
python app/data/precompute_features.py \
  --archive file:///path/to/pitwall-backend-v2.tar.gz \
  --out-dir data/precomputed
```

### 2. TCN Residual Model (`app/models/tcn_residual.py`)
- PyTorch-based Temporal Convolutional Network
- Processes sequence windows of aggregated features
- Predicts residual wear beyond physics baseline
- Compact architecture (~100k parameters)

### 3. Training Script (`app/models/train_tire_model.py`)
- Trains physics baseline (Ridge regression)
- Trains ML residual model (LightGBM)
- Optional TCN sequence model training
- Cross-validation with metrics reporting
- Outputs model bundle and manifest.json

**Usage:**
```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v1.0 \
  --cv-folds 5
```

### 4. Inference Service (`app/services/tire_wear_predictor_physics.py`)
- Loads trained model bundles
- Computes physics + residual predictions
- Uncertainty quantification (bootstrap CI)
- Feature importance via ablation
- Returns structured prediction results

**Usage:**
```python
from app.services.tire_wear_predictor_physics import predict_tire_wear_physics

result = predict_tire_wear_physics(
    features={
        'total_brake_energy': 1500.0,
        'total_cornering_energy': 800.0,
        'avg_speed': 120.0,
        'mean_tire_temp': 85.0,
        'tire_temp_rise': 5.0,
        'mean_tire_stress': 2.5
    }
)
```

### 5. Documentation (`docs/tire-wear-prediction.md`)
- Complete usage guide
- Architecture explanation
- Integration examples
- Troubleshooting tips

### 6. Updated Dependencies (`requirements.txt`)
- Added `lightgbm>=4.0.0`
- Added `pyarrow>=12.0.0`
- Added `torch>=1.10.0` (optional)

## Model Architecture

### Physics Baseline
```
wear_phys = α × brake_energy + β × cornering_energy + γ × avg_speed + δ × temp_rise
```
- Ridge regression with interpretable coefficients
- Provides correct long-term trends

### Residual Model
- LightGBM gradient boosting
- Predicts: `residual = wear_true - wear_phys`
- Captures non-linear effects, compound chemistry, track features
- Final: `wear_pred = wear_phys + residual_pred`

### Optional TCN
- Temporal Convolutional Network for sequence patterns
- Processes sliding windows of 8 consecutive laps
- Can replace or complement LightGBM

## Output Format

### Model Bundle (`models/tire-v1.0.pkl`)
```python
{
    'phys_model': Ridge(...),
    'residual_model_lgb': lgb.Booster(...),
    'feature_columns': [...],
    'model_name': 'tire-v1.0',
    'created_at': '2024-01-15T10:30:00Z',
    'metrics': {'rmse_mean': 2.5, ...},
    'tcn_path': 'models/tire-v1.0-tcn.pth'  # optional
}
```

### Prediction Result
```python
{
    'pred_median': 20.5,
    'ci_5': 18.0,
    'ci_95': 23.0,
    'laps_until_cliff': 20.5,
    'confidence': 0.85,
    'top_features': [
        {'name': 'total_brake_energy', 'value': 0.35, 'weight': 0.4, 'short_text': 'total brake energy'},
        ...
    ],
    'physics_baseline': 18.2,
    'residual': 2.3,
    'model_version': 'tire-v1.0'
}
```

## Next Steps

1. **Extract and precompute features** from your telemetry archive
2. **Train initial model** on available data
3. **Evaluate metrics** - aim for RMSE < 5% of mean label value
4. **Fine-tune per-track** if needed
5. **Integrate into API** endpoints
6. **Monitor and retrain** as new data arrives

## Performance Targets

- **95%+ accuracy**: RMSE < 5% of mean `laps_until_cliff`, or R² > 0.95
- **Inference latency**: <50ms per prediction
- **Calibration**: 80% of true values within 80% CI

## Integration Points

The inference service can be integrated into:
- FastAPI endpoints (`/api/tire-wear/predict`)
- Redis Streams for real-time predictions
- Background workers for batch processing
- Frontend dashboards for visualization

See `docs/tire-wear-prediction.md` for detailed integration examples.

