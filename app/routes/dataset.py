"""
Dataset Coverage API Routes
===========================
Endpoints for dataset provenance and coverage information
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
import logging
from datetime import datetime
from pathlib import Path
import pandas as pd

from app.config import DATA_DIR, TRACKS
from app.data.data_loader import data_loader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])


@router.get("/coverage")
async def get_dataset_coverage():
    """
    Get dataset coverage information
    
    Returns:
    - Laps per track
    - Drivers/vehicles per track
    - Date ranges
    - Tire compounds
    - Data quality metrics
    """
    try:
        coverage = {
            "tracks": [],
            "summary": {
                "total_tracks": 0,
                "total_races": 0,
                "total_laps": 0,
                "total_vehicles": 0,
                "date_range": {
                    "earliest": None,
                    "latest": None
                }
            }
        }
        
        all_laps = []
        all_vehicles = set()
        all_dates = []
        
        for track_id, track_config in TRACKS.items():
            track_info = {
                "track_id": track_id,
                "track_name": track_config["name"],
                "races": [],
                "total_laps": 0,
                "vehicles": [],
                "date_range": None
            }
            
            # Check for Race 1 and Race 2
            for race_num in [1, 2]:
                race_path = data_loader.get_race_path(track_id, race_num)
                if not race_path:
                    continue
                
                # Get vehicles
                vehicles = data_loader.get_available_vehicles(track_id, race_num)
                if not vehicles:
                    continue
                
                # Get lap times to count laps
                lap_times_df = data_loader.load_lap_times(track_id, race_num)
                total_laps = 0
                if lap_times_df is not None and not lap_times_df.empty:
                    if "lap" in lap_times_df.columns:
                        total_laps = lap_times_df["lap"].max() if len(lap_times_df) > 0 else 0
                    else:
                        # Estimate from vehicle data
                        if vehicles:
                            total_laps = data_loader.get_total_laps(track_id, race_num, vehicles[0])
                
                race_info = {
                    "race_number": race_num,
                    "vehicles": vehicles,
                    "total_laps": total_laps,
                    "data_available": True
                }
                
                track_info["races"].append(race_info)
                track_info["total_laps"] += total_laps
                track_info["vehicles"].extend(vehicles)
                all_laps.append(total_laps)
                all_vehicles.update(vehicles)
                
                # Try to get date from telemetry if available
                telemetry_df = data_loader.load_telemetry(track_id, race_num, 1, 1, vehicles[0] if vehicles else None)
                if telemetry_df is not None and not telemetry_df.empty:
                    if "timestamp" in telemetry_df.columns:
                        try:
                            dates = pd.to_datetime(telemetry_df["timestamp"], errors='coerce')
                            valid_dates = dates.dropna()
                            if not valid_dates.empty:
                                all_dates.extend(valid_dates.tolist())
                                if not race_info.get("date_range"):
                                    race_info["date_range"] = {
                                        "earliest": valid_dates.min().isoformat(),
                                        "latest": valid_dates.max().isoformat()
                                    }
                        except Exception:
                            pass
            
            # Remove duplicate vehicles
            track_info["vehicles"] = sorted(list(set(track_info["vehicles"])))
            
            if track_info["races"]:
                coverage["tracks"].append(track_info)
        
        # Calculate summary
        coverage["summary"] = {
            "total_tracks": len(coverage["tracks"]),
            "total_races": sum(len(t["races"]) for t in coverage["tracks"]),
            "total_laps": sum(all_laps),
            "total_vehicles": len(all_vehicles),
            "date_range": {
                "earliest": min(all_dates).isoformat() if all_dates else None,
                "latest": max(all_dates).isoformat() if all_dates else None
            }
        }
        
        # Add data quality notes
        coverage["data_quality"] = {
            "telemetry_columns": [
                "speed", "lateral_g", "longitudinal_g", "brake_pressure",
                "throttle", "steering_angle", "tire_temp", "lap", "vehicle_number"
            ],
            "lap_times_columns": [
                "lap", "vehicle_number", "lap_time", "sector_1", "sector_2", "sector_3"
            ],
            "notes": [
                "Data collected from Toyota GR Cup races 2024-2025",
                "Telemetry sampled at 10Hz",
                "Lap times recorded per sector"
            ]
        }
        
        return {
            "success": True,
            "coverage": coverage,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dataset coverage: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))



