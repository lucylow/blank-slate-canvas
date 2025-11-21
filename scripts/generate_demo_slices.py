#!/usr/bin/env python3
"""
Generate synthetic demo telemetry slices for demo mode
Creates small, representative JSON files for frontend development
"""
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta
import random

def generate_best_overtake(out_dir: Path):
    """Generate demo slice for best overtake scenario"""
    base_time = datetime.utcnow()
    frames = []
    
    # Simulate an overtake maneuver with high speed and lateral G
    for i in range(80):
        t = base_time + timedelta(milliseconds=i * 50)
        frame_time = t.isoformat() + "Z"
        
        # Accelerate, corner, accelerate
        if i < 20:
            speed = 80 + i * 2
            accx = 0.5 + (i / 20) * 0.3
            accy = 0.2
        elif i < 40:
            speed = 120 - (i - 20) * 1
            accx = -0.3
            accy = 1.8 + (i - 20) / 20 * 0.5  # High lateral G
        else:
            speed = 100 + (i - 40) * 1.5
            accx = 0.6
            accy = 0.1
        
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "speed",
            "telemetry_value": speed,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "accx_can",
            "telemetry_value": accx,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "accy_can",
            "telemetry_value": accy,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "brake_pressure",
            "telemetry_value": 0 if i < 35 or i > 45 else 120,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
    
    with open(out_dir / "best_overtake.json", "w") as f:
        json.dump(frames, f, indent=2)
    print(f"✓ Generated best_overtake.json ({len(frames)} frames)")

def generate_tire_cliff(out_dir: Path):
    """Generate demo slice for tire cliff scenario"""
    base_time = datetime.utcnow()
    frames = []
    
    # Simulate tire degradation causing performance drop
    for i in range(120):
        t = base_time + timedelta(milliseconds=i * 100)
        frame_time = t.isoformat() + "Z"
        
        # Tire temp rises, then performance drops
        tire_temp = 100 + i * 0.8 if i < 60 else 148 + (i - 60) * 0.3
        speed_factor = 1.0 if i < 80 else max(0.7, 1.0 - (i - 80) * 0.0075)
        
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "speed",
            "telemetry_value": 110 * speed_factor,
            "vehicle_id": "GR86-002",
            "vehicle_number": 2
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "tire_temp",
            "telemetry_value": tire_temp,
            "vehicle_id": "GR86-002",
            "vehicle_number": 2
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "brake_pressure",
            "telemetry_value": 85 + random.uniform(-5, 5),
            "vehicle_id": "GR86-002",
            "vehicle_number": 2
        })
    
    with open(out_dir / "tire_cliff.json", "w") as f:
        json.dump(frames, f, indent=2)
    print(f"✓ Generated tire_cliff.json ({len(frames)} frames)")

def generate_last_lap_push(out_dir: Path):
    """Generate demo slice for last lap push scenario"""
    base_time = datetime.utcnow()
    frames = []
    
    # Simulate aggressive last lap push
    for i in range(60):
        t = base_time + timedelta(milliseconds=i * 33)
        frame_time = t.isoformat() + "Z"
        
        # Aggressive driving with high speed and G-forces
        speed = 95 + i * 1.2 + random.uniform(-2, 2)
        accx = random.uniform(-0.8, 0.8)
        accy = 1.5 + random.uniform(-0.3, 0.5)
        brake = random.uniform(0, 140) if i % 3 == 0 else 0
        
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "speed",
            "telemetry_value": speed,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "accx_can",
            "telemetry_value": accx,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "accy_can",
            "telemetry_value": accy,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
        frames.append({
            "timestamp": frame_time,
            "telemetry_name": "brake_pressure",
            "telemetry_value": brake,
            "vehicle_id": "GR86-001",
            "vehicle_number": 1
        })
    
    with open(out_dir / "last_lap_push.json", "w") as f:
        json.dump(frames, f, indent=2)
    print(f"✓ Generated last_lap_push.json ({len(frames)} frames)")

def main():
    parser = argparse.ArgumentParser(description="Generate demo telemetry slices")
    parser.add_argument("--out", type=str, default="data/demo_slices", help="Output directory")
    args = parser.parse_args()
    
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("Generating Demo Telemetry Slices")
    print("=" * 60)
    
    generate_best_overtake(out_dir)
    generate_tire_cliff(out_dir)
    generate_last_lap_push(out_dir)
    
    print("=" * 60)
    print(f"✓ Generated all demo slices in {out_dir}")
    print("=" * 60)

if __name__ == "__main__":
    main()

