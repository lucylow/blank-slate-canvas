#!/usr/bin/env python3
"""
Generate synthetic demo slices if none exist
"""
import json
import argparse
from pathlib import Path
from datetime import datetime, timedelta

def generate_tire_cliff(out_dir: Path):
    """Generate tire cliff scenario"""
    data = []
    base_time = datetime(2025, 11, 1, 10, 0, 0)
    for i in range(4):
        data.append({
            "meta_time": (base_time + timedelta(seconds=i)).isoformat() + "Z",
            "track": "sebring",
            "chassis": "GR86-002",
            "lap": 10 + i,
            "lapdist_m": 123.4 + i * 150.0,
            "speed_kmh": 210 - i * 2,
            "accx_can": 0.01 + i * 0.01,
            "accy_can": 0.2 + i * 0.05,
            "TireTempFL": 85 + i * 5
        })
    
    with open(out_dir / "tire_cliff.json", "w") as f:
        json.dump(data, f, indent=2)

def generate_overtake_seed(out_dir: Path):
    """Generate overtake scenario"""
    data = []
    base_time = datetime(2025, 11, 1, 10, 5, 0)
    for i in range(3):
        data.append({
            "meta_time": (base_time + timedelta(seconds=i)).isoformat() + "Z",
            "track": "cota",
            "chassis": "GR86-005",
            "lap": 8,
            "lapdist_m": 200.5 + i * 150.0,
            "speed_kmh": 215 + i * 2,
            "accx_can": 0.15 + i * 0.03,
            "accy_can": 1.2 + i * 0.2,
            "TireTempFL": 88 + i * 4
        })
    
    with open(out_dir / "overtake_seed.json", "w") as f:
        json.dump(data, f, indent=2)

def generate_driver_lockup(out_dir: Path):
    """Generate driver lockup scenario"""
    data = []
    base_time = datetime(2025, 11, 1, 10, 10, 0)
    for i in range(3):
        data.append({
            "meta_time": (base_time + timedelta(seconds=i)).isoformat() + "Z",
            "track": "sonoma",
            "chassis": "GR86-003",
            "lap": 15,
            "lapdist_m": 150.0 + i * 100.0,
            "speed_kmh": 180 - i * 5,
            "accx_can": -1.5 - i * 0.3,
            "accy_can": 0.1 + i * 0.05,
            "TireTempFL": 75 + i * 3
        })
    
    with open(out_dir / "driver_lockup.json", "w") as f:
        json.dump(data, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description="Generate demo slices")
    parser.add_argument("--out", default="data/demo_slices", help="Output directory")
    args = parser.parse_args()
    
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Generating demo slices in {out_dir}...")
    generate_tire_cliff(out_dir)
    generate_overtake_seed(out_dir)
    generate_driver_lockup(out_dir)
    print("Done!")

if __name__ == "__main__":
    main()
