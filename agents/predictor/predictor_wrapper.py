# predictor_wrapper.py
# Wrapper for Predictor Agent to use fe_lib.py for feature engineering
# This integrates the improved preprocessor aggregates with the predictor

import os, sys
import json
import numpy as np

# Add parent directory to path to import fe_lib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fe_lib import prepare_features_for_model, load_track_sectors

def features_from_task(task, include_advanced=True):
    """
    Extract feature vector from aggregate_window task with enhanced features.
    
    Args:
        task: dict with 'payload' containing aggregate data from preprocessor_v2
        include_advanced: if True, include advanced features for better predictions
        
    Returns:
        numpy array of features ready for model prediction
    """
    agg = task.get('payload', {})
    vec = prepare_features_for_model(agg, include_advanced=include_advanced)
    return vec

def features_from_aggregate(agg, include_advanced=True):
    """
    Extract feature vector directly from aggregate dict with enhanced features.
    
    Args:
        agg: dict with 'perSector' or 'per_sector' containing sector aggregates
        include_advanced: if True, include advanced features for better predictions
        
    Returns:
        numpy array of features ready for model prediction
    """
    vec = prepare_features_for_model(agg, include_advanced=include_advanced)
    return vec

def get_feature_names(track_sectors=None, track='cota', include_advanced=True):
    """
    Generate feature names in the same order as prepare_features_for_model.
    Useful for SHAP explainability and model interpretation.
    
    Args:
        track_sectors: dict of track sector data (optional, will load if None)
        track: track name to determine number of sectors
        include_advanced: if True, include advanced feature names
        
    Returns:
        list of feature names
    """
    if track_sectors is None:
        track_sectors = load_track_sectors()
    
    meta = track_sectors.get(track, {})
    sectors = meta.get('sectors', [])
    num_sectors = len(sectors) if sectors else 3
    
    feature_names = []
    # Core features per sector
    for s in range(num_sectors):
        feature_names.extend([
            f'tire_stress_s{s}',
            f'avg_speed_s{s}',
            f'max_lat_g_s{s}',
            f'brake_energy_s{s}'
        ])
        
        # Advanced features per sector
        if include_advanced:
            feature_names.extend([
                f'avg_tire_stress_s{s}',
                f'max_tire_stress_s{s}',
                f'tire_stress_rate_s{s}',
                f'speed_std_s{s}',
                f'speed_cv_s{s}',
                f'avg_lat_g_s{s}',
                f'lat_g_consistency_s{s}',
                f'brake_frequency_s{s}',
                f'avg_brake_intensity_s{s}',
                f'avg_long_g_s{s}',
                f'cornering_efficiency_s{s}',
                f'energy_balance_s{s}'
            ])
    
    # Cross-sector features
    if include_advanced:
        feature_names.extend([
            'total_tire_stress',
            'max_sector_stress',
            'avg_lap_speed',
            'lap_speed_consistency',
            'total_brake_energy'
        ])
        
        # Sector transition features
        if num_sectors > 1:
            for i in range(num_sectors - 1):
                feature_names.append(f'stress_transition_s{i}_to_s{i+1}')
    
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

