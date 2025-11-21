"""
PitWall AI Backend - FastAPI Application
Real-time racing analytics and AI-powered strategy optimization
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
from typing import Optional
import pandas as pd

from app.config import API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS, TRACKS
from app.routes.frontend_integration import router as frontend_router
from app.models.analytics import (
    DashboardData, TireWearRequest, PerformanceRequest, 
    StrategyRequest, StrategyOptimization
)
from app.models.track import Track, TrackList, RaceInfo
from app.data.data_loader import data_loader
from app.services.tire_wear_predictor import tire_wear_predictor
from app.services.performance_analyzer import performance_analyzer
from app.services.strategy_optimizer import strategy_optimizer
from app.analytics.eval import evaluate_tire_wear_on_track, evaluate_all_tracks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include frontend integration router (SSE streaming, enhanced endpoints)
app.include_router(frontend_router, tags=["Frontend Integration"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PitWall AI Backend API",
        "version": API_VERSION,
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint (legacy - use /api/health for enhanced version)"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "note": "Use /api/health for enhanced health check"
    }


# ============================================================================
# TRACK ENDPOINTS
# ============================================================================

@app.get("/api/tracks", response_model=TrackList)
async def get_tracks():
    """Get list of all available tracks"""
    tracks = []
    for track_id, track_config in TRACKS.items():
        # Check if data exists
        track_path = data_loader.get_track_path(track_id)
        available_races = []
        
        if track_path:
            # Check for Race 1 and Race 2
            for race_num in [1, 2]:
                race_path = data_loader.get_race_path(track_id, race_num)
                if race_path:
                    available_races.append(race_num)
        
        tracks.append(Track(
            id=track_id,
            name=track_config["name"],
            location=track_config["location"],
            length_miles=track_config["length_miles"],
            turns=track_config["turns"],
            available_races=available_races
        ))
    
    return TrackList(tracks=tracks)


@app.get("/api/tracks/{track_id}", response_model=Track)
async def get_track(track_id: str):
    """Get specific track details"""
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    track_config = TRACKS[track_id]
    track_path = data_loader.get_track_path(track_id)
    available_races = []
    
    if track_path:
        for race_num in [1, 2]:
            race_path = data_loader.get_race_path(track_id, race_num)
            if race_path:
                available_races.append(race_num)
    
    return Track(
        id=track_id,
        name=track_config["name"],
        location=track_config["location"],
        length_miles=track_config["length_miles"],
        turns=track_config["turns"],
        available_races=available_races
    )


@app.get("/api/tracks/{track_id}/races/{race_number}", response_model=RaceInfo)
async def get_race_info(track_id: str, race_number: int):
    """Get race information"""
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    race_path = data_loader.get_race_path(track_id, race_number)
    if not race_path:
        raise HTTPException(status_code=404, detail=f"Race {race_number} not found for track '{track_id}'")
    
    # Get available vehicles
    vehicles = data_loader.get_available_vehicles(track_id, race_number)
    
    # Get total laps (use first vehicle)
    total_laps = 25  # Default
    if vehicles:
        total_laps = data_loader.get_total_laps(track_id, race_number, vehicles[0])
    
    return RaceInfo(
        track=track_id,
        race_number=race_number,
        vehicles=vehicles,
        total_laps=total_laps
    )


# ============================================================================
# DASHBOARD ENDPOINT (Main)
# ============================================================================

@app.get("/api/dashboard/live", response_model=DashboardData)
async def get_live_dashboard(
    track: str = Query(..., description="Track identifier (e.g., 'sebring')"),
    race: int = Query(..., description="Race number (1 or 2)"),
    vehicle: int = Query(..., description="Vehicle number"),
    lap: int = Query(..., description="Current lap number")
):
    """
    Get complete live dashboard data
    
    This is the main endpoint that combines all AI analytics:
    - Tire wear prediction
    - Performance metrics
    - Gap analysis
    """
    logger.info(f"Dashboard request: track={track}, race={race}, vehicle={vehicle}, lap={lap}")
    
    # Validate track
    if track not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track}' not found")
    
    # Load telemetry data for current and previous laps
    lap_start = max(1, lap - 5)  # Load last 5 laps for context
    telemetry_df = data_loader.load_telemetry(track, race, lap_start, lap, vehicle)
    
    if telemetry_df is None or telemetry_df.empty:
        raise HTTPException(
            status_code=404, 
            detail=f"No telemetry data found for track={track}, race={race}, vehicle={vehicle}, lap={lap}"
        )
    
    # Load lap times
    lap_times_df = data_loader.load_lap_times(track, race)
    if lap_times_df is None:
        lap_times_df = pd.DataFrame()  # Empty dataframe as fallback
    
    # Get total laps
    total_laps = data_loader.get_total_laps(track, race, vehicle)
    
    # ========== AI PREDICTIONS ==========
    
    # 1. Tire Wear Prediction (with CI and explainability)
    tire_wear = tire_wear_predictor.predict_tire_wear(
        telemetry_df, lap, vehicle, 
        include_ci=True, 
        include_explainability=True
    )
    
    # 2. Performance Analysis
    performance = performance_analyzer.analyze_performance(
        lap_times_df, lap, vehicle, total_laps
    )
    
    # 3. Gap Analysis
    gap_analysis = performance_analyzer.analyze_gaps(lap_times_df, lap, vehicle)
    
    # ========== ASSEMBLE DASHBOARD ==========
    
    dashboard = DashboardData(
        track=TRACKS[track]["name"],
        race=race,
        vehicle_number=vehicle,
        lap=lap,
        total_laps=total_laps,
        tire_wear=tire_wear,
        performance=performance,
        gap_analysis=gap_analysis,
        timestamp=datetime.utcnow().isoformat(),
        live_data=True
    )
    
    logger.info(f"Dashboard generated successfully for vehicle {vehicle} lap {lap}")
    return dashboard


# ============================================================================
# ANALYTICS ENDPOINTS (Individual)
# ============================================================================

@app.post("/api/analytics/tire-wear")
async def analyze_tire_wear(request: TireWearRequest):
    """Predict tire wear based on telemetry"""
    logger.info(f"Tire wear request: {request}")
    
    # Load telemetry
    telemetry_df = data_loader.load_telemetry(
        request.track, request.race, 1, request.lap, request.vehicle_number
    )
    
    if telemetry_df is None or telemetry_df.empty:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
    
    # Predict tire wear
    tire_wear = tire_wear_predictor.predict_tire_wear(
        telemetry_df, request.lap, request.vehicle_number
    )
    
    return {
        "success": True,
        "data": tire_wear,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/analytics/performance")
async def analyze_performance(request: PerformanceRequest):
    """Analyze driver performance"""
    logger.info(f"Performance request: {request}")
    
    # Load lap times
    lap_times_df = data_loader.load_lap_times(request.track, request.race)
    if lap_times_df is None:
        raise HTTPException(status_code=404, detail="Lap time data not found")
    
    # Get total laps
    total_laps = data_loader.get_total_laps(request.track, request.race, request.vehicle_number)
    
    # Analyze performance
    performance = performance_analyzer.analyze_performance(
        lap_times_df, request.lap, request.vehicle_number, total_laps
    )
    
    return {
        "success": True,
        "data": performance,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/analytics/strategy")
async def optimize_strategy(request: StrategyRequest):
    """Optimize race strategy"""
    logger.info(f"Strategy request: {request}")
    
    # Load telemetry for tire wear calculation
    telemetry_df = data_loader.load_telemetry(
        request.track, request.race, 1, request.current_lap, request.vehicle_number
    )
    
    if telemetry_df is None or telemetry_df.empty:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
    
    # Calculate tire wear
    tire_wear = tire_wear_predictor.predict_tire_wear(
        telemetry_df, request.current_lap, request.vehicle_number
    )
    
    # Optimize strategy
    base_lap_time = 123.5  # Default base lap time (can be calculated from data)
    strategy = strategy_optimizer.optimize_strategy(
        request.current_lap,
        request.total_laps,
        request.current_position,
        request.tire_laps,
        base_lap_time,
        tire_wear
    )
    
    return {
        "success": True,
        "data": strategy,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/analytics/gap-analysis")
async def get_gap_analysis(
    track: str = Query(...),
    race: int = Query(...),
    vehicle: int = Query(...),
    lap: int = Query(...)
):
    """Calculate gaps to competitors"""
    logger.info(f"Gap analysis request: track={track}, race={race}, vehicle={vehicle}, lap={lap}")
    
    # Load lap times
    lap_times_df = data_loader.load_lap_times(track, race)
    if lap_times_df is None:
        raise HTTPException(status_code=404, detail="Lap time data not found")
    
    # Analyze gaps
    gap_analysis = performance_analyzer.analyze_gaps(lap_times_df, lap, vehicle)
    
    return {
        "success": True,
        "data": gap_analysis,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/api/analytics/eval/tire-wear")
async def eval_tire_wear(
    track: Optional[str] = Query(None, description="Track to evaluate (None = all tracks)"),
    race: Optional[int] = Query(1, description="Race number"),
    vehicle: Optional[int] = Query(None, description="Vehicle number (None = first available)"),
    max_laps: int = Query(20, description="Maximum laps to evaluate")
):
    """
    Evaluate tire wear prediction model
    
    Returns RMSE, MAE, and calibration stats per track.
    Uses leave-one-out validation: predict lap N using laps 1 to N-1.
    """
    logger.info(f"Tire wear evaluation request: track={track}, race={race}, vehicle={vehicle}")
    
    if track:
        # Evaluate specific track
        if track not in TRACKS:
            raise HTTPException(status_code=404, detail=f"Track '{track}' not found")
        
        # Get vehicle if not specified
        if vehicle is None:
            vehicles = data_loader.get_available_vehicles(track, race or 1)
            if not vehicles:
                raise HTTPException(status_code=404, detail=f"No vehicles found for track '{track}'")
            vehicle = vehicles[0]
        
        result = evaluate_tire_wear_on_track(track, race or 1, vehicle, max_laps)
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }
    else:
        # Evaluate all tracks
        result = evaluate_all_tracks(max_samples_per_track=max_laps)
        
        return {
            "success": True,
            "data": result,
            "timestamp": datetime.utcnow().isoformat()
        }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {
        "success": False,
        "error": {
            "code": "NOT_FOUND",
            "message": str(exc.detail) if hasattr(exc, 'detail') else "Resource not found"
        }
    }


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal error: {exc}")
    return {
        "success": False,
        "error": {
            "code": "INTERNAL_ERROR",
            "message": "An internal error occurred"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
