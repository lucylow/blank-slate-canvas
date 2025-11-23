"""
Configuration settings for PitWall AI Backend
"""
import os
from pathlib import Path
from typing import List

# Base directories
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = os.getenv("DATA_DIR", os.getenv("DATA_DIR", "/app/data"))

# API Configuration
API_TITLE = "PitWall AI Backend"
API_VERSION = "1.0.0"
API_DESCRIPTION = "Real-time racing analytics and AI-powered strategy optimization for Toyota GR Cup"

# Environment Configuration
PORT = int(os.getenv("PORT", "8000"))
DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
DATA_ARCHIVE_URL = os.getenv("DATA_ARCHIVE_URL", "")

# CORS Configuration - support environment variable
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "")
if ALLOWED_ORIGINS_ENV:
    CORS_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_ENV.split(",")]
else:
    # Default origins
    CORS_ORIGINS = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.lovable.app",
        "https://void-form-forge.lovable.app",
    ]
    # For demo mode, allow all
    if DEMO_MODE:
        CORS_ORIGINS.append("*")

# Realtime Configuration
SSE_INTERVAL_MS = int(os.getenv("SSE_INTERVAL_MS", "1000"))
USE_REDIS_PUBSUB = os.getenv("USE_REDIS_PUBSUB", "false").lower() == "true"
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

# Model Configuration
AE_MODEL_PATH = os.getenv("AE_MODEL_PATH", "")
AE_THRESHOLD = float(os.getenv("AE_THRESHOLD", "0.0005"))

# Track Configuration
# Note: Coordinates (lat/lon) are used for OpenWeatherMap API integration
TRACKS = {
    "sebring": {
        "name": "Sebring International Raceway",
        "location": "Sebring, Florida",
        "latitude": 27.4547,
        "longitude": -80.3478,
        "length_miles": 3.74,
        "turns": 17,
        "data_dir": "sebring/Sebring"
    },
    "cota": {
        "name": "Circuit of the Americas",
        "location": "Austin, Texas",
        "latitude": 30.1327,
        "longitude": -97.6344,
        "length_miles": 3.427,
        "turns": 20,
        "data_dir": "circuit-of-the-americas/COTA"
    },
    "road-america": {
        "name": "Road America",
        "location": "Elkhart Lake, Wisconsin",
        "latitude": 43.8014,
        "longitude": -88.0078,
        "length_miles": 4.048,
        "turns": 14,
        "data_dir": "road-america/Road America"
    },
    "sonoma": {
        "name": "Sonoma Raceway",
        "location": "Sonoma, California",
        "latitude": 38.1606,
        "longitude": -122.4589,
        "length_miles": 2.52,
        "turns": 12,
        "data_dir": "sonoma/Sonoma"
    },
    "barber": {
        "name": "Barber Motorsports Park",
        "location": "Birmingham, Alabama",
        "latitude": 33.5542,
        "longitude": -86.6025,
        "length_miles": 2.38,
        "turns": 17,
        "data_dir": "barber-motorsports-park/Barber"
    },
    "vir": {
        "name": "Virginia International Raceway",
        "location": "Alton, Virginia",
        "latitude": 36.6706,
        "longitude": -79.1453,
        "length_miles": 3.27,
        "turns": 17,
        "data_dir": "virginia-international-raceway/VIR"
    },
    "indianapolis": {
        "name": "Indianapolis Motor Speedway",
        "location": "Indianapolis, Indiana",
        "latitude": 39.7950,
        "longitude": -86.2347,
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

# Data paths
DATA_RAW_DIR = Path(DATA_DIR) / "raw"
DATA_PRECOMPUTED_DIR = Path(DATA_DIR) / "precomputed"
DATA_DEMO_SLICES_DIR = Path(DATA_DIR) / "demo_slices"
DATA_MODELS_DIR = Path(DATA_DIR) / "models"
