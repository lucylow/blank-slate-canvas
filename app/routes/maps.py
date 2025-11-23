"""
Maps and Location API Routes
Implements mapping & location APIs for PitWall hack
"""
from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from typing import List, Optional, Dict, Any
import logging
import json
import asyncio
from datetime import datetime
import time

from app.routes.api_models_maps import (
    MapMatchRequest, MapMatchResponse, MatchedPoint,
    TrackGeometryResponse, Sector, ElevationPoint,
    TelemetryEnrichmentRequest, TelemetryEnrichmentResponse, EnrichedTelemetrySample,
    SectorMetricsResponse, SectorMetric,
    PitRouteRequest, PitRouteResponse,
    HUDInsightUpdate, PitWindowRecommendation,
    EdgeExportRequest, EdgeExportResponse,
    TileSpecResponse
)
from app.services.map_service import map_service
from app.config import TRACKS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/maps", tags=["Maps & Location"])

# Mock data for fallback
MOCK_SECTOR_METRICS = {
    "s1": {"avg_speed_kmh": 185.0, "peak_brake_g": 1.45, "tire_temp_avg": 82.3},
    "s2": {"avg_speed_kmh": 195.0, "peak_brake_g": 1.32, "tire_temp_avg": 85.1},
    "s3": {"avg_speed_kmh": 178.0, "peak_brake_g": 1.58, "tire_temp_avg": 79.8}
}


# ============================================================================
# Track Geometry Endpoints
# ============================================================================

@router.get("/track/{track_id}", response_model=TrackGeometryResponse)
async def get_track_geometry(track_id: str):
    """
    Get track geometry, sectors, and metadata
    
    Returns centerline GeoJSON, sectors, length, and elevation profile.
    """
    logger.info(f"Track geometry request: {track_id}")
    
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    geometry = map_service.get_track_geometry(track_id)
    if not geometry:
        raise HTTPException(status_code=404, detail=f"Geometry not found for track '{track_id}'")
    
    track_config = TRACKS[track_id]
    
    return TrackGeometryResponse(
        track_id=track_id,
        name=track_config["name"],
        centerline_geojson=geometry["centerline_geojson"],
        sectors=[Sector(**s) for s in geometry["sectors"]],
        length_m=geometry["length_m"],
        elevation_profile=[ElevationPoint(**e) for e in geometry["elevation_profile"]]
    )


@router.get("/track/{track_id}/tilespec", response_model=TileSpecResponse)
async def get_tile_spec(track_id: str):
    """
    Get tile specification for track
    
    Returns tile URL template, zoom levels, and bounds.
    """
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    geometry = map_service.get_track_geometry(track_id)
    if not geometry:
        raise HTTPException(status_code=404, detail=f"Geometry not found for track '{track_id}'")
    
    # Calculate bounds from centerline
    coords = geometry["centerline_geojson"]["coordinates"]
    lons = [c[0] for c in coords]
    lats = [c[1] for c in coords]
    
    return TileSpecResponse(
        track_id=track_id,
        tileset_name=f"{track_id}_tiles",
        min_zoom=10,
        max_zoom=18,
        tile_url_template=f"/api/maps/tiles/{track_id}/{{z}}/{{x}}/{{y}}.pbf",
        bounds=[min(lons), min(lats), max(lons), max(lats)]
    )


# ============================================================================
# Map Matching Endpoints
# ============================================================================

@router.post("/match", response_model=MapMatchResponse)
async def match_points(request: MapMatchRequest):
    """
    Snap raw GPS telemetry points to nearest track centerline
    
    Returns track-relative coordinates (s, offset), sector, curvature.
    """
    logger.info(f"Map matching request: track={request.track_id}, points={len(request.points)}")
    
    if request.track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{request.track_id}' not found")
    
    try:
        # Convert to dict format for service
        points = [{"ts": p.ts, "lat": p.lat, "lon": p.lon} for p in request.points]
        matches = map_service.match_points(request.track_id, points)
        
        return MapMatchResponse(
            matches=[MatchedPoint(**m) for m in matches]
        )
    except Exception as e:
        logger.error(f"Map matching error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Map matching failed: {str(e)}")


# ============================================================================
# Telemetry Enrichment Endpoints
# ============================================================================

@router.post("/telemetry/enrich", response_model=TelemetryEnrichmentResponse)
async def enrich_telemetry(request: TelemetryEnrichmentRequest):
    """
    Enrich telemetry samples with spatial data (s, sector, elevation, curvature)
    
    Adds track-relative coordinates and spatial features to telemetry.
    """
    logger.info(f"Telemetry enrichment request: chassis={request.chassis}, samples={len(request.samples)}")
    
    track_id = request.track_id
    if not track_id:
        # Try to infer from first sample's location
        if request.samples and request.samples[0].lat and request.samples[0].lon:
            # Simple heuristic: find closest track
            track_id = "sebring"  # Default fallback
        else:
            raise HTTPException(status_code=400, detail="track_id required or provide lat/lon in samples")
    
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    try:
        # Convert to dict format
        samples = []
        for s in request.samples:
            sample_dict = s.dict(exclude_none=True)
            samples.append(sample_dict)
        
        enriched = map_service.enrich_telemetry(track_id, samples)
        
        # Convert back to EnrichedTelemetrySample
        enriched_samples = []
        for e in enriched:
            enriched_samples.append(EnrichedTelemetrySample(**e))
        
        return TelemetryEnrichmentResponse(
            chassis=request.chassis,
            enriched_samples=enriched_samples
        )
    except Exception as e:
        logger.error(f"Telemetry enrichment error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Enrichment failed: {str(e)}")


# ============================================================================
# Sector Metrics Endpoints
# ============================================================================

@router.get("/track/{track_id}/sector_metrics", response_model=SectorMetricsResponse)
async def get_sector_metrics(
    track_id: str,
    lap: int = Query(..., description="Lap number"),
    chassis: str = Query(..., description="Vehicle identifier")
):
    """
    Get per-sector metrics computed from telemetry for a lap
    
    Returns avg speed, peak brake G, tire temp, etc. per sector.
    """
    logger.info(f"Sector metrics request: track={track_id}, lap={lap}, chassis={chassis}")
    
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    # TODO: In production, load actual telemetry and compute metrics
    # For now, return mock data
    geometry = map_service.get_track_geometry(track_id)
    if not geometry:
        raise HTTPException(status_code=404, detail=f"Geometry not found for track '{track_id}'")
    
    sectors = []
    for sector_def in geometry["sectors"]:
        sector_id = sector_def["id"]
        # Use mock metrics or compute from data
        metrics = MOCK_SECTOR_METRICS.get(sector_id, {
            "avg_speed_kmh": 180.0,
            "peak_brake_g": 1.4,
            "tire_temp_avg": 80.0
        })
        
        sectors.append(SectorMetric(
            sector_id=sector_id,
            **metrics
        ))
    
    return SectorMetricsResponse(
        lap=lap,
        chassis=chassis,
        track_id=track_id,
        sectors=sectors
    )


# ============================================================================
# Pit Route Optimization
# ============================================================================

@router.post("/optimization/pit-route", response_model=PitRouteResponse)
async def optimize_pit_route(request: PitRouteRequest):
    """
    Compute safe pit entry routing for a car given current track traffic
    
    Returns entry/exit positions and expected time loss.
    """
    logger.info(f"Pit route optimization: vehicle={request.vehicle}, s={request.s_current}")
    
    if request.track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{request.track_id}' not found")
    
    geometry = map_service.get_track_geometry(request.track_id)
    if not geometry:
        raise HTTPException(status_code=404, detail=f"Geometry not found for track '{request.track_id}'")
    
    # Mock pit route calculation
    # In production, use actual routing algorithm with traffic
    length_m = geometry["length_m"]
    entry_s = length_m * 0.85  # Pit entry at 85% of track
    exit_s = length_m * 0.05   # Pit exit at 5% of track
    
    # Calculate time loss (mock)
    time_loss = 25.0  # Base pit stop time
    
    # Generate route GeoJSON (simplified)
    route_coords = geometry["centerline_geojson"]["coordinates"][
        int(len(geometry["centerline_geojson"]["coordinates"]) * 0.85):
        int(len(geometry["centerline_geojson"]["coordinates"]) * 0.95)
    ]
    
    route_geojson = {
        "type": "LineString",
        "coordinates": route_coords
    }
    
    return PitRouteResponse(
        entry_s=entry_s,
        exit_s=exit_s,
        expected_time_loss=time_loss,
        route_geojson=route_geojson,
        recommendation="Pit entry recommended at sector 3, exit at sector 1"
    )


# ============================================================================
# HUD/XR Feed (SSE)
# ============================================================================

@router.get("/sse/hud/{vehicle}")
async def hud_sse_feed(vehicle: str):
    """
    Server-Sent Events feed for HUD/XR overlays
    
    Provides low-latency insight updates for heads-up displays.
    """
    logger.info(f"HUD SSE feed started for vehicle: {vehicle}")
    
    async def event_generator():
        """Generate SSE events"""
        try:
            while True:
                # Generate mock insight update
                update = HUDInsightUpdate(
                    vehicle=vehicle,
                    ts=time.time(),
                    pit_window=PitWindowRecommendation(
                        recommendation="Pit Now",
                        delta_s=-3.8,
                        risk=22
                    ),
                    highlight_path=[
                        {"lat": 27.4547, "lon": -80.3478},
                        {"lat": 27.4550, "lon": -80.3475}
                    ],
                    evidence={
                        "s": 1234.1,
                        "sector": "s2",
                        "trace_url": f"/api/telemetry/replay/{vehicle}/1234"
                    },
                    message="Tire wear approaching threshold"
                )
                
                # Format as SSE
                data = json.dumps(update.dict(), default=str)
                yield f"data: {data}\n\n"
                
                # Wait before next update
                await asyncio.sleep(1.0)  # 1 second interval
                
        except asyncio.CancelledError:
            logger.info(f"HUD SSE feed cancelled for vehicle: {vehicle}")
        except Exception as e:
            logger.error(f"HUD SSE feed error: {e}", exc_info=True)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ============================================================================
# Edge Export
# ============================================================================

@router.post("/edge/export", response_model=EdgeExportResponse)
async def export_edge_assets(request: EdgeExportRequest):
    """
    Export map assets and models for edge devices (Jetson, WebXR)
    
    Returns signed URLs to MBTiles, GeoJSON, and ONNX models.
    """
    logger.info(f"Edge export request: track={request.track_id}, bbox={request.bbox}")
    
    if request.track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{request.track_id}' not found")
    
    # Mock export URLs
    # In production, generate actual signed URLs to S3/cloud storage
    base_url = f"/api/maps/edge/download/{request.track_id}"
    
    return EdgeExportResponse(
        mbtiles_url=f"{base_url}/tiles.mbtiles",
        geojson_url=f"{base_url}/geometry.geojson",
        onnx_model_url=f"{base_url}/model.onnx",
        checksum="abc123def456",
        manifest={
            "track_id": request.track_id,
            "model_version": request.model_version or "1.0.0",
            "exported_at": datetime.utcnow().isoformat(),
            "bbox": request.bbox or [0, 0, 0, 0]
        },
        expires_at=datetime.utcnow().replace(hour=23, minute=59, second=59)
    )


# ============================================================================
# Tile Endpoints (Mock)
# ============================================================================

@router.get("/tiles/{track_id}/{z}/{x}/{y}.pbf")
async def get_tile(track_id: str, z: int, x: int, y: int):
    """
    Get vector tile for track (PBF format)
    
    Returns Mapbox Vector Tile (MVT) in Protocol Buffer format.
    """
    if track_id not in TRACKS:
        raise HTTPException(status_code=404, detail=f"Track '{track_id}' not found")
    
    # Mock tile response
    # In production, serve actual MBTiles or generate on-the-fly
    logger.debug(f"Tile request: track={track_id}, z={z}, x={x}, y={y}")
    
    # Return empty tile for now (valid PBF format)
    # In production, use tileserver-gl or similar
    return JSONResponse(
        content={"message": "Tile generation not yet implemented, use GeoJSON endpoint"},
        status_code=501
    )

