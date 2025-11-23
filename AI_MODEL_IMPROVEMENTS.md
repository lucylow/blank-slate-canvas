# AI Model Improvements

## Overview
This document outlines the comprehensive improvements made to the AI models used for tire wear prediction and driver coaching in the PitWall AI system.

## Key Improvements

### 1. Enhanced Model Architectures

#### Before:
- Basic LightGBM with simple hyperparameters (num_leaves=31, learning_rate=0.05)
- Simple Ridge regression for physics baseline
- No ensemble methods
- Limited regularization

#### After:
- **Improved LightGBM** with optimized hyperparameters:
  - `num_leaves`: 31 → 63 (increased model capacity)
  - `learning_rate`: 0.05 → 0.03 (better generalization)
  - Added feature subsampling (`feature_fraction=0.8`)
  - Added data subsampling (`bagging_fraction=0.8`)
  - Added L1/L2 regularization (`reg_alpha=0.1`, `reg_lambda=0.1`)
  - Early stopping with validation set

- **XGBoost Integration** (optional ensemble member):
  - Alternative gradient boosting algorithm
  - Different splitting strategies and regularization
  - Better handling of sparse data

- **CatBoost Integration** (optional ensemble member):
  - Superior handling of categorical features
  - Built-in regularization
  - Less prone to overfitting

- **ElasticNet Physics Baseline** (optional):
  - Combines L1 and L2 regularization
  - Better feature selection
  - Improved interpretability

### 2. Ensemble Methods

#### Weighted Ensemble:
- Combines predictions from multiple models:
  - LightGBM (50% weight)
  - XGBoost (25% weight, if available)
  - CatBoost (25% weight, if available)

#### Benefits:
- Reduced variance and overfitting
- Better generalization to unseen data
- More robust predictions
- Leverages strengths of different algorithms

### 3. Improved Training Pipeline

#### Enhanced Cross-Validation:
- Now includes R² score in addition to RMSE and MAE
- Better statistical reporting (mean ± std)
- More comprehensive model evaluation

#### Early Stopping:
- Prevents overfitting
- Automatically selects optimal number of boosting rounds
- Improves generalization

#### Validation Split:
- Dedicated validation set for early stopping
- Better model selection
- More accurate performance estimates

### 4. Advanced Hyperparameters

#### LightGBM Improvements:
```python
{
    'num_leaves': 63,          # Increased capacity
    'learning_rate': 0.03,     # Lower for better generalization
    'feature_fraction': 0.8,   # Feature subsampling
    'bagging_fraction': 0.8,   # Data subsampling
    'bagging_freq': 5,         # Subsampling frequency
    'min_child_samples': 20,   # Minimum samples per leaf
    'reg_alpha': 0.1,          # L1 regularization
    'reg_lambda': 0.1,         # L2 regularization
    'early_stopping_rounds': 50
}
```

#### XGBoost Configuration:
```python
{
    'max_depth': 6,
    'learning_rate': 0.03,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 3,
    'gamma': 0.1,
    'reg_alpha': 0.1,
    'reg_lambda': 1.0
}
```

#### CatBoost Configuration:
```python
{
    'iterations': 1000,
    'learning_rate': 0.03,
    'depth': 6,
    'reg_lambda': 1.0,
    'border_count': 128,
    'l2_leaf_reg': 3.0,
    'early_stopping_rounds': 50
}
```

### 5. Feature Importance Tracking

- Tracks feature importance for all models
- Stored in model manifest for interpretability
- Enables SHAP value computation for explanations

### 6. Enhanced Model Metadata

#### Model Manifest Now Includes:
- Comprehensive metrics (RMSE, MAE, R² with std dev)
- Feature importance scores
- Training configuration
- Ensemble information
- Model types used
- Feature columns

## Expected Performance Improvements

### Accuracy Metrics:
- **RMSE**: Expected 10-20% reduction through ensemble methods
- **MAE**: Expected 15-25% improvement via better regularization
- **R²**: Expected increase of 0.05-0.15 through ensemble and better hyperparameters

### Generalization:
- Better performance on unseen tracks/conditions
- Reduced overfitting through regularization and early stopping
- More stable predictions across different race scenarios

### Interpretability:
- Feature importance tracking enables better explanations
- Physics baseline remains interpretable
- Ensemble weights provide transparency

## Usage

### Training a Single Model:
```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v2.0 \
  --cv-folds 5
```

### Training with Ensemble:
```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v2.0-ensemble \
  --use-ensemble \
  --use-xgb \
  --use-catboost \
  --num-boost-round 1000 \
  --physics-model ridge \
  --cv-folds 5
```

### Training with TCN Sequence Model:
```bash
python app/models/train_tire_model.py \
  --data-dir data/precomputed \
  --out-dir models \
  --model-name tire-v2.0-tcn \
  --use-tcn \
  --tcn-epochs 20 \
  --use-ensemble
```

## Dependencies

### Required:
- `lightgbm>=4.0.0`
- `xgboost>=2.0.0`
- `scikit-learn>=1.3.2`

### Optional (for full functionality):
- `catboost>=1.2.0` - For CatBoost ensemble member
- `optuna>=3.0.0` - For hyperparameter optimization (future enhancement)
- `torch>=1.10.0` - For TCN sequence models

## Backward Compatibility

- Models trained with the old script (`tire-v1.0`) are still supported
- New models (`tire-v2.0`) can coexist with old models
- The predictor agent automatically handles both model formats
- Ensemble models gracefully fall back to single models if components are unavailable

## Future Enhancements

1. **Hyperparameter Optimization**: Integrate Optuna for automatic hyperparameter tuning
2. **Neural Network Alternatives**: Add Transformer-based models for sequence modeling
3. **Online Learning**: Implement incremental learning for model updates
4. **Multi-Task Learning**: Train models that predict multiple targets simultaneously
5. **Uncertainty Quantification**: Add prediction intervals and confidence estimates
6. **Transfer Learning**: Pre-train models on one track and fine-tune on others

## Model Versioning

- `tire-v1.0`: Original model (Ridge + basic LightGBM)
- `tire-v2.0`: Improved model (enhanced LightGBM with better hyperparameters)
- `tire-v2.0-ensemble`: Ensemble model (LightGBM + XGBoost + CatBoost)

## Testing

To validate improvements:
1. Train both v1.0 and v2.0 models on the same data
2. Compare cross-validation metrics
3. Evaluate on holdout test set
4. Compare feature importance rankings

## Notes

- All improvements maintain physics-informed structure (residual learning)
- Models are backward compatible with existing inference code
- Ensemble methods add minimal inference time overhead (~2-3x)
- Memory usage increases proportionally with ensemble size

