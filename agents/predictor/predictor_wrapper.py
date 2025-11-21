# predictor_wrapper.py
# Wrapper for Predictor Agent to use fe_lib.py for feature engineering
# This integrates the improved preprocessor aggregates with the predictor

import os, sys
import json
import numpy as np

# Add parent directory to path to import fe_lib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fe_lib import prepare_features_for_model, load_track_sectors

def features_from_task(task):
    """
    Extract feature vector from aggregate_window task.
    
    Args:
        task: dict with 'payload' containing aggregate data from preprocessor_v2
        
    Returns:
        numpy array of features ready for model prediction
    """
    agg = task.get('payload', {})
    vec = prepare_features_for_model(agg)
    return vec

def features_from_aggregate(agg):
    """
    Extract feature vector directly from aggregate dict.
    
    Args:
        agg: dict with 'perSector' or 'per_sector' containing sector aggregates
        
    Returns:
        numpy array of features ready for model prediction
    """
    vec = prepare_features_for_model(agg)
    return vec

def get_feature_names(track_sectors=None, track='cota'):
    """
    Generate feature names in the same order as prepare_features_for_model.
    Useful for SHAP explainability.
    
    Args:
        track_sectors: dict of track sector data (optional, will load if None)
        track: track name to determine number of sectors
        
    Returns:
        list of feature names
    """
    if track_sectors is None:
        track_sectors = load_track_sectors()
    
    meta = track_sectors.get(track, {})
    sectors = meta.get('sectors', [])
    num_sectors = len(sectors) if sectors else 3
    
    feature_names = []
    for s in range(num_sectors):
        feature_names.extend([
            f'tire_stress_s{s}',
            f'avg_speed_s{s}',
            f'max_lat_g_s{s}',
            f'brake_energy_s{s}'
        ])
    
    return feature_names

# Example usage in predictor_agent.py:
"""
from predictor_wrapper import features_from_task, get_feature_names

def predict_feature_vector(task):
    # Extract features from aggregate_window task
    features = features_from_task(task)
    
    # Get feature names for explainability
    feature_names = get_feature_names(track=task.get('track', 'cota'))
    
    # Make prediction
    pred = model.predict([features])[0]
    
    # For SHAP explainability
    if hasattr(model, 'predict_proba'):
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values([features])
        top_features = sorted(
            zip(feature_names, shap_values[0]),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:5]
    else:
        top_features = []
    
    return {
        'prediction': pred,
        'top_features': [{'name': n, 'value': v} for n, v in top_features]
    }
"""

