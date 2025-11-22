"""
Analytics and AI prediction models
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict


class TireWearData(BaseModel):
    """Tire wear percentages for all four tires"""
    front_left: float = Field(..., ge=0, le=100, description="Front left tire wear %")
    front_right: float = Field(..., ge=0, le=100, description="Front right tire wear %")
    rear_left: float = Field(..., ge=0, le=100, description="Rear left tire wear %")
    rear_right: float = Field(..., ge=0, le=100, description="Rear right tire wear %")
    predicted_laps_remaining: Optional[int] = None
    pit_window_optimal: Optional[List[int]] = None
    # Enhanced fields for explainability and uncertainty
    confidence: Optional[float] = Field(None, ge=0, le=1, description="Confidence score (0-1)")
    ci_lower: Optional[Dict[str, float]] = Field(None, description="Lower confidence intervals for each tire")
    ci_upper: Optional[Dict[str, float]] = Field(None, description="Upper confidence intervals for each tire")
    top_features: Optional[Dict[str, float]] = Field(None, description="Top contributing features with importance scores")
    sector_contributions: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Sector-level contributions to tire wear (e.g., {'S1': {'contribution': 0.35, 'reason': 'high brake power'}})")
    model_version: Optional[str] = Field(None, description="Model version used for prediction")


class PerformanceMetrics(BaseModel):
    """Driver performance metrics"""
    current_lap: str = Field(..., description="Current lap time (MM:SS.sss)")
    best_lap: str = Field(..., description="Best lap time (MM:SS.sss)")
    gap_to_leader: str = Field(..., description="Gap to race leader (+SS.sss)")
    predicted_finish: str = Field(..., description="Predicted finish position (e.g., P3)")
    position: int = Field(..., description="Current race position")
    lap_number: int = Field(..., description="Current lap number")
    total_laps: int = Field(..., description="Total laps in race")


class SectorAnalysis(BaseModel):
    """Sector performance analysis"""
    sector: str
    time: float
    delta_to_best: float
    improvement_potential: str  # "low", "medium", "high"


class GapAnalysis(BaseModel):
    """Gap analysis to competitors"""
    position: int
    gap_to_leader: str
    gap_to_ahead: Optional[str] = None
    gap_to_behind: Optional[str] = None
    overtaking_opportunity: bool = False
    under_pressure: bool = False
    closing_rate_ahead: Optional[str] = None


class StrategyRecommendation(BaseModel):
    """Race strategy recommendation"""
    name: str
    pit_lap: int
    expected_finish: str
    expected_time: str
    confidence: float = Field(..., ge=0, le=1)
    reasoning: str


class StrategyOptimization(BaseModel):
    """Strategy optimization results"""
    recommended_strategy: str
    strategies: List[StrategyRecommendation]
    current_tire_laps: int
    fuel_remaining_laps: int


class DashboardData(BaseModel):
    """Complete dashboard data"""
    track: str
    race: int
    vehicle_number: int
    lap: int
    total_laps: int
    tire_wear: TireWearData
    performance: PerformanceMetrics
    gap_analysis: GapAnalysis
    timestamp: str
    live_data: bool = True


class TireWearRequest(BaseModel):
    """Request for tire wear prediction"""
    track: str
    race: int
    vehicle_number: int
    lap: int


class PerformanceRequest(BaseModel):
    """Request for performance analysis"""
    track: str
    race: int
    vehicle_number: int
    lap: int


class StrategyRequest(BaseModel):
    """Request for strategy optimization"""
    track: str
    race: int
    vehicle_number: int
    current_lap: int
    total_laps: int
    current_position: int
    tire_laps: int
