"""
Pydantic models for anomaly detection
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class AnomalyAlert(BaseModel):
    """Individual anomaly alert"""
    type: str = Field(..., description="Alert type: 'critical', 'rate_of_change', or 'ml_detected'")
    sensor: str = Field(..., description="Sensor name that triggered the alert")
    value: Optional[float] = Field(None, description="Sensor value (if applicable)")
    threshold: Optional[float] = Field(None, description="Threshold that was exceeded")
    rate: Optional[float] = Field(None, description="Rate of change (if applicable)")
    score: Optional[float] = Field(None, description="Anomaly score (0-1, if applicable)")
    contributing_features: Optional[List[str]] = Field(None, description="Features contributing to anomaly")
    message: str = Field(..., description="Human-readable alert message")
    severity: Literal["low", "medium", "high"] = Field(..., description="Alert severity level")


class AnomalyDetectionResult(BaseModel):
    """Result of anomaly detection on a single telemetry point"""
    is_anomaly: bool = Field(..., description="Whether any anomaly was detected")
    anomaly_score: float = Field(..., description="ML anomaly score (0-1, higher = more anomalous)")
    alerts: List[AnomalyAlert] = Field(default_factory=list, description="List of anomaly alerts")
    timestamp: str = Field(..., description="Timestamp of the telemetry point")
    vehicle_id: str = Field(..., description="Vehicle identifier")
    vehicle_number: Optional[int] = Field(None, description="Vehicle number")
    lap: Optional[int] = Field(None, description="Current lap number")


class AnomalyDetectionRequest(BaseModel):
    """Request for anomaly detection"""
    vehicle_id: str = Field(..., description="Vehicle identifier")
    telemetry_point: dict = Field(..., description="Telemetry data point as dictionary")


class AnomalyStats(BaseModel):
    """Statistics about anomalies detected"""
    total_points: int = Field(..., description="Total telemetry points analyzed")
    anomaly_count: int = Field(..., description="Number of points with anomalies")
    anomaly_rate: float = Field(..., description="Percentage of points with anomalies")
    critical_alerts: int = Field(..., description="Number of critical threshold alerts")
    rate_of_change_alerts: int = Field(..., description="Number of rate-of-change alerts")
    ml_detected_anomalies: int = Field(..., description="Number of ML-detected anomalies")
    avg_anomaly_score: float = Field(..., description="Average anomaly score")
    top_anomalous_sensors: List[dict] = Field(default_factory=list, description="Sensors with most anomalies")


class BatchAnomalyDetectionRequest(BaseModel):
    """Request for batch anomaly detection"""
    vehicle_id: str = Field(..., description="Vehicle identifier")
    track: str = Field(..., description="Track identifier")
    race: int = Field(..., description="Race number")
    lap_start: Optional[int] = Field(None, description="Starting lap")
    lap_end: Optional[int] = Field(None, description="Ending lap")
    retrain: bool = Field(True, description="Whether to retrain model on the data")


