"""
Advanced Analysis Engine for Real-Time Telemetry Processing

This service simulates realistic physics and runs real-time analytics:
- Tire Degradation: Based on cornering intensity (simulated G-forces)
- Sector Deltas: Comparing current pace against the "CV Optimal" line
- Anomaly Detection: Flags cars that deviate from the optimal line or stop unexpectedly
"""

import asyncio
import json
import math
import random
import time
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Dict, List, Optional, Tuple
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================================
# Data Models
# ============================================================================

class CarStatus(str, Enum):
    PIT = "pit"
    OUT_LAP = "out_lap"
    HOT_LAP = "hot_lap"
    IN_LAP = "in_lap"
    RETIRED = "retired"


@dataclass
class TrackNode:
    x: float
    y: float
    dist: float
    optimalSpeed: float
    curvature: float = 200.0
    elevation: float = 0.0


@dataclass
class CarState:
    id: str
    distance: float = 0.0  # Meters from start
    speed: float = 0.0  # KPH
    tire_health: float = 100.0  # %
    fuel: float = 50.0  # Liters
    lap: int = 0
    skill: float = 1.0  # 0.9 to 1.1 multiplier
    track_length: float = 5513.0
    status: CarStatus = CarStatus.PIT
    sector: int = 1
    last_update_time: float = 0.0
    sector_times: List[float] = None
    optimal_line_deviation: float = 0.0  # Meters
    g_force_lateral: float = 0.0
    g_force_longitudinal: float = 0.0
    
    def __post_init__(self):
        if self.sector_times is None:
            self.sector_times = []


class TelemetryPacket(BaseModel):
    id: str
    x: float
    y: float
    speed: float
    tire_health: float
    lap: int
    status: str
    sector: int
    fuel: float
    pace_delta: Optional[float] = None  # Seconds vs optimal
    optimal_line_deviation: Optional[float] = None


class Alert(BaseModel):
    car: str
    type: str
    msg: str
    severity: str = "warning"  # warning, critical, info
    timestamp: float = Field(default_factory=time.time)


class TelemetryResponse(BaseModel):
    telemetry: List[TelemetryPacket]
    alerts: List[Alert]
    timestamp: float
    race_time: Optional[float] = None


# ============================================================================
# Physics Simulation
# ============================================================================

class PhysicsEngine:
    """Realistic physics simulation for racing cars"""
    
    # Car constants
    MAX_SPEED = 320.0  # KPH
    MAX_ACCELERATION = 12.0  # m/s²
    MAX_BRAKING = -15.0  # m/s²
    TIRE_WEAR_BASE = 0.01  # Base wear per second
    TIRE_WEAR_CORNERING = 0.05  # Additional wear per G-force
    TIRE_WEAR_BRAKING = 0.03  # Additional wear per braking G
    FUEL_CONSUMPTION = 0.15  # Liters per second at full throttle
    
    @staticmethod
    def calculate_g_forces(
        speed: float,
        curvature: float,
        is_braking: bool,
        is_accelerating: bool
    ) -> Tuple[float, float]:
        """Calculate lateral and longitudinal G-forces"""
        # Lateral G-force from cornering (simplified)
        # F = mv²/r, so a = v²/r
        speed_ms = speed / 3.6  # Convert KPH to m/s
        if curvature > 0:
            lateral_g = (speed_ms ** 2) / (curvature * 9.81)
            lateral_g = min(lateral_g, 3.0)  # Cap at 3G
        else:
            lateral_g = 0.0
        
        # Longitudinal G-force
        if is_braking:
            longitudinal_g = -0.8  # Heavy braking
        elif is_accelerating:
            longitudinal_g = 0.5  # Acceleration
        else:
            longitudinal_g = 0.0
        
        return lateral_g, longitudinal_g
    
    @staticmethod
    def calculate_tire_wear(
        tire_health: float,
        lateral_g: float,
        longitudinal_g: float,
        dt: float
    ) -> float:
        """Calculate tire degradation based on forces"""
        # Base wear
        wear = PhysicsEngine.TIRE_WEAR_BASE * dt
        
        # Cornering wear (increases with lateral G)
        wear += abs(lateral_g) * PhysicsEngine.TIRE_WEAR_CORNERING * dt
        
        # Braking wear
        if longitudinal_g < 0:
            wear += abs(longitudinal_g) * PhysicsEngine.TIRE_WEAR_BRAKING * dt
        
        # Higher wear when tires are already degraded
        if tire_health < 50:
            wear *= 1.5
        
        return max(0, tire_health - (wear * 100))
    
    @staticmethod
    def calculate_fuel_consumption(
        fuel: float,
        throttle: float,
        dt: float
    ) -> float:
        """Calculate fuel consumption"""
        consumption = PhysicsEngine.FUEL_CONSUMPTION * throttle * dt
        return max(0, fuel - consumption)


# ============================================================================
# Race Orchestrator
# ============================================================================

class RaceOrchestrator:
    """Manages race state and car simulations"""
    
    def __init__(self):
        self.cars: Dict[str, CarState] = {}
        self.active_track = 'cota'
        self.track_data = self._load_track_data(self.active_track)
        self.race_start_time: Optional[float] = None
        self.optimal_lap_time = 120.0  # Seconds (mock optimal lap time)
    
    def _load_track_data(self, track_id: str) -> Dict:
        """Load track data (in production, load from JSON file)"""
        # Mock track data - in production, load from cv_track_data.ts JSON export
        track_configs = {
            'cota': {'length': 5513, 'optimal_lap': 120.0},
            'barber': {'length': 3830, 'optimal_lap': 95.0},
            'road_america': {'length': 6515, 'optimal_lap': 140.0},
            'sebring': {'length': 6020, 'optimal_lap': 135.0},
            'indy': {'length': 4149, 'optimal_lap': 110.0},
            'sonoma': {'length': 3854, 'optimal_lap': 92.0},
            'vir': {'length': 5284, 'optimal_lap': 125.0},
        }
        
        config = track_configs.get(track_id, track_configs['cota'])
        self.optimal_lap_time = config['optimal_lap']
        
        # Generate mock nodes (in production, load from actual track data)
        node_count = 200
        nodes = []
        for i in range(node_count):
            nodes.append({
                'x': 0.5 + 0.3 * math.sin(2 * math.pi * i / node_count),
                'y': 0.5 + 0.3 * math.cos(2 * math.pi * i / node_count),
                'optimalSpeed': 150 + 100 * random.random(),
                'curvature': 50 + 250 * random.random(),
                'elevation': (random.random() - 0.5) * 0.3
            })
        
        return {
            'length': config['length'],
            'nodes': nodes
        }
    
    def init_cars(self, count: int = 10):
        """Initialize cars for the race"""
        self.cars = {}
        for i in range(count):
            cid = f"GR-{i+1:02d}"
            skill = random.uniform(0.95, 1.05)
            self.cars[cid] = CarState(
                id=cid,
                track_length=self.track_data['length'],
                skill=skill,
                status=CarStatus.PIT if i < 3 else CarStatus.HOT_LAP,
                last_update_time=time.time()
            )
        
        if not self.race_start_time:
            self.race_start_time = time.time()
    
    def _find_current_node(self, car: CarState) -> Optional[Dict]:
        """Find the current track node for a car"""
        if not self.track_data['nodes']:
            return None
        
        node_idx = int((car.distance / car.track_length) * len(self.track_data['nodes'])) % len(self.track_data['nodes'])
        return self.track_data['nodes'][node_idx]
    
    def _update_car_physics(self, car: CarState, dt: float) -> None:
        """Update car physics simulation"""
        current_node = self._find_current_node(car)
        if not current_node:
            return
        
        # Determine target speed based on optimal line and skill
        target_speed = current_node['optimalSpeed'] * car.skill
        
        # Simple acceleration/braking physics
        speed_ms = car.speed / 3.6  # Convert to m/s
        
        if car.speed < target_speed:
            # Accelerate
            acceleration = PhysicsEngine.MAX_ACCELERATION * min(1.0, (target_speed - car.speed) / 50.0)
            is_accelerating = True
            is_braking = False
        else:
            # Brake
            acceleration = PhysicsEngine.MAX_BRAKING * min(1.0, (car.speed - target_speed) / 50.0)
            is_accelerating = False
            is_braking = True
        
        # Update speed
        new_speed_ms = max(0, speed_ms + acceleration * dt)
        car.speed = new_speed_ms * 3.6  # Convert back to KPH
        
        # Calculate G-forces
        curvature = current_node.get('curvature', 200.0)
        car.g_force_lateral, car.g_force_longitudinal = PhysicsEngine.calculate_g_forces(
            car.speed, curvature, is_braking, is_accelerating
        )
        
        # Update tire wear
        car.tire_health = PhysicsEngine.calculate_tire_wear(
            car.tire_health,
            car.g_force_lateral,
            car.g_force_longitudinal,
            dt
        )
        
        # Update fuel
        throttle = 1.0 if is_accelerating else 0.3
        car.fuel = PhysicsEngine.calculate_fuel_consumption(car.fuel, throttle, dt)
        
        # Move car
        dist_travelled = new_speed_ms * dt
        car.distance += dist_travelled
        
        # Update sector
        sector_length = car.track_length / 3
        new_sector = min(3, int(car.distance / sector_length) + 1)
        if new_sector != car.sector and car.sector < 3:
            # Sector completed
            car.sector = new_sector
        
        # Lap logic
        if car.distance >= car.track_length:
            car.distance -= car.track_length
            car.lap += 1
            car.sector = 1
        
        # Calculate optimal line deviation (simplified)
        if current_node:
            # In production, compare actual position to optimal line
            car.optimal_line_deviation = random.uniform(0, 5.0)  # Mock deviation
    
    def _generate_alerts(self, car: CarState) -> List[Alert]:
        """Generate alerts based on car state"""
        alerts = []
        
        # Tire wear alerts
        if car.tire_health < 20:
            alerts.append(Alert(
                car=car.id,
                type="TIRE_CRITICAL",
                msg=f"Tire wear critical: {car.tire_health:.1f}%",
                severity="critical"
            ))
        elif car.tire_health < 40:
            alerts.append(Alert(
                car=car.id,
                type="TIRE_WARNING",
                msg=f"Tire wear high: {car.tire_health:.1f}%",
                severity="warning"
            ))
        
        # Stopped car alert
        if car.speed < 10 and car.status == CarStatus.HOT_LAP:
            alerts.append(Alert(
                car=car.id,
                type="STOPPED",
                msg="Car stopped on track",
                severity="critical"
            ))
        
        # Fuel low alert
        if car.fuel < 5:
            alerts.append(Alert(
                car=car.id,
                type="FUEL_LOW",
                msg=f"Fuel low: {car.fuel:.1f}L",
                severity="warning"
            ))
        
        # Optimal line deviation
        if car.optimal_line_deviation > 10:
            alerts.append(Alert(
                car=car.id,
                type="LINE_DEVIATION",
                msg=f"Significant deviation from optimal line: {car.optimal_line_deviation:.1f}m",
                severity="info"
            ))
        
        return alerts
    
    def step(self, dt: float = 0.1) -> TelemetryResponse:
        """Step the simulation forward"""
        telemetry = []
        all_alerts = []
        
        for car in self.cars.values():
            # Update physics
            self._update_car_physics(car, dt)
            
            # Generate alerts
            alerts = self._generate_alerts(car)
            all_alerts.extend(alerts)
            
            # Calculate pace delta (simplified - compare to optimal lap time)
            pace_delta = None
            if car.lap > 0:
                # Mock pace delta calculation
                pace_delta = random.uniform(-2.0, 5.0)
            
            # Get current position
            current_node = self._find_current_node(car)
            x = current_node['x'] if current_node else 0.5
            y = current_node['y'] if current_node else 0.5
            
            # Create telemetry packet
            packet = TelemetryPacket(
                id=car.id,
                x=x,
                y=y,
                speed=car.speed,
                tire_health=car.tire_health,
                lap=car.lap,
                status=car.status.value,
                sector=car.sector,
                fuel=car.fuel,
                pace_delta=pace_delta,
                optimal_line_deviation=car.optimal_line_deviation
            )
            telemetry.append(packet)
        
        # Calculate race time
        race_time = None
        if self.race_start_time:
            race_time = time.time() - self.race_start_time
        
        return TelemetryResponse(
            telemetry=telemetry,
            alerts=all_alerts,
            timestamp=time.time(),
            race_time=race_time
        )


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(title="Telemetry Analysis Engine")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global orchestrator instance
manager = RaceOrchestrator()
manager.init_cars(count=10)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "active_cars": len(manager.cars),
        "active_track": manager.active_track,
        "race_time": time.time() - manager.race_start_time if manager.race_start_time else 0
    }


@app.post("/api/set_track/{track_id}")
async def set_track(track_id: str):
    """Change the active track"""
    manager.active_track = track_id
    manager.track_data = manager._load_track_data(track_id)
    # Reset cars for new track
    manager.init_cars(count=len(manager.cars))
    return {"status": "ok", "track": track_id}


@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time telemetry"""
    await websocket.accept()
    
    try:
        last_update = time.time()
        while True:
            current_time = time.time()
            dt = current_time - last_update
            last_update = current_time
            
            # Clamp dt to prevent large jumps
            dt = min(dt, 0.2)
            
            # Step simulation
            data = manager.step(dt=0.1)  # Fixed timestep for consistency
            
            # Send telemetry
            await websocket.send_json(data.dict())
            
            # 10Hz update rate
            await asyncio.sleep(0.1)
            
    except WebSocketDisconnect:
        print(f"Client disconnected: {websocket.client}")
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

