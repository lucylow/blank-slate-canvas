"""
Physics-informed tire wear prediction service with explainability.

This service loads the physics-informed residual model trained by train_tire_model.py
and provides predictions with confidence intervals and feature importance.

Usage:
    from app.services.tire_wear_predictor_physics import predict_tire_wear_physics
    
    result = predict_tire_wear_physics(
        features={
            'total_brake_energy': 1500.0,
            'total_cornering_energy': 800.0,
            'avg_speed': 120.0,
            'mean_tire_temp': 85.0,
            'tire_temp_rise': 5.0,
            'mean_tire_stress': 2.5
        },
        track='sebring'
    )
"""

import os
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pathlib import Path

logger = logging.getLogger(__name__)

# Default model path
MODEL_PATH = os.getenv("TIRE_MODEL_PATH", "models/tire-v1.0.pkl")
MANIFEST_PATH = os.getenv("TIRE_MANIFEST_PATH", "models/manifest.json")

# Global model cache
_model_bundle = None
_manifest = None


def load_model(model_path: str = None) -> Dict:
    """Load the physics-informed model bundle."""
    global _model_bundle
    if _model_bundle is not None:
        return _model_bundle
    
    path = model_path or MODEL_PATH
    if not os.path.exists(path):
        logger.warning(f"Model file not found: {path}. Using dummy model.")
        return None
    
    try:
        _model_bundle = joblib.load(path)
        logger.info(f"✓ Loaded physics-informed model: {path}")
        return _model_bundle
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None


def load_manifest(manifest_path: str = None) -> Dict:
    """Load model manifest with metadata."""
    global _manifest
    if _manifest is not None:
        return _manifest
    
    path = manifest_path or MANIFEST_PATH
    if not os.path.exists(path):
        logger.warning(f"Manifest not found: {path}")
        return {}
    
    try:
        import json
        with open(path, 'r') as f:
            _manifest = json.load(f)
        return _manifest
    except Exception as e:
        logger.error(f"Failed to load manifest: {e}")
        return {}


def ablation_top_features(predict_fn, X_row: pd.DataFrame, feature_names: List[str], 
                         baseline_pred: float = None, topk: int = 3) -> List[Dict]:
    """
    Simple ablation: for each feature, replace with median and measure delta in prediction.
    
    Args:
        predict_fn: function that takes DataFrame and returns scalar prediction
        X_row: single-row DataFrame with features
        feature_names: list of feature column names
        baseline_pred: baseline prediction (computed if None)
        topk: number of top features to return
    
    Returns:
        List of dicts with 'name', 'value', 'weight', 'short_text'
    """
    if baseline_pred is None:
        baseline_pred = float(predict_fn(X_row))
    
    deltas = []
    medians = X_row.median()
    
    for col in feature_names:
        if col not in X_row.columns:
            continue
        Xc = X_row.copy()
        Xc[col] = medians[col]
        p = predict_fn(Xc)
        delta = abs(float(baseline_pred) - float(p))
        deltas.append((col, delta))
    
    deltas.sort(key=lambda x: x[1], reverse=True)
    top = [{'name': k, 'value': v, 'short_text': k.replace('_', ' ')} for k, v in deltas[:topk]]
    
    # normalize values to sum=1
    s = sum(x['value'] for x in top) or 1.0
    for x in top:
        x['weight'] = x['value'] / s
    
    return top


def predict_with_uncertainty(model_bundle: Dict, X: pd.DataFrame, n_samples: int = 25) -> Tuple[float, float, float]:
    """
    Predict with uncertainty estimation using bootstrap or ensemble.
    
    Returns:
        (median, ci_5, ci_95)
    """
    # Simple approach: add small noise to features and predict multiple times
    predictions = []
    
    for _ in range(n_samples):
        # Add small Gaussian noise (1% std)
        X_noisy = X.copy()
        for col in X.columns:
            std = X[col].std() if X[col].std() > 0 else abs(X[col].iloc[0]) * 0.01
            X_noisy[col] = X[col] + np.random.normal(0, std * 0.01)
        
        pred = _predict_single(model_bundle, X_noisy)
        predictions.append(pred)
    
    predictions = np.array(predictions)
    median = float(np.median(predictions))
    ci_5 = float(np.percentile(predictions, 5))
    ci_95 = float(np.percentile(predictions, 95))
    
    return median, ci_5, ci_95


def _predict_single(model_bundle: Dict, X: pd.DataFrame) -> float:
    """Single prediction using physics + residual model."""
    if model_bundle is None:
        # Dummy fallback
        return 20.0
    
    phys_model = model_bundle.get('phys_model')
    residual_model = model_bundle.get('residual_model_lgb')
    feature_cols = model_bundle.get('feature_columns', [])
    
    # Ensure X has correct columns
    X_aligned = pd.DataFrame(index=X.index)
    for col in feature_cols:
        if col in X.columns:
            X_aligned[col] = X[col]
        else:
            X_aligned[col] = 0.0
    
    # Physics baseline prediction
    y_phys = phys_model.predict(X_aligned.values)[0]
    
    # Residual prediction
    if residual_model is not None:
        # LightGBM booster
        res_pred = residual_model.predict(X_aligned.values)[0]
    else:
        res_pred = 0.0
    
    # Combined prediction
    y_pred = y_phys + res_pred
    
    return float(y_pred)


def predict_tire_wear_physics(
    features: Dict[str, float],
    track: Optional[str] = None,
    model_path: Optional[str] = None,
    bootstrap_N: int = 25
) -> Dict:
    """
    Predict tire degradation with physics-informed model.
    
    Args:
        features: dict of telemetry features. Required keys:
            - total_brake_energy
            - total_cornering_energy
            - avg_speed
            - peak_speed (optional)
            - mean_tire_temp
            - tire_temp_rise
            - mean_tire_stress
            - dt_total (optional)
            - n_samples (optional)
        track: optional track name for per-track model selection
        model_path: optional path to model file
        bootstrap_N: number of bootstrap samples for CI estimation
    
    Returns:
        {
            "pred_median": float,
            "ci_5": float,
            "ci_95": float,
            "laps_until_cliff": float,
            "confidence": float (0-1),
            "top_features": [{"name": str, "value": float, "weight": float, "short_text": str}, ...],
            "physics_baseline": float,
            "residual": float,
            "model_version": str
        }
    """
    # Load model
    model_bundle = load_model(model_path)
    manifest = load_manifest()
    
    if model_bundle is None:
        # Fallback to dummy prediction
        logger.warning("Using dummy prediction (model not loaded)")
        return {
            "pred_median": 20.0,
            "ci_5": 15.0,
            "ci_95": 25.0,
            "laps_until_cliff": 20.0,
            "confidence": 0.5,
            "top_features": [],
            "physics_baseline": 0.0,
            "residual": 0.0,
            "model_version": "dummy"
        }
    
    # Get feature columns from model
    feature_cols = model_bundle.get('feature_columns', [
        'total_brake_energy', 'total_cornering_energy', 'avg_speed', 'peak_speed',
        'mean_tire_temp', 'tire_temp_rise', 'mean_tire_stress', 'dt_total', 'n_samples'
    ])
    
    # Build feature DataFrame
    X_row = pd.DataFrame([{
        col: features.get(col, 0.0) for col in feature_cols
    }])
    
    # Ensure numeric
    for col in feature_cols:
        X_row[col] = pd.to_numeric(X_row[col], errors='coerce').fillna(0.0)
    
    # Predict with uncertainty
    pred_median, ci_5, ci_95 = predict_with_uncertainty(model_bundle, X_row, n_samples=bootstrap_N)
    
    # Get physics baseline and residual for explainability
    phys_model = model_bundle.get('phys_model')
    residual_model = model_bundle.get('residual_model_lgb')
    
    X_aligned = pd.DataFrame(index=X_row.index)
    for col in feature_cols:
        if col in X_row.columns:
            X_aligned[col] = X_row[col]
        else:
            X_aligned[col] = 0.0
    
    physics_baseline = float(phys_model.predict(X_aligned.values)[0])
    residual = float(residual_model.predict(X_aligned.values)[0]) if residual_model else 0.0
    
    # Feature importance via ablation
    def predict_fn(X):
        return _predict_single(model_bundle, X)
    
    top_features = ablation_top_features(
        predict_fn, X_row, feature_cols, 
        baseline_pred=pred_median, topk=5
    )
    
    # Confidence based on CI width (narrower = more confident)
    ci_width = ci_95 - ci_5
    # Normalize confidence (0.5 to 1.0) based on CI width
    # Assuming typical range is 0-50 laps, normalize accordingly
    max_ci_width = 20.0  # reasonable max
    confidence = max(0.5, min(1.0, 1.0 - (ci_width / max_ci_width)))
    
    # Model version
    model_version = manifest.get('model_name', model_bundle.get('model_name', 'unknown'))
    
    return {
        "pred_median": pred_median,
        "ci_5": ci_5,
        "ci_95": ci_95,
        "laps_until_cliff": pred_median,
        "confidence": confidence,
        "top_features": top_features,
        "physics_baseline": physics_baseline,
        "residual": residual,
        "model_version": model_version
    }


def get_model_info(model_path: Optional[str] = None) -> Dict:
    """Get model metadata and metrics."""
    manifest = load_manifest()
    model_bundle = load_model(model_path)
    
    info = {
        "model_name": manifest.get("model_name", "unknown"),
        "created_at": manifest.get("created_at", "unknown"),
        "metrics": manifest.get("metrics", {}),
        "feature_columns": manifest.get("feature_columns", []),
        "loaded": model_bundle is not None
    }
    
    return info

