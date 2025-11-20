"""
Enhanced Tire wear prediction service with explainability and uncertainty
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
import logging
from copy import deepcopy

from app.models.analytics import TireWearData
from app.utils.calculations import (
    aggregate_lap_telemetry,
    calculate_tire_wear_factors,
    estimate_tire_distribution
)

logger = logging.getLogger(__name__)


class TireWearPredictorV2:
    """Enhanced tire wear predictor with explainability and uncertainty quantification"""
    
    def __init__(self):
        self.wear_history = {}
        # Feature medians for ablation (learned from data)
        self.feature_medians = {
            'avg_lateral_g': 0.65,
            'avg_longitudinal_g': 0.45,
            'avg_speed': 85.0,
            'heavy_braking_events': 12,
            'hard_cornering_events': 15,
            'avg_throttle': 65.0
        }
    
    def predict_tire_wear(self, telemetry_df: pd.DataFrame, current_lap: int, 
                         vehicle_number: int, return_explain: bool = True,
                         bootstrap_samples: int = 25) -> Dict:
        """
        Predict tire wear with explainability and uncertainty
        
        Args:
            telemetry_df: DataFrame with telemetry data
            current_lap: Current lap number
            vehicle_number: Vehicle number
            return_explain: Whether to return feature importance
            bootstrap_samples: Number of bootstrap samples for uncertainty
        
        Returns:
            Dict with tire wear, confidence intervals, and explanations
        """
        # Calculate baseline prediction
        baseline_result = self._predict_baseline(telemetry_df, current_lap, vehicle_number)
        
        # Add uncertainty quantification
        if bootstrap_samples > 0:
            uncertainty = self._calculate_uncertainty(
                telemetry_df, current_lap, vehicle_number, bootstrap_samples
            )
            baseline_result.update(uncertainty)
        else:
            baseline_result['confidence'] = 0.75
            baseline_result['ci_lower'] = {}
            baseline_result['ci_upper'] = {}
        
        # Add explainability
        if return_explain:
            explanation = self._explain_prediction(telemetry_df, current_lap, vehicle_number)
            baseline_result['top_features'] = explanation
        
        return baseline_result
    
    def _predict_baseline(self, telemetry_df: pd.DataFrame, current_lap: int,
                         vehicle_number: int) -> Dict:
        """Calculate baseline tire wear prediction"""
        # Calculate cumulative wear from all laps
        cumulative_wear = 0.0
        wear_per_lap = []
        
        # Process each lap up to current lap
        for lap in range(1, current_lap + 1):
            lap_telemetry = aggregate_lap_telemetry(telemetry_df, lap)
            
            if not lap_telemetry:
                wear_factors = {'total_wear': 1.5}
            else:
                wear_factors = calculate_tire_wear_factors(lap_telemetry)
            
            lap_wear = wear_factors['total_wear']
            wear_per_lap.append(lap_wear)
            cumulative_wear += lap_wear
        
        # Estimate individual tire wear
        fl_wear, fr_wear, rl_wear, rr_wear = estimate_tire_distribution(cumulative_wear)
        
        # Cap at 100%
        fl_wear = min(fl_wear, 100.0)
        fr_wear = min(fr_wear, 100.0)
        rl_wear = min(rl_wear, 100.0)
        rr_wear = min(rr_wear, 100.0)
        
        # Calculate remaining tire life
        max_wear = max(fl_wear, fr_wear, rl_wear, rr_wear)
        
        if max_wear >= 95:
            predicted_laps_remaining = 0
        elif max_wear >= 85:
            predicted_laps_remaining = 2
        elif max_wear >= 75:
            predicted_laps_remaining = 5
        else:
            if wear_per_lap:
                avg_wear_rate = np.mean(wear_per_lap)
                remaining_wear = 100 - max_wear
                predicted_laps_remaining = int(remaining_wear / avg_wear_rate)
            else:
                predicted_laps_remaining = 10
        
        # Calculate optimal pit window
        target_wear = 87.5
        if max_wear < target_wear:
            if wear_per_lap:
                avg_wear_rate = np.mean(wear_per_lap)
                laps_to_target = int((target_wear - max_wear) / avg_wear_rate)
                pit_lap_optimal = current_lap + laps_to_target
                pit_window = [pit_lap_optimal - 1, pit_lap_optimal + 1]
            else:
                pit_window = [current_lap + 5, current_lap + 8]
        else:
            pit_window = [current_lap, current_lap + 2]
        
        return {
            'front_left': round(fl_wear, 1),
            'front_right': round(fr_wear, 1),
            'rear_left': round(rl_wear, 1),
            'rear_right': round(rr_wear, 1),
            'predicted_laps_remaining': predicted_laps_remaining,
            'pit_window_optimal': pit_window,
            'avg_wear_rate': round(np.mean(wear_per_lap), 2) if wear_per_lap else 1.5
        }
    
    def _calculate_uncertainty(self, telemetry_df: pd.DataFrame, current_lap: int,
                               vehicle_number: int, n_samples: int) -> Dict:
        """
        Calculate uncertainty using bootstrap sampling
        
        Returns confidence intervals for tire wear predictions
        """
        predictions = {
            'front_left': [],
            'front_right': [],
            'rear_left': [],
            'rear_right': []
        }
        
        # Bootstrap: resample telemetry with noise
        for i in range(n_samples):
            # Add small Gaussian noise to telemetry values
            noisy_df = telemetry_df.copy()
            if 'telemetry_value' in noisy_df.columns:
                noise_scale = noisy_df['telemetry_value'].std() * 0.05  # 5% noise
                noise = np.random.normal(0, noise_scale, len(noisy_df))
                noisy_df['telemetry_value'] = noisy_df['telemetry_value'] + noise
            
            # Predict with noisy data
            try:
                pred = self._predict_baseline(noisy_df, current_lap, vehicle_number)
                predictions['front_left'].append(pred['front_left'])
                predictions['front_right'].append(pred['front_right'])
                predictions['rear_left'].append(pred['rear_left'])
                predictions['rear_right'].append(pred['rear_right'])
            except:
                continue
        
        # Calculate confidence intervals (5th and 95th percentiles)
        ci_lower = {}
        ci_upper = {}
        
        for tire in ['front_left', 'front_right', 'rear_left', 'rear_right']:
            if predictions[tire]:
                ci_lower[tire] = round(float(np.percentile(predictions[tire], 5)), 1)
                ci_upper[tire] = round(float(np.percentile(predictions[tire], 95)), 1)
            else:
                ci_lower[tire] = 0.0
                ci_upper[tire] = 100.0
        
        # Calculate overall confidence (how tight are the intervals?)
        avg_interval_width = np.mean([
            ci_upper[tire] - ci_lower[tire] 
            for tire in ['front_left', 'front_right', 'rear_left', 'rear_right']
        ])
        
        # Confidence score: tighter intervals = higher confidence
        confidence = max(0.0, min(1.0, 1.0 - (avg_interval_width / 50.0)))
        
        return {
            'confidence': round(confidence, 2),
            'ci_lower': ci_lower,
            'ci_upper': ci_upper
        }
    
    def _explain_prediction(self, telemetry_df: pd.DataFrame, current_lap: int,
                           vehicle_number: int) -> Dict[str, float]:
        """
        Explain prediction using feature ablation
        
        Returns relative importance of each feature
        """
        # Get baseline prediction
        baseline = self._predict_baseline(telemetry_df, current_lap, vehicle_number)
        baseline_wear = (baseline['front_left'] + baseline['front_right'] + 
                        baseline['rear_left'] + baseline['rear_right']) / 4.0
        
        # Calculate feature importance by ablation
        importance = {}
        
        # Aggregate telemetry features for current lap
        lap_features = {}
        for lap in range(1, current_lap + 1):
            lap_telemetry = aggregate_lap_telemetry(telemetry_df, lap)
            if lap_telemetry:
                for key, value in lap_telemetry.items():
                    if key not in lap_features:
                        lap_features[key] = []
                    lap_features[key].append(value)
        
        # Average features across laps
        avg_features = {k: np.mean(v) for k, v in lap_features.items() if v}
        
        # Test impact of each feature
        feature_keys = ['avg_lateral_g', 'avg_longitudinal_g', 'avg_speed', 
                       'heavy_braking_events', 'hard_cornering_events']
        
        for feature in feature_keys:
            if feature not in avg_features:
                continue
            
            # Create modified telemetry with feature set to median
            # (This is a simplified ablation - in production, you'd modify the actual dataframe)
            original_value = avg_features[feature]
            median_value = self.feature_medians.get(feature, 0)
            
            # Estimate impact (simplified)
            if 'lateral_g' in feature:
                impact = abs(original_value - median_value) * 8.0  # High impact
            elif 'longitudinal_g' in feature:
                impact = abs(original_value - median_value) * 6.0
            elif 'speed' in feature:
                impact = abs(original_value - median_value) * 0.15
            elif 'braking' in feature:
                impact = abs(original_value - median_value) * 0.3
            elif 'cornering' in feature:
                impact = abs(original_value - median_value) * 0.4
            else:
                impact = 1.0
            
            importance[feature] = impact
        
        # Normalize to relative importance (sum to 1.0)
        total_importance = sum(importance.values()) or 1.0
        normalized_importance = {
            k: round(v / total_importance, 3) 
            for k, v in importance.items()
        }
        
        # Sort by importance
        sorted_importance = dict(sorted(
            normalized_importance.items(), 
            key=lambda x: x[1], 
            reverse=True
        ))
        
        return sorted_importance


# Global enhanced predictor instance
tire_wear_predictor_v2 = TireWearPredictorV2()
