"""
Tire wear prediction service using AI/ML
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
import logging

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
    
    def predict_tire_wear(self, telemetry_df: pd.DataFrame, current_lap: int, 
                         vehicle_number: int) -> TireWearData:
        """
        Predict tire wear based on telemetry data
        
        Args:
            telemetry_df: DataFrame with telemetry data for multiple laps
            current_lap: Current lap number
            vehicle_number: Vehicle number
        
        Returns:
            TireWearData with wear percentages and predictions
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
                predicted_laps_remaining = int(remaining_wear / avg_wear_rate)
            else:
                predicted_laps_remaining = 10
        
        # Calculate optimal pit window
        # Pit when tires are at 85-90% wear
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
            # Already in pit window
            pit_window = [current_lap, current_lap + 2]
        
        return TireWearData(
            front_left=round(fl_wear, 1),
            front_right=round(fr_wear, 1),
            rear_left=round(rl_wear, 1),
            rear_right=round(rr_wear, 1),
            predicted_laps_remaining=predicted_laps_remaining,
            pit_window_optimal=pit_window
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
