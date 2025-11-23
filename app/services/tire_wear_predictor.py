# app/services/tire_wear_predictor.py

"""
Tire wear prediction with explainability and confidence intervals.

Why: Nelson wants actionable insights; Marc wants uncertainty quantification.

"""



import numpy as np

import joblib

import os

import sys

import logging

from typing import Dict, List, Optional

from pathlib import Path



logger = logging.getLogger(__name__)



MODEL_PATH = os.getenv("MODEL_PATH", "/app/models/demo_tire_model.pkl")



# Try to load model; use dummy fallback if not available

model = None

try:

    if os.path.exists(MODEL_PATH):

        model = joblib.load(MODEL_PATH)

        logger.info(f"✓ Model loaded: {MODEL_PATH}")

except Exception as e:

    logger.warning(f"⚠ Could not load model: {e}, using demo mode")



def predict_tire_wear(

    features: Dict[str, float],

    bootstrap_N: int = 25,

    track: str = None

) -> Dict:

    """

    Predict tire degradation with confidence intervals and feature importance.

    

    Args:

        features: dict of telemetry features (speed_kmh, lat_g, lon_g, etc.)

        bootstrap_N: number of bootstrap samples for CI estimation

        track: optional track name for per-track model selection

    

    Returns:

        {

            "pred_median": float,

            "ci_5": float (5th percentile),

            "ci_95": float (95th percentile),

            "top_features": [{"name": str, "value": float}, ...],

            "laps_until_cliff": float,

            "confidence": 0-1

        }

    """

    

    # Prepare feature array (ensure consistent ordering)

    feature_keys = sorted(features.keys())

    try:

        X = np.array([features.get(k, 0.0) for k in feature_keys]).reshape(1, -1)

    except Exception as e:

        logger.error(f"Feature preparation error: {e}")

        return {"error": str(e), "pred_median": 3.0}

    

    # Generate predictions with bootstrap for uncertainty

    preds = []

    

    if model is None:

        # Demo mode: generate synthetic but realistic predictions

        base_pred = 3.0 + np.random.normal(0, 0.5)

        preds = [base_pred + np.random.normal(0, 0.1) for _ in range(bootstrap_N)]

    else:

        # Real model predictions with noise injection

        for i in range(bootstrap_N):

            try:

                # Add small noise to features (dropout-like regularization)

                noise = np.random.normal(0, 0.01, size=X.shape)

                pred_val = model.predict(X + noise)[0]

                preds.append(float(pred_val))

            except Exception as e:

                logger.warning(f"Prediction error on sample {i}: {e}")

                preds.append(3.0)

    

    preds = np.array(preds)

    median_pred = float(np.median(preds))

    ci_5 = float(np.percentile(preds, 5))

    ci_95 = float(np.percentile(preds, 95))

    

    # Feature importance via ablation: measure impact of zeroing each feature

    importance = {}

    

    for idx, feat_name in enumerate(feature_keys):

        X_ablated = X.copy()

        X_ablated[0, idx] = 0  # Zero out this feature

        

        try:

            if model is not None:

                ablated_pred = float(model.predict(X_ablated)[0])

            else:

                ablated_pred = median_pred * (0.9 + 0.1 * np.random.random())

            

            # Importance = drop in prediction when feature is removed

            importance[feat_name] = abs(median_pred - ablated_pred)

        except Exception:

            importance[feat_name] = 0.0

    

    # Normalize importances and pick top 3

    total_importance = sum(importance.values()) or 1.0

    top_features = sorted(

        [{"name": k, "value": v / total_importance} for k, v in importance.items()],

        key=lambda x: -x["value"]

    )[:3]

    

    # Confidence: inverse of CI width (narrower CI = higher confidence)

    ci_width = ci_95 - ci_5

    confidence = 1.0 - min(0.5, ci_width / 10.0)  # Normalize to 0-1

    

    return {

        "pred_median": median_pred,

        "ci_5": ci_5,

        "ci_95": ci_95,

        "laps_until_cliff": median_pred,

        "top_features": top_features,

        "confidence": confidence,

        "bootstrap_samples": bootstrap_N,

        "track": track

    }



def features_from_aggregate(agg: Dict, include_advanced: bool = True) -> Dict[str, float]:
    """
    Convert aggregate data (from preprocessor_v2) to feature dict for prediction.
    Uses enhanced features from fe_lib if available.
    
    Args:
        agg: aggregate dict with 'perSector' or 'per_sector' data
        include_advanced: if True, include advanced features
        
    Returns:
        dict of feature name -> value
    """
    try:
        # Try to use fe_lib for enhanced feature extraction
        agents_dir = Path(__file__).parent.parent.parent / "agents" / "predictor"
        if str(agents_dir) not in sys.path:
            sys.path.insert(0, str(agents_dir))
        
        from predictor_wrapper import prepare_features_for_model, get_feature_names
        
        # Get feature vector and names
        vec = prepare_features_for_model(agg, include_advanced=include_advanced)
        track = agg.get("track", "cota")
        feature_names = get_feature_names(track=track, include_advanced=include_advanced)
        
        # Convert to dict
        if len(feature_names) == len(vec):
            return dict(zip(feature_names, vec.tolist() if hasattr(vec, 'tolist') else list(vec)))
    except Exception as e:
        logger.warning(f"Enhanced feature extraction failed, using fallback: {e}", exc_info=True)
    
    # Fallback: extract basic features from aggregate
    features = {}
    per_sector = agg.get("perSector", agg.get("per_sector", {}))
    
    for sector_idx, sector_data in per_sector.items():
        s = str(sector_idx)
        features[f"tire_stress_s{s}"] = sector_data.get("tire_stress_sum", 0.0)
        features[f"avg_speed_s{s}"] = sector_data.get("avg_speed", 0.0)
        features[f"max_lat_g_s{s}"] = sector_data.get("max_lat_g", 0.0)
        features[f"brake_energy_s{s}"] = sector_data.get("brake_energy", 0.0)
        
        if include_advanced:
            features[f"avg_tire_stress_s{s}"] = sector_data.get("avg_tire_stress", 0.0)
            features[f"speed_std_s{s}"] = sector_data.get("speed_std", 0.0)
            features[f"lat_g_consistency_s{s}"] = sector_data.get("lat_g_consistency", 0.0)
    
    return features


def predict_with_sector_breakdown(

    sector_features: Dict[str, Dict[str, float]]

) -> Dict:

    """

    Predict tire wear per sector and aggregate.

    

    Args:

        sector_features: {

            "S1": {"speed_kmh": 200, "lat_g": 0.8, ...},

            "S2": {...},

            "S3": {...}

        }

    
        
        Returns:

        {

            "overall": {...prediction result...},

            "by_sector": {

                "S1": {...},

                "S2": {...},

                "S3": {...}

            }

        }

    """

    

    sector_preds = {}

    overall_stress = []

    

    for sector_name, features in sector_features.items():

        pred = predict_tire_wear(features)

        sector_preds[sector_name] = pred

        overall_stress.append(pred.get("pred_median", 3.0))

    

    # Aggregate: average of sector predictions

    overall_pred = np.mean(overall_stress) if overall_stress else 3.0

    

    return {

        "overall_laps_until_cliff": float(overall_pred),

        "by_sector": sector_preds,

        "sector_names": list(sector_features.keys())

    }
