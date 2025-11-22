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
import re
from contextlib import asynccontextmanager
from starlette.requests import Request

from app.config import (
    API_TITLE, API_VERSION, API_DESCRIPTION, CORS_ORIGINS, TRACKS,
    LOG_LEVEL, DEMO_MODE, DATA_MODELS_DIR
)
from app.routes.frontend_integration import router as frontend_router
from app.routes.anomaly_ws import router as anomaly_router
from app.routes.health import router as health_router, set_model_loaded, set_db_available, set_cache_available
from app.routes.telemetry import router as telemetry_router
from app.routes.agents import router as agents_router
from app.observability.logger import setup_logging
from app.observability.prom_metrics import get_metrics_response
from prometheus_client import Gauge

# Prometheus metrics for WebSocket connections (used by ws.py)
WS_CONNECTIONS = Gauge(
    "pitwall_ws_connections_active",
    "Active WebSocket connections"
)
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

# Setup structured JSON logging
setup_logging()
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle events"""
    # Startup
    logger.info("Starting PitWall AI Backend", extra={
        "version": API_VERSION,
        "demo_mode": DEMO_MODE,
        "log_level": LOG_LEVEL
    })
    
    try:
        # Load models if available
        model_path = DATA_MODELS_DIR / "seq_ae.h5" if DATA_MODELS_DIR.exists() else None
        if model_path and model_path.exists():
            logger.info(f"Model found at {model_path}")
            set_model_loaded(True)
        else:
            logger.info("No model found, running without ML model")
            set_model_loaded(False)
        
        # Check database/cache availability (for production)
        if not DEMO_MODE:
            # In production, check DB/cache connectivity
            set_db_available(True)  # Placeholder - implement actual check
            set_cache_available(True)  # Placeholder - implement actual check
        else:
            set_db_available(True)
            set_cache_available(True)
        
        logger.info("Startup complete")
        
    except Exception as e:
        logger.error(f"Startup error: {e}", exc_info=True)
    
    yield
    
    # Shutdown
    logger.info("Shutting down PitWall AI Backend")

# Create FastAPI app with lifespan
app = FastAPI(
    title=API_TITLE,
    version=API_VERSION,
    description=API_DESCRIPTION,
    lifespan=lifespan
)

# Add CORS middleware with wildcard support for Lovable Cloud
# Handle wildcard origins (for demo mode and Lovable Cloud)
cors_origins = CORS_ORIGINS.copy()
wildcard_patterns = []
explicit_origins = []

# Separate wildcard patterns from explicit origins
for origin in cors_origins:
    if origin == "*":
        # Full wildcard - handled separately
        continue
    elif "*" in origin:
        # Convert wildcard pattern to regex (e.g., "https://*.lovable.app" -> r"^https://.*\.lovable\.app$")
        pattern = origin.replace(".", r"\.").replace("*", ".*")
        wildcard_patterns.append(re.compile(f"^{pattern}$"))
    else:
        explicit_origins.append(origin)

# Add CORS middleware with explicit origins
if explicit_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=explicit_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add custom middleware to handle wildcard patterns and full wildcard
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    """Custom CORS middleware that handles wildcard patterns and Lovable Cloud domains"""
    origin = request.headers.get("origin")
    
    # Check if we should allow this origin
    allow_origin = None
    
    # Handle OPTIONS preflight requests
    if request.method == "OPTIONS":
        # Check if origin should be allowed
        if "*" in cors_origins:
            # Full wildcard - but can't use "*" with credentials, so use origin if present
            allow_origin = origin if origin else "*"
        elif origin:
            # Check explicit origins (handled by CORSMiddleware above)
            # Check wildcard patterns
            for pattern in wildcard_patterns:
                if pattern.match(origin):
                    allow_origin = origin
                    break
            # If not matched by wildcard, CORSMiddleware will handle it
        
        # Create response for OPTIONS request
        if allow_origin:
            from starlette.responses import Response
            response = Response()
            response.headers["Access-Control-Allow-Origin"] = allow_origin if allow_origin != "*" else (origin if origin else "*")
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "*"
            if allow_origin != "*" and origin:
                response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Max-Age"] = "86400"  # 24 hours
            return response
    
    # Handle actual requests
    response = await call_next(request)
    
    # Add CORS headers if origin is allowed (only if not already set by CORSMiddleware)
    if origin and "Access-Control-Allow-Origin" not in response.headers:
        if "*" in cors_origins:
            # Full wildcard - use origin with credentials
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif wildcard_patterns:
            # Check wildcard patterns
            for pattern in wildcard_patterns:
                if pattern.match(origin):
                    response.headers["Access-Control-Allow-Origin"] = origin
                    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
                    response.headers["Access-Control-Allow-Headers"] = "*"
                    response.headers["Access-Control-Allow-Credentials"] = "true"
                    break
    
    return response

# Include routers
app.include_router(health_router, tags=["Health"])
app.include_router(anomaly_router, tags=["Realtime"])
app.include_router(frontend_router, tags=["Frontend Integration"])
app.include_router(telemetry_router, tags=["Telemetry"])
app.include_router(agents_router, tags=["AI Agents"])

# Import and include replay router
try:
    from app.routes.replay import router as replay_router
    app.include_router(replay_router, tags=["Replay"])
except ImportError as e:
    logger.warning(f"Replay router not available: {e}")

# Import and include models router
try:
    from app.routes.models import router as models_router
    app.include_router(models_router, tags=["Models"])
except ImportError as e:
    logger.warning(f"Models router not available: {e}")

# Import and include dataset router
try:
    from app.routes.dataset import router as dataset_router
    app.include_router(dataset_router, tags=["Dataset"])
except ImportError as e:
    logger.warning(f"Dataset router not available: {e}")

# Import and include new routers
try:
    from app.routes import sse, ws, demo, api_models, insights
    from app.routes import analytics as analytics_router
    app.include_router(sse.router, tags=["Realtime"])
    app.include_router(ws.router, tags=["Realtime"])
    app.include_router(demo.router, prefix="/demo", tags=["Demo"])
    app.include_router(api_models.router, prefix="/api/models", tags=["Models"])
    app.include_router(insights.router, prefix="/api", tags=["Insights"])
    app.include_router(analytics_router.router, tags=["Analytics"])
except ImportError as e:
    logger.warning(f"Some optional routers not available: {e}")

# Metrics endpoint - mount Prometheus ASGI app for better compatibility
from prometheus_client import make_asgi_app
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)


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
    """Health check endpoint (legacy - redirects to /health endpoint from health router)"""
    # This endpoint is now handled by the health router
    # Keeping for backward compatibility
    from app.routes.health import health
    return await health()


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
