"""
Telemetry data models
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TelemetryReading(BaseModel):
    """Single telemetry reading"""
    timestamp: str
    lap: int
    vehicle_number: int
    telemetry_name: str
    telemetry_value: float


class TelemetrySnapshot(BaseModel):
    """Aggregated telemetry at a specific timestamp"""
    timestamp: str
    lap: int
    vehicle_number: int
    speed: Optional[float] = None
    gear: Optional[int] = None
    nmot: Optional[float] = None  # RPM
    steering_angle: Optional[float] = None
    throttle: Optional[float] = None  # ath
    brake_front: Optional[float] = None  # pbrake_f
    brake_rear: Optional[float] = None  # pbrake_r
    accel_x: Optional[float] = None  # accx_can (longitudinal)
    accel_y: Optional[float] = None  # accy_can (lateral)


class LapTelemetry(BaseModel):
    """Aggregated telemetry for a complete lap"""
    lap: int
    vehicle_number: int
    lap_time: Optional[float] = None
    avg_speed: float
    max_speed: float
    avg_throttle: float
    avg_lateral_g: float
    avg_longitudinal_g: float
    max_lateral_g: float
    max_longitudinal_g: float
    heavy_braking_events: int
    hard_cornering_events: int
    gear_shifts: int
