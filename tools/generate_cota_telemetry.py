#!/usr/bin/env python3

"""
Generate mock telemetry for 22 drivers at Circuit of the Americas (COTA).

Output JSON structure:

{
  "GR86-001": [ {timestamp_ms, speed_kmh, throttle_pct, brake_pct, gear, engine_rpm}, ... ],
  ...
  "GR86-022": [...]
}

- 200+ samples per driver at 250ms intervals (4Hz)
- Logical gear, rpm, throttle/brake constraints
- Unique driver style parameters (seeded)
- Small jitter/noise to emulate sensors
"""

import json, math, random, os, sys
from datetime import datetime, timezone

random.seed(42)

NUM_DRIVERS = 22
SAMPLES_PER_DRIVER = 200    # 200 samples at 250ms -> 50s of data
DT_MS = 250

# Circuit characteristics (approx)
COTA_MAX_STRAIGHT_KMH = 320.0
COTA_MIN_CORNER_KMH = 50.0
COTA_TURN_SPEEDS = [120.0, 80.0, 60.0, 140.0, 90.0]  # example typical sector/turn speeds used as targets

# gear to speed mapping baseline (approx): gear -> km/h at 100% throttle linearized base factor
GEAR_BASE_SPEED = {1: 15, 2: 35, 3: 65, 4: 100, 5: 160, 6: 230, 7: 300}

# Helper utilities
def clamp(v, a, b): return max(a, min(b, v))
def jitter(v, pct=0.01): return v * (1 + random.uniform(-pct, pct))

def gen_driver_style(i):
    """Return deterministic style params per driver index (1-based)."""
    r = (i * 37) % 100
    # max speed variation: between 300 and 320
    max_speed = 300 + ((r % 21) * (20/20.0))
    # acceleration factor (how aggressively speed reaches target)
    accel = 0.08 + ((r % 30) / 300.0)  # 0.08 .. ~0.18
    # braking aggression 0.4..1.0 (higher = stronger, peak brake %)
    brake_aggr = 0.4 + ((r % 60)/100.0)
    # throttle style: 0=smooth,1=aggressive,2=intermittent
    throttle_style = r % 3
    # shift bias: negative => early upshift, positive => late upshift
    shift_bias = (r % 11) - 5
    # RPM redline preference 10000..12000
    rpm_peak = 10000 + (r % 2001)
    return {
        "max_speed": max_speed,
        "accel": accel,
        "brake_aggr": brake_aggr,
        "throttle_style": throttle_style,
        "shift_bias": shift_bias,
        "rpm_peak": rpm_peak
    }

def choose_segment(t_idx):
    """Return a synthetic 'track segment' target speed for the given sample index.
       We cycle through a pseudo track pattern to simulate straights and corners."""
    pattern = [
        ("straight", 0.95*COTA_MAX_STRAIGHT_KMH),
        ("medium", 140.0),
        ("slow_corner", 75.0),
        ("medium", 120.0),
        ("slow_corner", 60.0),
        ("straight", 0.85*COTA_MAX_STRAIGHT_KMH),
        ("medium", 130.0),
    ]
    seg = pattern[(t_idx // 30) % len(pattern)]  # every 30 samples (~7.5s) move to next logical segment
    return seg

def speed_to_gear(speed, style):
    """Choose a plausible gear given speed and driver shift bias."""
    # find nearest gear whose base speed is <= current speed (with bias)
    bias = style["shift_bias"]
    target = speed + bias * 5.0
    chosen = 1
    for g, base in sorted(GEAR_BASE_SPEED.items()):
        if target >= base:
            chosen = g
    # clamp gear
    return clamp(int(chosen), 1, 7)

def rpm_from_speed_and_gear(speed, gear, throttle_pct, style):
    """Estimate RPM from speed and gear. Add throttle influence and driver rpmp reference."""
    # simple heuristic: rpm = speed / gear_ratio_factor * K; emulate engine behavior
    K = 60.0  # arbitrary scaling to get rpms in thousands
    base = (speed / (GEAR_BASE_SPEED.get(gear, 100))) * style["rpm_peak"]
    # throttle multiplier nudges towards peak
    rpm = base * (0.6 + 0.4 * (throttle_pct/100.0))
    # ensure within 1000..redline
    rpm = clamp(int(rpm + random.uniform(-150,150)), 1000, style["rpm_peak"])
    return int(rpm)

def generate_driver_stream(driver_id, style):
    """Generate sequence of telemetry dictionaries for one driver."""
    samples = []
    speed = random.uniform(80.0, 140.0)  # initial speed
    last_gear = speed_to_gear(speed, style)
    timestamp = 0
    
    for i in range(SAMPLES_PER_DRIVER):
        seg_type, seg_target = choose_segment(i)
        # scale segment target by driver max speed
        target_speed = min(seg_target, style["max_speed"])
        
        # apply micro-variations to target based on segment and driver throttle style
        if style["throttle_style"] == 0:  # smooth
            desired_speed = speed + (target_speed - speed) * style["accel"]
        elif style["throttle_style"] == 1:  # aggressive pulls
            desired_speed = speed + (target_speed - speed) * (style["accel"] * 1.4)
        else:  # intermittent
            burst = 1.2 if (i % 20) < 5 else 0.6
            desired_speed = speed + (target_speed - speed) * style["accel"] * burst
        
        # braking logic: if desired_speed lower than current, apply brakes
        if desired_speed < speed - 0.5:
            # braking intensity linked to driver brake_aggr and magnitude of slowdown
            delta = speed - desired_speed
            brake_pct = clamp(min(100, (delta / max(1.0, speed)) * 300.0 * style["brake_aggr"] + random.uniform(0,5)), 5.0, 100.0)
            throttle_pct = 0.0
        else:
            brake_pct = 0.0
            # throttle depends on style
            if style["throttle_style"] == 0:
                throttle_pct = clamp((desired_speed - speed) / max(1.0, style["max_speed"]) * 120.0 + random.uniform(-5,5), 0.0, 100.0)
            elif style["throttle_style"] == 1:
                throttle_pct = clamp((desired_speed - speed) / max(1.0, style["max_speed"]) * 140.0 + random.uniform(-8,8), 0.0, 100.0)
            else:
                # intermittent bursty throttle
                throttle_pct = clamp(((desired_speed - speed) / max(1.0, style["max_speed"]) * 160.0) * (1.0 if (i % 20) < 6 else 0.6) + random.uniform(-10,10), 0.0, 100.0)
        
        # update speed with simple physics-like response
        # accel_effect proportional to throttle and difference
        accel_effect = (throttle_pct / 100.0) * 5.0  # m/s^2-ish scaled to km/h per tick
        decel_effect = (brake_pct / 100.0) * 8.0
        # small natural rolling decel
        natural_decel = 0.5
        
        # compute speed change
        speed_delta = (desired_speed - speed) * 0.2 + accel_effect * 0.1 - decel_effect * 0.07 - natural_decel * 0.02
        
        # apply jitter
        speed = clamp(speed + speed_delta + random.uniform(-0.6, 0.6), 0.0, style["max_speed"] * 1.02)
        
        # decide gear
        gear = speed_to_gear(speed, style)
        
        # apply slight gear hysteresis: prevent rapid dropping unless strong braking
        if abs(gear - last_gear) >= 2 and brake_pct < 30:
            # if change bigger than 1 and not braking hard, bias towards smaller change
            if gear > last_gear: gear = last_gear + 1
            else: gear = last_gear - 1
            gear = clamp(gear,1,7)
        
        last_gear = gear
        
        # compute rpm
        engine_rpm = rpm_from_speed_and_gear(speed, gear, throttle_pct, style)
        
        # ensure throttle and brake not both >0
        if throttle_pct > 0 and brake_pct > 0:
            if brake_pct > throttle_pct:
                throttle_pct = 0.0
            else:
                brake_pct = 0.0
        
        # Build sample
        sample = {
            "timestamp_ms": timestamp,
            "speed_kmh": round(jitter(speed, pct=0.007), 2),
            "throttle_pct": round(jitter(throttle_pct, pct=0.05), 2),
            "brake_pct": round(jitter(brake_pct, pct=0.05), 2),
            "gear": int(gear),
            "engine_rpm": int(jitter(engine_rpm, pct=0.03))
        }
        samples.append(sample)
        timestamp += DT_MS
    
    return samples

def main():
    NUM = NUM_DRIVERS
    # generate drivers GR86-001 .. GR86-022
    out = {}
    
    for i in range(1, NUM+1):
        did = f"GR86-{i:03d}"
        style = gen_driver_style(i)
        
        # tweak style params for variety
        # e.g., make odd drivers slightly more aggressive
        if i % 2 == 1:
            style["accel"] *= 1.05
            style["brake_aggr"] *= 1.02
        
        if i % 5 == 0:
            style["throttle_style"] = (style["throttle_style"] + 1) % 3
        
        samples = generate_driver_stream(did, style)
        out[did] = {
            "driver_id": did,
            "driver_index": i,
            "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "style": style,
            "telemetry": samples
        }
    
    # Save JSON
    fn = os.path.join(os.getcwd(), "data/mock_cota_telemetry_22.json")
    with open(fn, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    
    print(f"Wrote telemetry to {fn}")
    print(f"Generated {NUM} drivers with {SAMPLES_PER_DRIVER} samples each")
    
    # Preview
    drivers = list(out.keys())
    print(f"\nDrivers: {drivers[:5]} ... (total: {len(drivers)})")
    first = out[drivers[0]]['telemetry'][0]
    print(f"First sample example: {first}")

if __name__ == "__main__":
    main()

