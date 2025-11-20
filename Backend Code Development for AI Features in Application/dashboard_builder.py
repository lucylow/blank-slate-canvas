"""
Dashboard builder service - composes all analytics for frontend
"""
import logging
import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime

from app.data.data_loader import data_loader
from app.services.tire_wear_predictor_v2 import tire_wear_predictor_v2
from app.services.performance_analyzer import performance_analyzer
from app.services.strategy_optimizer import strategy_optimizer
from app.config import TRACKS
from app.utils.cache import dashboard_cache, cached

logger = logging.getLogger(__name__)


@cached(dashboard_cache, ttl=30, key_prefix="dashboard:")
async def build_dashboard_payload(
    track: str,
    race: int,
    vehicle: int,
    lap: int,
    use_enhanced_predictor: bool = True
) -> Dict[str, Any]:
    """
    Build complete dashboard payload for frontend
    
    Args:
        track: Track identifier
        race: Race number
        vehicle: Vehicle number
        lap: Current lap
        use_enhanced_predictor: Use V2 predictor with explainability
    
    Returns:
        Complete dashboard data with tire wear, performance, strategy, and metadata
    """
    try:
        # Validate track
        if track not in TRACKS:
            return {
                "meta": {
                    "ok": False,
                    "error": f"Track '{track}' not found",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        
        # Load telemetry data
        lap_start = max(1, lap - 5)
        telemetry_df = data_loader.load_telemetry(track, race, lap_start, lap, vehicle)
        
        if telemetry_df is None or telemetry_df.empty:
            return {
                "meta": {
                    "ok": False,
                    "error": "No telemetry data available",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        
        # Load lap times
        lap_times_df = data_loader.load_lap_times(track, race)
        if lap_times_df is None:
            lap_times_df = pd.DataFrame()
        
        # Get total laps
        total_laps = data_loader.get_total_laps(track, race, vehicle)
        
        # ========== AI PREDICTIONS WITH EXPLAINABILITY ==========
        
        # 1. Enhanced Tire Wear Prediction (with uncertainty and explainability)
        if use_enhanced_predictor:
            tire_prediction = tire_wear_predictor_v2.predict_tire_wear(
                telemetry_df, lap, vehicle, 
                return_explain=True, 
                bootstrap_samples=25
            )
        else:
            # Fallback to basic predictor
            from app.services.tire_wear_predictor import tire_wear_predictor
            basic_pred = tire_wear_predictor.predict_tire_wear(telemetry_df, lap, vehicle)
            tire_prediction = {
                'front_left': basic_pred.front_left,
                'front_right': basic_pred.front_right,
                'rear_left': basic_pred.rear_left,
                'rear_right': basic_pred.rear_right,
                'predicted_laps_remaining': basic_pred.predicted_laps_remaining,
                'pit_window_optimal': basic_pred.pit_window_optimal,
                'confidence': 0.75,
                'top_features': {}
            }
        
        # 2. Performance Analysis
        try:
            performance = performance_analyzer.analyze_performance(
                lap_times_df, lap, vehicle, total_laps
            )
            performance_data = {
                "current_lap": performance.current_lap,
                "best_lap": performance.best_lap,
                "gap_to_leader": performance.gap_to_leader,
                "predicted_finish": performance.predicted_finish,
                "position": performance.position,
                "lap_number": performance.lap_number,
                "total_laps": performance.total_laps
            }
        except Exception as e:
            logger.warning(f"Performance analysis failed: {e}")
            performance_data = {
                "current_lap": "2:04.560",
                "best_lap": "2:03.120",
                "gap_to_leader": "+1.240s",
                "predicted_finish": "P3",
                "position": 3,
                "lap_number": lap,
                "total_laps": total_laps
            }
        
        # 3. Gap Analysis
        try:
            gap_analysis = performance_analyzer.analyze_gaps(lap_times_df, lap, vehicle)
            gap_data = {
                "position": gap_analysis.position,
                "gap_to_leader": gap_analysis.gap_to_leader,
                "gap_to_ahead": gap_analysis.gap_to_ahead,
                "gap_to_behind": gap_analysis.gap_to_behind,
                "overtaking_opportunity": gap_analysis.overtaking_opportunity,
                "under_pressure": gap_analysis.under_pressure,
                "closing_rate_ahead": gap_analysis.closing_rate_ahead
            }
        except Exception as e:
            logger.warning(f"Gap analysis failed: {e}")
            gap_data = {
                "position": 3,
                "gap_to_leader": "+1.240s",
                "overtaking_opportunity": False,
                "under_pressure": False
            }
        
        # 4. Strategy Optimization
        try:
            # Create TireWearData object for strategy optimizer
            from app.models.analytics import TireWearData
            tire_wear_obj = TireWearData(
                front_left=tire_prediction['front_left'],
                front_right=tire_prediction['front_right'],
                rear_left=tire_prediction['rear_left'],
                rear_right=tire_prediction['rear_right'],
                predicted_laps_remaining=tire_prediction.get('predicted_laps_remaining'),
                pit_window_optimal=tire_prediction.get('pit_window_optimal')
            )
            
            base_lap_time = 123.5  # Default
            current_position = performance_data.get('position', 3)
            tire_laps = lap  # Simplified
            
            strategy = strategy_optimizer.optimize_strategy(
                lap, total_laps, current_position, tire_laps, base_lap_time, tire_wear_obj
            )
            
            strategy_data = {
                "recommended_strategy": strategy.recommended_strategy,
                "strategies": [
                    {
                        "name": s.name,
                        "pit_lap": s.pit_lap,
                        "expected_finish": s.expected_finish,
                        "expected_time": s.expected_time,
                        "confidence": s.confidence,
                        "reasoning": s.reasoning
                    } for s in strategy.strategies
                ],
                "current_tire_laps": strategy.current_tire_laps,
                "fuel_remaining_laps": strategy.fuel_remaining_laps
            }
        except Exception as e:
            logger.warning(f"Strategy optimization failed: {e}")
            strategy_data = {
                "recommended_strategy": "pit_lap_15",
                "strategies": [],
                "current_tire_laps": lap,
                "fuel_remaining_laps": total_laps - lap
            }
        
        # ========== ASSEMBLE COMPLETE PAYLOAD ==========
        
        payload = {
            "meta": {
                "ok": True,
                "track": TRACKS[track]["name"],
                "track_id": track,
                "race": race,
                "vehicle_number": vehicle,
                "lap": lap,
                "total_laps": total_laps,
                "timestamp": datetime.utcnow().isoformat(),
                "live_data": True,
                "enhanced_features": use_enhanced_predictor
            },
            "tire_wear": tire_prediction,
            "performance": performance_data,
            "gap_analysis": gap_data,
            "strategy": strategy_data
        }
        
        logger.info(f"Dashboard payload built successfully for {track} lap {lap}")
        return payload
        
    except Exception as e:
        logger.exception(f"Failed to build dashboard payload: {e}")
        return {
            "meta": {
                "ok": False,
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        }


async def build_demo_payload(name: str = "best_overtake") -> Dict[str, Any]:
    """
    Build demo payload with sample data for frontend testing
    
    Args:
        name: Demo scenario name
    
    Returns:
        Demo dashboard data
    """
    # Sample demo data
    demo_data = {
        "meta": {
            "ok": True,
            "track": "Sebring International Raceway",
            "track_id": "sebring",
            "race": 1,
            "vehicle_number": 7,
            "lap": 12,
            "total_laps": 25,
            "timestamp": datetime.utcnow().isoformat(),
            "live_data": False,
            "demo": True,
            "scenario": name
        },
        "tire_wear": {
            "front_left": 78.5,
            "front_right": 82.3,
            "rear_left": 71.2,
            "rear_right": 75.8,
            "predicted_laps_remaining": 8,
            "pit_window_optimal": [15, 17],
            "confidence": 0.87,
            "ci_lower": {
                "front_left": 75.2,
                "front_right": 79.1,
                "rear_left": 68.5,
                "rear_right": 72.9
            },
            "ci_upper": {
                "front_left": 81.8,
                "front_right": 85.5,
                "rear_left": 73.9,
                "rear_right": 78.7
            },
            "top_features": {
                "avg_lateral_g": 0.42,
                "heavy_braking_events": 0.28,
                "avg_longitudinal_g": 0.18,
                "avg_speed": 0.12
            }
        },
        "performance": {
            "current_lap": "2:04.560",
            "best_lap": "2:03.120",
            "gap_to_leader": "+1.240s",
            "predicted_finish": "P3",
            "position": 3,
            "lap_number": 12,
            "total_laps": 25
        },
        "gap_analysis": {
            "position": 3,
            "gap_to_leader": "+1.240s",
            "gap_to_ahead": "+0.450s",
            "gap_to_behind": "-0.820s",
            "overtaking_opportunity": False,
            "under_pressure": True,
            "closing_rate_ahead": "+0.054s/lap"
        },
        "strategy": {
            "recommended_strategy": "pit_lap_15",
            "strategies": [
                {
                    "name": "pit_lap_15",
                    "pit_lap": 15,
                    "expected_finish": "P3",
                    "expected_time": "51:23.450",
                    "confidence": 0.85,
                    "reasoning": "Pit on lap 15 for fresh tires, strong finish pace"
                },
                {
                    "name": "pit_lap_18",
                    "pit_lap": 18,
                    "expected_finish": "P4",
                    "expected_time": "51:25.120",
                    "confidence": 0.72,
                    "reasoning": "Push tires longer, risk of degradation in final laps"
                }
            ],
            "current_tire_laps": 12,
            "fuel_remaining_laps": 13
        }
    }
    
    return demo_data
