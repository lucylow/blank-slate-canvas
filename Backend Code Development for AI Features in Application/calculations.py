"""
Utility functions for racing calculations
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple


def format_lap_time(seconds: float) -> str:
    """Format lap time in seconds to MM:SS.sss format"""
    if pd.isna(seconds) or seconds <= 0:
        return "--:--.---"
    
    minutes = int(seconds // 60)
    secs = seconds % 60
    return f"{minutes}:{secs:06.3f}"


def format_gap(seconds: float, leading: bool = False) -> str:
    """Format time gap with + or - prefix"""
    if pd.isna(seconds) or seconds == 0:
        return "0.000s"
    
    prefix = "+" if seconds > 0 else ""
    if leading:
        prefix = "-" if seconds < 0 else ""
    
    return f"{prefix}{abs(seconds):.3f}s"


def pivot_telemetry(df: pd.DataFrame) -> pd.DataFrame:
    """
    Pivot telemetry from long format to wide format
    
    Input: One row per telemetry reading
    Output: One row per timestamp with all telemetry columns
    """
    if df.empty:
        return df
    
    # Pivot on timestamp to get all telemetry values in one row
    pivoted = df.pivot_table(
        index=['timestamp', 'lap', 'vehicle_number'],
        columns='telemetry_name',
        values='telemetry_value',
        aggfunc='first'
    ).reset_index()
    
    # Rename columns to match our model
    column_mapping = {
        'speed': 'speed',
        'gear': 'gear',
        'nmot': 'nmot',
        'Steering_Angle': 'steering_angle',
        'ath': 'throttle',
        'pbrake_f': 'brake_front',
        'pbrake_r': 'brake_rear',
        'accx_can': 'accel_x',
        'accy_can': 'accel_y'
    }
    
    pivoted = pivoted.rename(columns=column_mapping)
    
    return pivoted


def aggregate_lap_telemetry(df: pd.DataFrame, lap: int) -> Dict:
    """
    Aggregate telemetry data for a single lap
    
    Returns dict with summary statistics
    """
    lap_data = df[df['lap'] == lap]
    
    if lap_data.empty:
        return {}
    
    # Pivot to wide format
    pivoted = pivot_telemetry(lap_data)
    
    if pivoted.empty:
        return {}
    
    # Calculate aggregates
    result = {
        'lap': lap,
        'vehicle_number': int(pivoted['vehicle_number'].iloc[0]),
        'avg_speed': float(pivoted['speed'].mean()) if 'speed' in pivoted else 0.0,
        'max_speed': float(pivoted['speed'].max()) if 'speed' in pivoted else 0.0,
        'avg_throttle': float(pivoted['throttle'].mean()) if 'throttle' in pivoted else 0.0,
        'avg_lateral_g': float(pivoted['accel_y'].abs().mean()) if 'accel_y' in pivoted else 0.0,
        'avg_longitudinal_g': float(pivoted['accel_x'].abs().mean()) if 'accel_x' in pivoted else 0.0,
        'max_lateral_g': float(pivoted['accel_y'].abs().max()) if 'accel_y' in pivoted else 0.0,
        'max_longitudinal_g': float(pivoted['accel_x'].abs().max()) if 'accel_x' in pivoted else 0.0,
    }
    
    # Count heavy braking events (> 0.8 G deceleration)
    if 'accel_x' in pivoted:
        result['heavy_braking_events'] = int((pivoted['accel_x'] < -0.8).sum())
    else:
        result['heavy_braking_events'] = 0
    
    # Count hard cornering events (> 1.0 G lateral)
    if 'accel_y' in pivoted:
        result['hard_cornering_events'] = int((pivoted['accel_y'].abs() > 1.0).sum())
    else:
        result['hard_cornering_events'] = 0
    
    # Count gear shifts (changes in gear value)
    if 'gear' in pivoted:
        gear_changes = (pivoted['gear'].diff() != 0).sum()
        result['gear_shifts'] = int(gear_changes)
    else:
        result['gear_shifts'] = 0
    
    return result


def calculate_tire_wear_factors(lap_telemetry: Dict) -> Dict[str, float]:
    """
    Calculate tire wear contributing factors from lap telemetry
    
    Returns dict with wear factors
    """
    # Base wear per lap
    base_wear = 1.2
    
    # Additional wear from lateral forces (cornering)
    lateral_wear = lap_telemetry.get('avg_lateral_g', 0) * 0.15
    
    # Additional wear from longitudinal forces (braking/acceleration)
    longitudinal_wear = lap_telemetry.get('avg_longitudinal_g', 0) * 0.10
    
    # Additional wear from high speed
    speed_wear = (lap_telemetry.get('avg_speed', 0) / 100.0) * 0.5
    
    # Additional wear from aggressive driving
    aggressive_wear = (
        lap_telemetry.get('heavy_braking_events', 0) * 0.05 +
        lap_telemetry.get('hard_cornering_events', 0) * 0.08
    )
    
    total_wear = base_wear + lateral_wear + longitudinal_wear + speed_wear + aggressive_wear
    
    return {
        'base_wear': base_wear,
        'lateral_wear': lateral_wear,
        'longitudinal_wear': longitudinal_wear,
        'speed_wear': speed_wear,
        'aggressive_wear': aggressive_wear,
        'total_wear': total_wear
    }


def estimate_tire_distribution(total_wear: float) -> Tuple[float, float, float, float]:
    """
    Estimate individual tire wear from total wear
    
    Returns (FL, FR, RL, RR) percentages
    
    Assumptions:
    - Front tires wear faster (60% of total wear)
    - Right tires wear slightly more on most tracks (52% vs 48%)
    """
    # Distribute wear front/rear (60/40 split)
    front_wear = total_wear * 0.60
    rear_wear = total_wear * 0.40
    
    # Distribute left/right (48/52 split, right wears more)
    fl_wear = front_wear * 0.48
    fr_wear = front_wear * 0.52
    rl_wear = rear_wear * 0.48
    rr_wear = rear_wear * 0.52
    
    # Add some randomness for realism (±5%)
    import random
    fl_wear *= random.uniform(0.95, 1.05)
    fr_wear *= random.uniform(0.95, 1.05)
    rl_wear *= random.uniform(0.95, 1.05)
    rr_wear *= random.uniform(0.95, 1.05)
    
    return (fl_wear, fr_wear, rl_wear, rr_wear)
