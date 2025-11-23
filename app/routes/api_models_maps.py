"""
API Models for Maps and Location Services
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ============================================================================
# Map Matching Models
# ============================================================================

class GPSPoint(BaseModel):
    """GPS point with timestamp"""
    ts: float = Field(..., description="Unix timestamp")
    lat: float = Field(..., description="Latitude")
    lon: float = Field(..., description="Longitude")


class MapMatchRequest(BaseModel):
    """Request for map matching"""
    track_id: str = Field(..., description="Track identifier")
    points: List[GPSPoint] = Field(..., description="GPS points to match")


class MatchedPoint(BaseModel):
    """Matched point with track-relative coordinates"""
    ts: float
    lat: float
    lon: float
    s: float = Field(..., description="Distance along track in meters")
    offset_m: float = Field(..., description="Lateral offset from centerline in meters")
    sector: str = Field(..., description="Sector ID")
    arc_kappa: float = Field(..., description="Curvature (1/m)")
    elevation: Optional[float] = None
    matched_lat: Optional[float] = None
    matched_lon: Optional[float] = None


class MapMatchResponse(BaseModel):
    """Response from map matching"""
    matches: List[MatchedPoint]


# ============================================================================
# Track Geometry Models
# ============================================================================

class Sector(BaseModel):
    """Track sector definition"""
    id: str
    start_s: float = Field(..., description="Start distance in meters")
    end_s: float = Field(..., description="End distance in meters")
    name: str


class ElevationPoint(BaseModel):
    """Elevation point along track"""
    s: float = Field(..., description="Distance along track in meters")
    elev: float = Field(..., description="Elevation in meters")


class TrackGeometryResponse(BaseModel):
    """Track geometry response"""
    track_id: str
    name: str
    centerline_geojson: Dict[str, Any] = Field(..., description="GeoJSON LineString")
    sectors: List[Sector]
    length_m: float
    elevation_profile: List[ElevationPoint]


# ============================================================================
# Telemetry Enrichment Models
# ============================================================================

class TelemetrySample(BaseModel):
    """Telemetry sample"""
    ts: float
    lat: Optional[float] = None
    lon: Optional[float] = None
    speed_kmh: Optional[float] = None
    rpm: Optional[float] = None
    can_brake: Optional[float] = None
    brake: Optional[float] = None
    throttle: Optional[float] = None
    gear: Optional[int] = None
    can_data: Optional[Dict[str, Any]] = None


class TelemetryEnrichmentRequest(BaseModel):
    """Request for telemetry enrichment"""
    chassis: str = Field(..., description="Vehicle identifier")
    track_id: Optional[str] = None
    samples: List[TelemetrySample]


class EnrichedTelemetrySample(TelemetrySample):
    """Enriched telemetry sample with spatial data"""
    s: Optional[float] = None
    sector: Optional[str] = None
    elevation: Optional[float] = None
    curvature: Optional[float] = None
    offset_m: Optional[float] = None
    on_racing_line: Optional[bool] = None


class TelemetryEnrichmentResponse(BaseModel):
    """Response from telemetry enrichment"""
    chassis: str
    enriched_samples: List[EnrichedTelemetrySample]


# ============================================================================
# Sector Metrics Models
# ============================================================================

class SectorMetric(BaseModel):
    """Sector-level metrics"""
    sector_id: str
    avg_speed_kmh: Optional[float] = None
    peak_brake_g: Optional[float] = None
    tire_temp_avg: Optional[float] = None
    min_speed_kmh: Optional[float] = None
    max_speed_kmh: Optional[float] = None
    avg_throttle: Optional[float] = None
    time_in_sector: Optional[float] = None


class SectorMetricsResponse(BaseModel):
    """Sector metrics response"""
    lap: int
    chassis: str
    track_id: str
    sectors: List[SectorMetric]


# ============================================================================
# Pit Route Optimization Models
# ============================================================================

class PitRouteRequest(BaseModel):
    """Request for pit route optimization"""
    vehicle: str = Field(..., description="Vehicle identifier")
    s_current: float = Field(..., description="Current position along track (meters)")
    track_id: str
    predicted_traffic: Optional[List[Dict[str, Any]]] = None


class PitRouteResponse(BaseModel):
    """Pit route optimization response"""
    entry_s: float = Field(..., description="Pit entry position (meters)")
    exit_s: float = Field(..., description="Pit exit position (meters)")
    expected_time_loss: float = Field(..., description="Expected time loss in seconds")
    route_geojson: Optional[Dict[str, Any]] = None
    recommendation: str = Field(..., description="Recommendation text")


# ============================================================================
# HUD/XR Feed Models
# ============================================================================

class PitWindowRecommendation(BaseModel):
    """Pit window recommendation"""
    recommendation: str = Field(..., description="e.g., 'Pit Now', 'Wait 2 laps'")
    delta_s: float = Field(..., description="Time delta in seconds")
    risk: int = Field(..., description="Risk level 0-100")


class HUDInsightUpdate(BaseModel):
    """HUD/XR insight update"""
    vehicle: str
    ts: float
    pit_window: Optional[PitWindowRecommendation] = None
    highlight_path: Optional[List[Dict[str, float]]] = None  # List of {lat, lon}
    evidence: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


# ============================================================================
# Edge Export Models
# ============================================================================

class EdgeExportRequest(BaseModel):
    """Request for edge export"""
    track_id: str
    bbox: Optional[List[float]] = None  # [min_lon, min_lat, max_lon, max_lat]
    model_version: Optional[str] = Field(None, description="Model version identifier")
    
    class Config:
        protected_namespaces = ()


class EdgeExportResponse(BaseModel):
    """Edge export response"""
    mbtiles_url: Optional[str] = None
    geojson_url: Optional[str] = None
    onnx_model_url: Optional[str] = None
    checksum: str
    manifest: Dict[str, Any]
    expires_at: Optional[datetime] = None


# ============================================================================
# Tile Spec Models
# ============================================================================

class TileSpecResponse(BaseModel):
    """Tile specification response"""
    track_id: str
    tileset_name: str
    min_zoom: int = 10
    max_zoom: int = 18
    tile_url_template: str = Field(..., description="Template: /tiles/{z}/{x}/{y}.pbf")
    bounds: List[float] = Field(..., description="[min_lon, min_lat, max_lon, max_lat]")

