"""
Configuration settings for PitWall AI Backend
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = os.getenv("DATA_DIR", "/home/ubuntu/race_data")

# API Configuration
API_TITLE = "PitWall AI Backend"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Real-time racing analytics and AI-powered strategy optimization for Toyota GR Cup"

# CORS Configuration
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://void-form-forge.lovable.app",
    "*"  # Allow all for hackathon demo
]

# Track Configuration
TRACKS = {
    "sebring": {
        "name": "Sebring International Raceway",
        "location": "Sebring, Florida",
        "length_miles": 3.74,
        "turns": 17,
        "data_dir": "sebring/Sebring"
    },
    "cota": {
        "name": "Circuit of the Americas",
        "location": "Austin, Texas",
        "length_miles": 3.427,
        "turns": 20,
        "data_dir": "circuit-of-the-americas/COTA"
    },
    "road-america": {
        "name": "Road America",
        "location": "Elkhart Lake, Wisconsin",
        "length_miles": 4.048,
        "turns": 14,
        "data_dir": "road-america/Road America"
    },
    "sonoma": {
        "name": "Sonoma Raceway",
        "location": "Sonoma, California",
        "length_miles": 2.52,
        "turns": 12,
        "data_dir": "sonoma/Sonoma"
    },
    "barber": {
        "name": "Barber Motorsports Park",
        "location": "Birmingham, Alabama",
        "length_miles": 2.38,
        "turns": 17,
        "data_dir": "barber-motorsports-park/Barber"
    },
    "vir": {
        "name": "Virginia International Raceway",
        "location": "Alton, Virginia",
        "length_miles": 3.27,
        "turns": 17,
        "data_dir": "virginia-international-raceway/VIR"
    },
    "indianapolis": {
        "name": "Indianapolis Motor Speedway",
        "location": "Indianapolis, Indiana",
        "length_miles": 2.439,
        "turns": 14,
        "data_dir": "indianapolis/Indianapolis"
    }
}

# Model Parameters
TIRE_WEAR_CONFIG = {
    "base_degradation_rate": 1.2,  # % per lap baseline
    "lateral_g_factor": 0.15,  # Additional wear per G of lateral force
    "longitudinal_g_factor": 0.10,  # Additional wear per G of braking
    "speed_factor": 0.005,  # Wear factor for high speed
    "heavy_braking_threshold": 0.8,  # G-force threshold for heavy braking
    "hard_cornering_threshold": 1.0,  # G-force threshold for hard cornering
}

PIT_STOP_CONFIG = {
    "time_loss_seconds": 25.0,  # Time lost in pit lane
    "tire_change_time": 8.0,  # Time to change tires
}

FUEL_CONFIG = {
    "initial_load_kg": 40.0,  # Starting fuel load
    "consumption_per_lap_kg": 1.8,  # Fuel used per lap
    "weight_effect_per_kg": 0.03,  # Lap time penalty per kg
}

# Cache Configuration
CACHE_ENABLED = True
CACHE_TTL_SECONDS = 300  # 5 minutes

# Logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
