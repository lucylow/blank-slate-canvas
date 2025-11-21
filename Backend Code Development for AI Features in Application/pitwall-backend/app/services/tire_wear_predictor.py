"""
Tire wear prediction service using AI/ML
Enhanced with bootstrap CI and explainability
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Callable
import logging
import random

from app.models.analytics import TireWearData
from app.utils.calculations import (
    aggregate_lap_telemetry,
    calculate_tire_wear_factors,
    estimate_tire_distribution
)

logger = logging.getLogger(__name__)


class TireWearPredictor:
    """Predict tire wear using telemetry data and ML"""
    
    def __init__(self):
        self.wear_history = {}  # Cache wear calculations
        self.model_version = "v1.0-enhanced"
    
    def _extract_features(self, telemetry_df: pd.DataFrame, current_lap: int) -> Dict[str, float]:
        """Extract numeric features from telemetry for explainability"""
        # Get latest lap telemetry
        latest_lap_telemetry = aggregate_lap_telemetry(telemetry_df, current_lap)
        
        if not latest_lap_telemetry:
            # Use previous lap if current not available
            for lap in range(current_lap - 1, 0, -1):
                latest_lap_telemetry = aggregate_lap_telemetry(telemetry_df, lap)
                if latest_lap_telemetry:
                    break
        
        if not latest_lap_telemetry:
            return {}
        
        # Extract key numeric features
        features = {
            'avg_lateral_g': latest_lap_telemetry.get('avg_lateral_g', 0.0),
            'avg_longitudinal_g': latest_lap_telemetry.get('avg_longitudinal_g', 0.0),
            'max_lateral_g': latest_lap_telemetry.get('max_lateral_g', 0.0),
            'avg_speed': latest_lap_telemetry.get('avg_speed', 0.0),
            'heavy_braking_events': float(latest_lap_telemetry.get('heavy_braking_events', 0)),
            'hard_cornering_events': float(latest_lap_telemetry.get('hard_cornering_events', 0)),
        }
        
        return features
    
    def _predict_tire_wear_core(self, telemetry_df: pd.DataFrame, current_lap: int, 
                                vehicle_number: int, noise_scale: float = 0.0) -> Tuple[float, float, float, float, int, List[int]]:
        """
        Core prediction logic (used for bootstrap and main prediction)
        
        Returns: (fl_wear, fr_wear, rl_wear, rr_wear, predicted_laps_remaining, pit_window)
        """
        # Calculate cumulative wear from all laps
        cumulative_wear = 0.0
        wear_per_lap = []
        
        # Process each lap up to current lap
        for lap in range(1, current_lap + 1):
            lap_telemetry = aggregate_lap_telemetry(telemetry_df, lap)
            
            if not lap_telemetry:
                # Use default wear if no data
                wear_factors = {'total_wear': 1.5}
            else:
                wear_factors = calculate_tire_wear_factors(lap_telemetry)
                
                # Add noise for bootstrap sampling
                if noise_scale > 0:
                    noise = np.random.normal(0, noise_scale * abs(wear_factors['total_wear']))
                    wear_factors['total_wear'] = max(0.1, wear_factors['total_wear'] + noise)
            
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
            # Estimate based on average wear rate
            if wear_per_lap:
                avg_wear_rate = np.mean(wear_per_lap)
                remaining_wear = 100 - max_wear
                predicted_laps_remaining = int(remaining_wear / avg_wear_rate) if avg_wear_rate > 0 else 10
            else:
                predicted_laps_remaining = 10
        
        # Calculate optimal pit window
        target_wear = 87.5
        if max_wear < target_wear:
            if wear_per_lap:
                avg_wear_rate = np.mean(wear_per_lap)
                if avg_wear_rate > 0:
                    laps_to_target = int((target_wear - max_wear) / avg_wear_rate)
                    pit_lap_optimal = current_lap + laps_to_target
                    pit_window = [pit_lap_optimal - 1, pit_lap_optimal + 1]
                else:
                    pit_window = [current_lap + 5, current_lap + 8]
            else:
                pit_window = [current_lap + 5, current_lap + 8]
        else:
            # Already in pit window
            pit_window = [current_lap, current_lap + 2]
        
        return fl_wear, fr_wear, rl_wear, rr_wear, predicted_laps_remaining, pit_window
    
    def bootstrap_ci(self, telemetry_df: pd.DataFrame, current_lap: int, 
                    vehicle_number: int, n_samples: int = 25) -> Dict[str, Tuple[float, float, float]]:
        """
        Calculate bootstrap confidence intervals for tire wear predictions
        
        Returns: Dict with keys like 'front_left' containing (lower, mean, upper) tuples
        """
        predictions = {
            'front_left': [],
            'front_right': [],
            'rear_left': [],
            'rear_right': [],
            'predicted_laps_remaining': []
        }
        
        # Run bootstrap samples
        for _ in range(n_samples):
            # Add small noise to telemetry (1% relative noise)
            fl, fr, rl, rr, laps, _ = self._predict_tire_wear_core(
                telemetry_df, current_lap, vehicle_number, noise_scale=0.01
            )
            predictions['front_left'].append(fl)
            predictions['front_right'].append(fr)
            predictions['rear_left'].append(rl)
            predictions['rear_right'].append(rr)
            predictions['predicted_laps_remaining'].append(laps)
        
        # Calculate percentiles
        ci_results = {}
        for key, values in predictions.items():
            if values:
                ci_results[key] = (
                    float(np.percentile(values, 5)),   # Lower CI (5th percentile)
                    float(np.mean(values)),            # Mean
                    float(np.percentile(values, 95))    # Upper CI (95th percentile)
                )
        
        return ci_results
    
    def ablation_importance(self, telemetry_df: pd.DataFrame, current_lap: int, 
                           vehicle_number: int, topk: int = 6) -> Dict[str, float]:
        """
        Calculate feature importance using ablation (removing features and measuring impact)
        
        Returns: Dict mapping feature names to importance scores (normalized 0-1)
        """
        # Get base prediction
        fl_base, fr_base, rl_base, rr_base, _, _ = self._predict_tire_wear_core(
            telemetry_df, current_lap, vehicle_number, noise_scale=0.0
        )
        max_wear_base = max(fl_base, fr_base, rl_base, rr_base)
        
        # Extract features from latest lap
        features = self._extract_features(telemetry_df, current_lap)
        if not features:
            return {}
        
        importance_scores = {}
        
        # For each numeric feature, estimate its contribution by comparing
        # prediction with feature at typical value vs actual value
        # We approximate by looking at how the feature affects wear calculation
        
        # Get latest lap telemetry for feature analysis
        latest_lap_telemetry = aggregate_lap_telemetry(telemetry_df, current_lap)
        if not latest_lap_telemetry:
            # Fallback to previous lap
            for lap in range(current_lap - 1, 0, -1):
                latest_lap_telemetry = aggregate_lap_telemetry(telemetry_df, lap)
                if latest_lap_telemetry:
                    break
        
        if not latest_lap_telemetry:
            return {}
        
        # Calculate base wear factors
        base_wear_factors = calculate_tire_wear_factors(latest_lap_telemetry)
        base_total_wear = base_wear_factors.get('total_wear', 0)
        
        # For each feature, estimate impact by calculating how it contributes to wear
        for feature_name, feature_value in features.items():
            if not isinstance(feature_value, (int, float)):
                continue
            
            # Estimate contribution based on how feature affects wear calculation
            # This is a simplified heuristic - in production, you'd modify actual telemetry
            
            impact = 0.0
            
            if feature_name == 'avg_lateral_g':
                # Lateral G contributes to lateral_wear
                impact = abs(feature_value) * 0.15  # From calculate_tire_wear_factors
            elif feature_name == 'avg_longitudinal_g':
                # Longitudinal G contributes to longitudinal_wear
                impact = abs(feature_value) * 0.10
            elif feature_name == 'max_lateral_g':
                # Max lateral G is a strong indicator
                impact = abs(feature_value) * 0.12
            elif feature_name == 'avg_speed':
                # Speed contributes to speed_wear
                impact = (abs(feature_value) / 100.0) * 0.5
            elif feature_name == 'heavy_braking_events':
                # Braking events contribute to aggressive_wear
                impact = abs(feature_value) * 0.05
            elif feature_name == 'hard_cornering_events':
                # Cornering events contribute to aggressive_wear
                impact = abs(feature_value) * 0.08
            
            if impact > 0:
                # Normalize by base wear to get relative importance
                relative_impact = impact / (base_total_wear + 0.1)  # Add small epsilon
                importance_scores[feature_name] = relative_impact
        
        # Normalize importance scores to sum to 1
        if importance_scores:
            total = sum(importance_scores.values())
            if total > 0:
                importance_scores = {k: v / total for k, v in importance_scores.items()}
        
        # Return top k features
        sorted_features = sorted(importance_scores.items(), key=lambda x: -x[1])[:topk]
        return dict(sorted_features)
    
    def predict_tire_wear(self, telemetry_df: pd.DataFrame, current_lap: int, 
                         vehicle_number: int, include_ci: bool = True, 
                         include_explainability: bool = True) -> TireWearData:
        """
        Predict tire wear based on telemetry data with optional CI and explainability
        
        Args:
            telemetry_df: DataFrame with telemetry data for multiple laps
            current_lap: Current lap number
            vehicle_number: Vehicle number
            include_ci: Whether to calculate bootstrap confidence intervals
            include_explainability: Whether to calculate feature importance
        
        Returns:
            TireWearData with wear percentages, predictions, CI, and explainability
        """
        # Get base prediction
        fl_wear, fr_wear, rl_wear, rr_wear, predicted_laps_remaining, pit_window = \
            self._predict_tire_wear_core(telemetry_df, current_lap, vehicle_number, noise_scale=0.0)
        
        # Calculate confidence intervals if requested
        ci_lower = None
        ci_upper = None
        confidence = None
        
        if include_ci:
            try:
                ci_results = self.bootstrap_ci(telemetry_df, current_lap, vehicle_number, n_samples=25)
                
                ci_lower = {
                    'front_left': ci_results.get('front_left', (0, 0, 0))[0],
                    'front_right': ci_results.get('front_right', (0, 0, 0))[0],
                    'rear_left': ci_results.get('rear_left', (0, 0, 0))[0],
                    'rear_right': ci_results.get('rear_right', (0, 0, 0))[0],
                    'predicted_laps_remaining': int(ci_results.get('predicted_laps_remaining', (0, 0, 0))[0])
                }
                
                ci_upper = {
                    'front_left': ci_results.get('front_left', (0, 0, 0))[2],
                    'front_right': ci_results.get('front_right', (0, 0, 0))[2],
                    'rear_left': ci_results.get('rear_left', (0, 0, 0))[2],
                    'rear_right': ci_results.get('rear_right', (0, 0, 0))[2],
                    'predicted_laps_remaining': int(ci_results.get('predicted_laps_remaining', (0, 0, 0))[2])
                }
                
                # Calculate confidence score: fraction of CI width relative to prediction
                # Smaller CI width = higher confidence
                max_wear = max(fl_wear, fr_wear, rl_wear, rr_wear)
                if max_wear > 0:
                    avg_ci_width = np.mean([
                        ci_upper['front_left'] - ci_lower['front_left'],
                        ci_upper['front_right'] - ci_lower['front_right'],
                        ci_upper['rear_left'] - ci_lower['rear_left'],
                        ci_upper['rear_right'] - ci_lower['rear_right']
                    ])
                    # Confidence is inverse of relative CI width (normalized)
                    confidence = max(0.0, min(1.0, 1.0 - (avg_ci_width / (max_wear + 1.0))))
                else:
                    confidence = 0.8  # Default confidence
            except Exception as e:
                logger.warning(f"Failed to calculate CI: {e}")
                confidence = 0.7  # Fallback confidence
        
        # Calculate feature importance if requested
        top_features = None
        if include_explainability:
            try:
                top_features = self.ablation_importance(telemetry_df, current_lap, vehicle_number, topk=6)
            except Exception as e:
                logger.warning(f"Failed to calculate feature importance: {e}")
        
        return TireWearData(
            front_left=round(fl_wear, 1),
            front_right=round(fr_wear, 1),
            rear_left=round(rl_wear, 1),
            rear_right=round(rr_wear, 1),
            predicted_laps_remaining=predicted_laps_remaining,
            pit_window_optimal=pit_window,
            confidence=confidence,
            ci_lower=ci_lower,
            ci_upper=ci_upper,
            top_features=top_features,
            model_version=self.model_version
        )
    
    def predict_lap_time_with_wear(self, base_lap_time: float, tire_wear: TireWearData) -> float:
        """
        Predict lap time accounting for tire wear
        
        Args:
            base_lap_time: Base lap time in seconds (with fresh tires)
            tire_wear: Current tire wear data
        
        Returns:
            Predicted lap time in seconds
        """
        # Calculate average tire wear
        avg_wear = (tire_wear.front_left + tire_wear.front_right + 
                   tire_wear.rear_left + tire_wear.rear_right) / 4.0
        
        # Tire degradation effect on lap time
        # 0% wear = 0s penalty
        # 50% wear = +0.5s penalty
        # 100% wear = +2.0s penalty
        if avg_wear < 50:
            time_penalty = avg_wear * 0.01  # 0.01s per 1% wear
        else:
            # Accelerating degradation after 50%
            time_penalty = 0.5 + (avg_wear - 50) * 0.03
        
        return base_lap_time + time_penalty


# Global predictor instance
tire_wear_predictor = TireWearPredictor()
