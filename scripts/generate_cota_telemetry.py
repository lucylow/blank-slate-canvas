#!/usr/bin/env python3
"""
Generate mock telemetry data for 22 drivers racing at Circuit of the Americas (COTA).
Each driver has unique driving patterns and characteristics.
"""

import json
import random
import math
from typing import Dict, List

# Circuit of the Americas track characteristics
COTA_TRACK_LENGTH = 5513  # meters
COTA_LAP_TIME_AVG = 120  # seconds (2 minutes average lap time)
SAMPLES_PER_DRIVER = 250  # 250ms intervals = 4Hz, ~62.5 seconds of data

# Driver characteristics - each driver has unique patterns
DRIVER_PROFILES = {
    "GR86-001": {
        "name": "Aggressive Racer",
        "max_speed": 320,
        "corner_speed": 95,
        "throttle_style": "aggressive",  # aggressive, smooth, progressive
        "brake_style": "late",  # early, late, smooth
        "shift_style": "late",  # early, late, balanced
        "rpm_range": (2000, 11500),
        "base_performance": 1.0
    },
    "GR86-002": {
        "name": "Smooth Operator",
        "max_speed": 310,
        "corner_speed": 85,
        "throttle_style": "smooth",
        "brake_style": "early",
        "shift_style": "early",
        "rpm_range": (2500, 11000),
        "base_performance": 0.95
    },
    "GR86-003": {
        "name": "Late Braker",
        "max_speed": 315,
        "corner_speed": 90,
        "throttle_style": "progressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2200, 11200),
        "base_performance": 0.98
    },
    "GR86-004": {
        "name": "Consistent Performer",
        "max_speed": 305,
        "corner_speed": 88,
        "throttle_style": "smooth",
        "brake_style": "smooth",
        "shift_style": "balanced",
        "rpm_range": (2400, 10800),
        "base_performance": 0.92
    },
    "GR86-005": {
        "name": "Speed Demon",
        "max_speed": 325,
        "corner_speed": 92,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2000, 11800),
        "base_performance": 1.05
    },
    "GR86-006": {
        "name": "Technical Driver",
        "max_speed": 308,
        "corner_speed": 87,
        "throttle_style": "progressive",
        "brake_style": "early",
        "shift_style": "early",
        "rpm_range": (2500, 10900),
        "base_performance": 0.94
    },
    "GR86-007": {
        "name": "Risky Racer",
        "max_speed": 318,
        "corner_speed": 93,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2100, 11600),
        "base_performance": 1.02
    },
    "GR86-008": {
        "name": "Precision Pilot",
        "max_speed": 312,
        "corner_speed": 89,
        "throttle_style": "smooth",
        "brake_style": "smooth",
        "shift_style": "balanced",
        "rpm_range": (2300, 11000),
        "base_performance": 0.96
    },
    "GR86-009": {
        "name": "Power User",
        "max_speed": 322,
        "corner_speed": 91,
        "throttle_style": "aggressive",
        "brake_style": "smooth",
        "shift_style": "late",
        "rpm_range": (2000, 11400),
        "base_performance": 1.0
    },
    "GR86-010": {
        "name": "Steady Eddie",
        "max_speed": 300,
        "corner_speed": 82,
        "throttle_style": "smooth",
        "brake_style": "early",
        "shift_style": "early",
        "rpm_range": (2600, 10500),
        "base_performance": 0.88
    },
    "GR86-011": {
        "name": "Corner Specialist",
        "max_speed": 307,
        "corner_speed": 94,
        "throttle_style": "progressive",
        "brake_style": "smooth",
        "shift_style": "balanced",
        "rpm_range": (2400, 11100),
        "base_performance": 0.97
    },
    "GR86-012": {
        "name": "Straight Line King",
        "max_speed": 328,
        "corner_speed": 86,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (1900, 11900),
        "base_performance": 1.03
    },
    "GR86-013": {
        "name": "Balanced Driver",
        "max_speed": 313,
        "corner_speed": 88,
        "throttle_style": "progressive",
        "brake_style": "smooth",
        "shift_style": "balanced",
        "rpm_range": (2300, 11000),
        "base_performance": 0.95
    },
    "GR86-014": {
        "name": "RPM Maximizer",
        "max_speed": 316,
        "corner_speed": 90,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2100, 11700),
        "base_performance": 1.01
    },
    "GR86-015": {
        "name": "Fuel Saver",
        "max_speed": 302,
        "corner_speed": 84,
        "throttle_style": "smooth",
        "brake_style": "early",
        "shift_style": "early",
        "rpm_range": (2700, 10600),
        "base_performance": 0.90
    },
    "GR86-016": {
        "name": "Race Leader",
        "max_speed": 324,
        "corner_speed": 93,
        "throttle_style": "aggressive",
        "brake_style": "smooth",
        "shift_style": "late",
        "rpm_range": (2000, 11500),
        "base_performance": 1.04
    },
    "GR86-017": {
        "name": "Tire Preserver",
        "max_speed": 304,
        "corner_speed": 85,
        "throttle_style": "smooth",
        "brake_style": "smooth",
        "shift_style": "early",
        "rpm_range": (2500, 10700),
        "base_performance": 0.91
    },
    "GR86-018": {
        "name": "Overtake Master",
        "max_speed": 319,
        "corner_speed": 92,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2100, 11600),
        "base_performance": 1.01
    },
    "GR86-019": {
        "name": "Consistency King",
        "max_speed": 311,
        "corner_speed": 88,
        "throttle_style": "progressive",
        "brake_style": "smooth",
        "shift_style": "balanced",
        "rpm_range": (2400, 10900),
        "base_performance": 0.96
    },
    "GR86-020": {
        "name": "Young Gun",
        "max_speed": 321,
        "corner_speed": 91,
        "throttle_style": "aggressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2000, 11400),
        "base_performance": 1.02
    },
    "GR86-021": {
        "name": "Veteran Racer",
        "max_speed": 309,
        "corner_speed": 89,
        "throttle_style": "smooth",
        "brake_style": "early",
        "shift_style": "balanced",
        "rpm_range": (2400, 10800),
        "base_performance": 0.93
    },
    "GR86-022": {
        "name": "Comeback Kid",
        "max_speed": 317,
        "corner_speed": 90,
        "throttle_style": "progressive",
        "brake_style": "late",
        "shift_style": "late",
        "rpm_range": (2200, 11300),
        "base_performance": 0.99
    }
}


def generate_speed_profile(profile: Dict, sample_index: int, total_samples: int) -> float:
    """Generate speed based on track position and driver profile."""
    # Simulate a lap: start/finish line -> straight -> corner -> straight -> etc.
    progress = (sample_index % total_samples) / total_samples
    
    # COTA has multiple sectors: straights and corners
    # Sector 1: Start straight (0-0.15) -> Turn 1 (0.15-0.2) -> Straight (0.2-0.4)
    # Sector 2: Technical section (0.4-0.6) -> Straight (0.6-0.75)
    # Sector 3: Final corners (0.75-0.9) -> Finish straight (0.9-1.0)
    
    if 0.0 <= progress < 0.15 or 0.2 <= progress < 0.4 or 0.6 <= progress < 0.75 or 0.9 <= progress < 1.0:
        # Straight sections
        base_speed = profile["max_speed"] * (0.85 + random.uniform(0, 0.15))
    elif 0.15 <= progress < 0.2 or 0.4 <= progress < 0.6:
        # Technical/corner sections
        base_speed = profile["corner_speed"] * (0.9 + random.uniform(0, 0.2))
    else:  # 0.75-0.9: Final corners
        base_speed = profile["corner_speed"] * (0.85 + random.uniform(0, 0.25))
    
    # Add noise
    speed = base_speed + random.uniform(-5, 5)
    return max(50, min(profile["max_speed"] + 10, speed))


def generate_throttle(speed: float, profile: Dict, brake_pct: float) -> float:
    """Generate throttle percentage based on speed and driver style."""
    if brake_pct > 5:  # Don't throttle while braking
        return max(0, random.uniform(0, 10))
    
    # Throttle increases with speed on straights, decreases in corners
    if speed > 200:
        base_throttle = 75 + random.uniform(0, 25)
    elif speed > 150:
        base_throttle = 60 + random.uniform(0, 30)
    elif speed > 100:
        base_throttle = 40 + random.uniform(0, 40)
    else:
        base_throttle = 20 + random.uniform(0, 50)
    
    # Apply driver style
    if profile["throttle_style"] == "aggressive":
        throttle = base_throttle * (1.0 + random.uniform(0, 0.2))
    elif profile["throttle_style"] == "smooth":
        throttle = base_throttle * (0.85 + random.uniform(0, 0.15))
    else:  # progressive
        throttle = base_throttle * (0.9 + random.uniform(0, 0.2))
    
    return max(0, min(100, throttle))


def generate_brake(speed: float, profile: Dict, throttle_pct: float) -> float:
    """Generate brake percentage based on speed and driver style."""
    if throttle_pct > 20:  # Don't brake while throttling hard
        return max(0, random.uniform(0, 15))
    
    # Brake more in corners and when slowing down
    if speed < 100:
        base_brake = 30 + random.uniform(0, 40)
    elif speed < 150:
        base_brake = 20 + random.uniform(0, 50)
    elif speed < 200:
        base_brake = 10 + random.uniform(0, 40)
    else:
        base_brake = 5 + random.uniform(0, 30)
    
    # Apply driver style
    if profile["brake_style"] == "late":
        brake = base_brake * (1.1 + random.uniform(0, 0.3))
    elif profile["brake_style"] == "early":
        brake = base_brake * (0.7 + random.uniform(0, 0.2))
    else:  # smooth
        brake = base_brake * (0.9 + random.uniform(0, 0.2))
    
    return max(0, min(100, brake))


def generate_gear(speed: float, profile: Dict) -> int:
    """Generate gear based on speed and driver shift style."""
    # Gear selection based on speed
    if speed < 80:
        base_gear = 2
    elif speed < 120:
        base_gear = 3
    elif speed < 160:
        base_gear = 4
    elif speed < 200:
        base_gear = 5
    elif speed < 250:
        base_gear = 6
    else:
        base_gear = 7
    
    # Apply shift style
    if profile["shift_style"] == "late":
        gear = min(7, base_gear + random.choice([0, 0, 1]))  # Tend to stay in lower gear longer
    elif profile["shift_style"] == "early":
        gear = max(1, base_gear - random.choice([0, 0, 1]))  # Shift up earlier
    else:  # balanced
        gear = base_gear + random.choice([-1, 0, 1])
    
    return max(1, min(7, gear))


def generate_rpm(speed: float, gear: int, profile: Dict, throttle_pct: float) -> int:
    """Generate RPM based on speed, gear, and throttle."""
    # RPM calculation: higher speed and lower gear = higher RPM
    # Each gear has a speed range
    gear_ratios = {
        1: (0, 60),
        2: (50, 100),
        3: (90, 140),
        4: (130, 180),
        5: (170, 220),
        6: (210, 270),
        7: (260, 350)
    }
    
    min_speed, max_speed = gear_ratios.get(gear, (0, 350))
    
    # Calculate base RPM
    if max_speed > 0:
        speed_ratio = (speed - min_speed) / (max_speed - min_speed)
        speed_ratio = max(0, min(1, speed_ratio))
    else:
        speed_ratio = 0.5
    
    # Base RPM range for gear
    min_rpm, max_rpm = profile["rpm_range"]
    base_rpm = min_rpm + (max_rpm - min_rpm) * speed_ratio
    
    # Adjust based on throttle
    if throttle_pct > 80:
        rpm_multiplier = 1.0 + (throttle_pct - 80) / 100
    elif throttle_pct < 20:
        rpm_multiplier = 0.85 + (throttle_pct / 20) * 0.15
    else:
        rpm_multiplier = 0.9 + (throttle_pct / 100) * 0.2
    
    rpm = base_rpm * rpm_multiplier
    
    # Add noise
    rpm += random.uniform(-200, 200)
    
    return max(1000, min(12000, int(rpm)))


def generate_driver_telemetry(driver_id: str, profile: Dict, num_samples: int) -> List[Dict]:
    """Generate telemetry data for a single driver."""
    telemetry = []
    
    for i in range(num_samples):
        timestamp_ms = i * 250  # 250ms intervals
        
        # Generate speed first (drives other parameters)
        speed = generate_speed_profile(profile, i, num_samples)
        
        # Generate brake (affects throttle)
        brake_pct = generate_brake(speed, profile, 0)
        
        # Generate throttle (affected by brake)
        throttle_pct = generate_throttle(speed, profile, brake_pct)
        
        # Recalculate brake if throttle is high
        if throttle_pct > 50:
            brake_pct = max(0, brake_pct * 0.3)
        
        # Generate gear
        gear = generate_gear(speed, profile)
        
        # Generate RPM
        engine_rpm = generate_rpm(speed, gear, profile, throttle_pct)
        
        telemetry.append({
            "timestamp_ms": timestamp_ms,
            "speed_kmh": round(speed, 2),
            "throttle_pct": round(throttle_pct, 2),
            "brake_pct": round(brake_pct, 2),
            "gear": gear,
            "engine_rpm": engine_rpm
        })
    
    return telemetry


def main():
    """Generate telemetry data for all 22 drivers."""
    print("Generating mock telemetry data for 22 drivers at Circuit of the Americas...")
    
    all_telemetry = {}
    
    for driver_id, profile in DRIVER_PROFILES.items():
        print(f"Generating data for {driver_id} - {profile['name']}...")
        telemetry = generate_driver_telemetry(driver_id, profile, SAMPLES_PER_DRIVER)
        all_telemetry[driver_id] = {
            "driver_name": profile["name"],
            "telemetry": telemetry
        }
    
    # Save to JSON file
    output_file = "data/cota_22_drivers_telemetry.json"
    with open(output_file, "w") as f:
        json.dump({
            "track": "Circuit of the Americas",
            "track_id": "cota",
            "location": "Austin, Texas",
            "track_length_m": COTA_TRACK_LENGTH,
            "sample_rate_hz": 4,
            "samples_per_driver": SAMPLES_PER_DRIVER,
            "drivers": all_telemetry
        }, f, indent=2)
    
    print(f"\n✅ Generated telemetry data for 22 drivers")
    print(f"📁 Saved to: {output_file}")
    print(f"📊 Total samples: {SAMPLES_PER_DRIVER * 22}")
    
    # Print summary
    print("\n📈 Driver Summary:")
    for driver_id, data in all_telemetry.items():
        telemetry = data["telemetry"]
        avg_speed = sum(t["speed_kmh"] for t in telemetry) / len(telemetry)
        max_speed = max(t["speed_kmh"] for t in telemetry)
        print(f"  {driver_id}: {data['driver_name']:20s} | Avg: {avg_speed:6.1f} km/h | Max: {max_speed:6.1f} km/h")


if __name__ == "__main__":
    random.seed(42)  # For reproducible results
    main()

