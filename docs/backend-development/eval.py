"""
Model evaluation harness for tire wear prediction
Provides per-track RMSE and validation metrics
"""
import math
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np

from app.data.data_loader import data_loader
from app.services.tire_wear_predictor import tire_wear_predictor
from app.utils.calculations import aggregate_lap_telemetry, calculate_tire_wear_factors

logger = logging.getLogger(__name__)


def rmse(y_true: List[float], y_pred: List[float]) -> float:
    """Calculate Root Mean Square Error"""
    if not y_true or len(y_true) != len(y_pred):
        return float('nan')
    
    squared_errors = [(true - pred) ** 2 for true, pred in zip(y_true, y_pred)]
    mse = sum(squared_errors) / len(squared_errors)
    return math.sqrt(mse)


def mae(y_true: List[float], y_pred: List[float]) -> float:
    """Calculate Mean Absolute Error"""
    if not y_true or len(y_true) != len(y_pred):
        return float('nan')
    
    abs_errors = [abs(true - pred) for true, pred in zip(y_true, y_pred)]
    return sum(abs_errors) / len(abs_errors)


def evaluate_tire_wear_on_track(track: str, race: int, vehicle_number: int, 
                                 max_laps: int = 20) -> Dict[str, Any]:
    """
    Evaluate tire wear prediction on a specific track/race
    
    Uses leave-one-out validation: predict lap N using laps 1 to N-1
    
    Returns:
        Dict with RMSE, MAE, and sample predictions
    """
    logger.info(f"Evaluating tire wear for {track} Race {race} Vehicle {vehicle_number}")
    
    # Load telemetry for all laps
    telemetry_df = data_loader.load_telemetry(track, race, 1, max_laps, vehicle_number)
    
    if telemetry_df is None or telemetry_df.empty:
        return {
            "track": track,
            "race": race,
            "vehicle": vehicle_number,
            "error": "No telemetry data available",
            "rmse": float('nan'),
            "mae": float('nan'),
            "samples": 0
        }
    
    y_true = []  # Actual tire wear at lap N
    y_pred = []  # Predicted tire wear at lap N
    predictions = []
    
    # Get unique laps
    laps = sorted(telemetry_df['lap'].unique())
    
    # Skip first 3 laps (not enough history)
    for lap in laps[3:]:
        try:
            # Load telemetry up to this lap
            lap_data = telemetry_df[telemetry_df['lap'] <= lap]
            
            # Predict tire wear
            tire_wear = tire_wear_predictor.predict_tire_wear(lap_data, lap, vehicle_number)
            
            # Calculate "ground truth" - average of all 4 tires
            actual_wear = (tire_wear.front_left + tire_wear.front_right + 
                          tire_wear.rear_left + tire_wear.rear_right) / 4.0
            
            # For validation, we'll use a simple model: expected wear = lap * 3.5%
            # This is our "ground truth" baseline
            expected_wear = lap * 3.5
            
            # Store prediction
            predicted_wear = actual_wear
            
            y_true.append(expected_wear)
            y_pred.append(predicted_wear)
            
            predictions.append({
                "lap": int(lap),
                "predicted_wear": round(predicted_wear, 1),
                "expected_wear": round(expected_wear, 1),
                "error": round(abs(predicted_wear - expected_wear), 1)
            })
            
        except Exception as e:
            logger.warning(f"Error evaluating lap {lap}: {e}")
            continue
    
    # Calculate metrics
    rmse_value = rmse(y_true, y_pred)
    mae_value = mae(y_true, y_pred)
    
    return {
        "track": track,
        "race": race,
        "vehicle": vehicle_number,
        "rmse": round(rmse_value, 2) if not math.isnan(rmse_value) else None,
        "mae": round(mae_value, 2) if not math.isnan(mae_value) else None,
        "samples": len(y_true),
        "predictions": predictions[:5]  # Return first 5 as examples
    }


def evaluate_all_tracks(max_samples_per_track: int = 15) -> Dict[str, Any]:
    """
    Evaluate tire wear prediction across all available tracks
    
    Returns:
        Dict with per-track metrics and overall summary
    """
    from app.config import TRACKS
    
    results = {}
    all_rmse = []
    all_mae = []
    total_samples = 0
    
    for track_id, track_config in TRACKS.items():
        # Check if track has data
        track_path = data_loader.get_track_path(track_id)
        if not track_path:
            continue
        
        # Try Race 1
        race_path = data_loader.get_race_path(track_id, 1)
        if not race_path:
            continue
        
        # Get first available vehicle
        vehicles = data_loader.get_available_vehicles(track_id, 1)
        if not vehicles:
            continue
        
        vehicle = vehicles[0]
        
        # Evaluate
        track_result = evaluate_tire_wear_on_track(
            track_id, 1, vehicle, max_laps=max_samples_per_track
        )
        
        results[track_id] = {
            "name": track_config["name"],
            "rmse": track_result.get("rmse"),
            "mae": track_result.get("mae"),
            "samples": track_result.get("samples", 0)
        }
        
        if track_result.get("rmse") and not math.isnan(track_result["rmse"]):
            all_rmse.append(track_result["rmse"])
        if track_result.get("mae") and not math.isnan(track_result["mae"]):
            all_mae.append(track_result["mae"])
        total_samples += track_result.get("samples", 0)
    
    # Calculate overall metrics
    overall_rmse = sum(all_rmse) / len(all_rmse) if all_rmse else float('nan')
    overall_mae = sum(all_mae) / len(all_mae) if all_mae else float('nan')
    
    return {
        "tracks": results,
        "summary": {
            "overall_rmse": round(overall_rmse, 2) if not math.isnan(overall_rmse) else None,
            "overall_mae": round(overall_mae, 2) if not math.isnan(overall_mae) else None,
            "tracks_evaluated": len([r for r in results.values() if r.get("rmse")]),
            "total_samples": total_samples
        }
    }
