"""
Frontend integration routes - SSE streaming and enhanced endpoints
"""
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse
import asyncio
import json
import logging
from typing import Optional
import pandas as pd

from app.services.dashboard_builder import build_dashboard_payload, build_demo_payload
from app.analytics.eval import evaluate_tire_wear_on_track, evaluate_all_tracks
from app.utils.split_deltas import calculate_split_deltas, load_lap_times_with_sectors
from app.data.data_loader import data_loader
from app.config import TRACKS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")


@router.get("/dashboard/live", response_class=JSONResponse)
async def api_dashboard_live(
    track: str = Query(..., description="Track identifier (e.g., 'sebring')"),
    race: int = Query(..., description="Race number (1 or 2)"),
    vehicle: int = Query(..., description="Vehicle number"),
    lap: int = Query(..., description="Current lap number"),
    enhanced: bool = Query(True, description="Use enhanced predictor with explainability")
):
    """
    Get complete live dashboard data with AI analytics
    
    Returns tire wear (with uncertainty & explainability), performance, gaps, and strategy
    """
    logger.info(f"Dashboard request: track={track}, race={race}, vehicle={vehicle}, lap={lap}")
    
    payload = await build_dashboard_payload(track, race, vehicle, lap, use_enhanced_predictor=enhanced)
    
    if not payload.get("meta", {}).get("ok"):
        error_msg = payload.get("meta", {}).get("error", "Unknown error")
        raise HTTPException(status_code=503, detail=error_msg)
    
    return JSONResponse(payload)


@router.get("/demo/seed")
async def api_demo_seed(name: Optional[str] = Query("best_overtake", description="Demo scenario name")):
    """
    Return curated demo data for frontend testing
    
    Use this when live telemetry is not available
    """
    logger.info(f"Demo seed request: name={name}")
    
    demo = await build_demo_payload(name=name)
    return JSONResponse(demo)


@router.get("/live/stream")
async def api_live_stream(
    track: str = Query(..., description="Track identifier"),
    race: int = Query(..., description="Race number"),
    vehicle: int = Query(..., description="Vehicle number"),
    start_lap: int = Query(1, description="Starting lap number"),
    interval: float = Query(1.0, description="Update interval in seconds")
):
    """
    SSE (Server-Sent Events) stream endpoint for real-time dashboard updates
    
    Frontend usage:
    ```javascript
    const eventSource = new EventSource(
        '/api/live/stream?track=sebring&race=1&vehicle=7&start_lap=1'
    );
    eventSource.addEventListener('update', (e) => {
        const data = JSON.parse(e.data);
        console.log('Dashboard update:', data);
    });
    ```
    """
    logger.info(f"SSE stream started: track={track}, race={race}, vehicle={vehicle}")
    
    async def event_generator():
        current_lap = start_lap
        max_laps = 25  # Default max
        
        while current_lap <= max_laps:
            try:
                # Build dashboard payload for current lap
                payload = await build_dashboard_payload(
                    track, race, vehicle, current_lap, use_enhanced_predictor=True
                )
                
                # Update max laps from payload
                if payload.get("meta", {}).get("total_laps"):
                    max_laps = payload["meta"]["total_laps"]
                
                # Send update event
                yield {
                    "event": "update",
                    "data": json.dumps(payload)
                }
                
                # Increment lap
                current_lap += 1
                
                # Wait for interval
                await asyncio.sleep(interval)
                
            except Exception as e:
                logger.error(f"SSE stream error: {e}")
                yield {
                    "event": "error",
                    "data": json.dumps({"error": str(e)})
                }
                await asyncio.sleep(interval)
        
        # Send completion event
        yield {
            "event": "complete",
            "data": json.dumps({"message": "Race completed"})
        }
    
    return EventSourceResponse(event_generator())


@router.get("/eval/tire-wear")
async def api_eval_tire_wear(
    track: Optional[str] = Query(None, description="Track to evaluate (None = all tracks)"),
    race: int = Query(1, description="Race number"),
    vehicle: int = Query(7, description="Vehicle number"),
    max_laps: int = Query(15, description="Maximum laps to evaluate")
):
    """
    Evaluate tire wear prediction model
    
    Returns RMSE and MAE metrics per track or overall
    """
    logger.info(f"Evaluation request: track={track}")
    
    if track:
        # Evaluate single track
        result = evaluate_tire_wear_on_track(track, race, vehicle, max_laps)
        return JSONResponse(result)
    else:
        # Evaluate all tracks
        result = evaluate_all_tracks(max_samples_per_track=max_laps)
        return JSONResponse(result)


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "PitWall AI Backend",
        "version": "2.0.0",
        "features": [
            "tire_wear_prediction_with_uncertainty",
            "explainability",
            "sse_streaming",
            "model_evaluation"
        ]
    }


@router.get("/config")
async def get_config():
    """Get backend configuration for frontend"""
    from app.config import API_VERSION
    
    return {
        "version": API_VERSION,
        "tracks": [
            {
                "id": track_id,
                "name": config["name"],
                "location": config["location"],
                "length_miles": config["length_miles"],
                "turns": config["turns"]
            }
            for track_id, config in TRACKS.items()
        ],
        "features": {
            "enhanced_predictor": True,
            "uncertainty_quantification": True,
            "explainability": True,
            "sse_streaming": True,
            "model_evaluation": True,
            "split_delta_analysis": True
        }
    }


@router.get("/analytics/split-deltas", response_class=JSONResponse)
async def api_split_deltas(
    track: str = Query(..., description="Track identifier (e.g., 'sebring')"),
    race: int = Query(..., description="Race number (1 or 2)"),
    cars: str = Query(..., description="Comma-separated list of car numbers (e.g., '7,13,22')"),
    ref_car: Optional[int] = Query(None, description="Reference car number (defaults to first car in list)")
):
    """
    Calculate lap split deltas across cars.
    
    Returns sector/lap split differences for each car compared to a reference car.
    Useful for comparing relative performance, highlighting which sectors/laps were gained or lost.
    
    Example:
        GET /api/analytics/split-deltas?track=sebring&race=1&cars=7,13,22&ref_car=7
    
    Returns JSON with:
        - delta_data: List of {lap, ref_car, compare_car, delta_S1, delta_S2, delta_S3}
        - Positive delta = compare car is slower than reference
        - Negative delta = compare car is faster than reference
    """
    logger.info(f"Split delta request: track={track}, race={race}, cars={cars}, ref_car={ref_car}")
    
    # Validate track
    if track not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track}' not found")
    
    # Parse car list
    try:
        car_list = [int(c.strip()) for c in cars.split(',')]
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cars parameter. Expected comma-separated integers (e.g., '7,13,22')")
    
    if len(car_list) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 cars for comparison")
    
    # Load lap time data with sectors
    lap_time_data = load_lap_times_with_sectors(track, race, data_loader)
    
    if lap_time_data is None or lap_time_data.empty:
        # Return empty result with demo data structure for frontend compatibility
        logger.warning(f"No lap time data found for track={track}, race={race}. Returning empty result.")
        return JSONResponse({
            "delta_data": [],
            "meta": {
                "track": track,
                "race": race,
                "cars": car_list,
                "ref_car": ref_car if ref_car else car_list[0],
                "message": "No lap time data available",
                "demo": True
            }
        })
    
    # Calculate split deltas
    try:
        delta_df = calculate_split_deltas(lap_time_data, car_list, ref_car)
        
        # Convert to list of dicts for JSON response
        delta_data = delta_df.to_dict('records')
        
        # Replace NaN with None for JSON serialization
        for record in delta_data:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
        
        return JSONResponse({
            "delta_data": delta_data,
            "meta": {
                "track": track,
                "race": race,
                "cars": car_list,
                "ref_car": int(ref_car) if ref_car else int(car_list[0]),
                "total_records": len(delta_data),
                "demo": False
            }
        })
    
    except Exception as e:
        logger.error(f"Error calculating split deltas: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error calculating split deltas: {str(e)}")
