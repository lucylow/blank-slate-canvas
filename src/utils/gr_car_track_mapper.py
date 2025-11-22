# src/utils/gr_car_track_mapper.py

"""
Map Toyota GR car specs to track-aware features.

Produces a per-car × per-track CSV / JSON that your agents (predictive, viz, pattern)
can consume as extra features (e.g., power_to_weight, recommended telemetry_focus tags).

Reference design brief:
file:///mnt/data/Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (4).docx
"""

from dataclasses import dataclass, asdict
from typing import List, Dict
import csv
import json
from pathlib import Path


@dataclass
class GRCar:
    model: str
    engine: str
    drivetrain: str
    power_hp: int
    torque_nm: int
    weight_kg: int
    transmission: str
    accel_0_100: float
    advantages: str
    notes: dict


# (Use your existing car definitions — shortened here for clarity)
CARS: List[GRCar] = [
    GRCar("GR Supra", "3.0L I6 Turbo", "RWD", 382, 500, 1500, "6MT/8AT", 4.1,
          "High power/torque, top speed", {"best_tracks":["Road America","COTA","Indianapolis"]}),
    GRCar("GR Yaris", "1.6L I3 Turbo", "GR-Four AWD", 272, 370, 1280, "6MT", 5.3,
          "Light, agile AWD", {"best_tracks":["VIR","Sonoma","Barber"]}),
    GRCar("GR86", "2.4L I4 NA", "RWD", 228, 250, 1270, "6MT/6AT", 6.0,
          "Lightweight, sharp handling", {"best_tracks":["Sonoma","Barber","VIR"]}),
    GRCar("GR Corolla", "1.6L I3 Turbo", "GR-Four AWD", 300, 400, 1470, "6MT/8AT", 5.0,
          "AWD, more power, stable", {"best_tracks":["Sebring","Indianapolis","COTA"]}),
]


TRACKS = [
    "Sonoma","Road America","VIR","COTA","Barber","Indianapolis","Sebring"
]


# Domain rules mapping: simple scoring functions to derive "sector_advantage_score"
TRACK_RULES = {
    # Higher weight favors power, higher power/weight -> better on long straights
    "long_straight_bias": lambda car: car.power_hp / car.weight_kg,
    # AWD adds traction bonus in twisty/wet/technical turns
    "awd_bonus": lambda car: (1.15 if "AWD" in car.drivetrain.upper() or "GR-Four" in car.drivetrain else 1.0),
    # Lightweight agility score
    "lightness_bonus": lambda car: (1.0 + max(0, (1400 - car.weight_kg) / 1000.0)),
}


TRACK_FEATURE_TEMPLATE = {
    "Sonoma": {"type": "technical_tight", "multiplier": {"long_straight_bias": 0.6, "awd_bonus": 1.05, "lightness_bonus": 1.2}},
    "Road America": {"type": "high_speed", "multiplier": {"long_straight_bias": 1.9, "awd_bonus": 1.0, "lightness_bonus": 0.9}},
    "VIR": {"type": "mixed_technical", "multiplier": {"long_straight_bias": 0.9, "awd_bonus": 1.05, "lightness_bonus": 1.1}},
    "COTA": {"type": "complex_high_speed", "multiplier": {"long_straight_bias": 1.2, "awd_bonus": 1.0, "lightness_bonus": 1.0}},
    "Barber": {"type": "short_technical", "multiplier": {"long_straight_bias": 0.5, "awd_bonus": 1.05, "lightness_bonus": 1.25}},
    "Indianapolis": {"type": "speed_flow", "multiplier": {"long_straight_bias": 1.6, "awd_bonus": 1.0, "lightness_bonus": 0.95}},
    "Sebring": {"type": "bumpy_endurance", "multiplier": {"long_straight_bias": 1.0, "awd_bonus": 1.1, "lightness_bonus": 0.95}},
}


def compute_feature_scores():
    rows = []
    for car in CARS:
        base_pw = car.power_hp / car.weight_kg
        for track in TRACKS:
            tmpl = TRACK_FEATURE_TEMPLATE.get(track, {})
            mult = tmpl.get("multiplier", {})
            
            # compute score as weighted product of rules
            score = 0.0
            contributions = {}
            
            for rule_name, rule_fn in TRACK_RULES.items():
                rule_val = rule_fn(car)
                weight = mult.get(rule_name, 1.0)
                contributions[rule_name] = {"raw": rule_val, "weight": weight, "weighted": rule_val * weight}
                score += rule_val * weight
            
            # normalize score by number of rules
            norm_score = score / max(1, len(TRACK_RULES))
            
            telemetry_focus = ["sector_splits", "lat_g", "long_g", "throttle", "brake", "speed"]
            
            # suggested model priors and coaching hints (simple heuristics)
            suggested_coaching = []
            if "AWD" in car.drivetrain.upper() or "GR-FOUR" in car.drivetrain.upper():
                suggested_coaching.append("use traction-rich exit strategies")
            if base_pw > 0.25:
                suggested_coaching.append("maximize top-speed sectors")
            if car.weight_kg < 1300:
                suggested_coaching.append("exploit late-brake agility")
            
            row = {
                "track": track,
                "car": car.model,
                "power_hp": car.power_hp,
                "weight_kg": car.weight_kg,
                "power_to_weight": round(base_pw, 4),
                "normalized_track_score": round(norm_score, 4),
                "telemetry_focus": "|".join(telemetry_focus),
                "suggested_coaching": "|".join(suggested_coaching),
                "notes": ";".join([f"{k}:{v}" for k,v in car.notes.items()]),
                "contributions": json.dumps(contributions)
            }
            rows.append(row)
    return rows


def write_outputs(out_dir: str = "artifacts", csv_name: str = "gr_track_matrix.csv", json_name: str = "gr_track_matrix.json"):
    p = Path(out_dir)
    p.mkdir(parents=True, exist_ok=True)
    rows = compute_feature_scores()
    csv_path = p / csv_name
    json_path = p / json_name
    
    # write csv
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
    
    # write json
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)
    
    return {"csv": str(csv_path), "json": str(json_path)}


def generate_car_track_matrix(out_dir: str = "artifacts"):
    """
    Public API function that agents can call to generate the car-track matrix.
    
    Returns:
        dict: Dictionary with paths to generated CSV and JSON files
    """
    return write_outputs(out_dir=out_dir)


if __name__ == "__main__":
    print("Generating GR car × track matrix ...")
    out = write_outputs()
    print("Wrote:", out)

