"""
Weather API endpoints for OpenWeatherMap integration.

Provides real-time weather data for track locations using OpenWeatherMap API.
The API key must be configured as 'OpenWeatherMap_API_Key' secret in Lovable Cloud.

Endpoints:
- GET /api/weather/current/{track_id} - Get current weather for a track
- GET /api/weather/forecast/{track_id} - Get weather forecast for a track
- GET /api/weather/current?lat={lat}&lon={lon} - Get current weather by coordinates
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from app.config import TRACKS
from app.services.openweathermap_service import get_openweathermap_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/current/{track_id}")
async def get_current_weather_for_track(track_id: str) -> Dict[str, Any]:
    """
    Get current weather conditions for a specific track.
    
    The track ID must match one of the configured tracks in the system.
    Weather data includes air temperature, track temperature (estimated),
    humidity, wind speed/direction, precipitation, and more.
    
    Args:
        track_id: Track identifier (e.g., "cota", "sebring", "sonoma")
    
    Returns:
        Dictionary containing current weather data with the following fields:
        - air_temp: Air temperature in Celsius
        - track_temp: Estimated track temperature in Celsius
        - humidity: Relative humidity percentage
        - pressure: Atmospheric pressure in hPa
        - wind_speed: Wind speed in km/h
        - wind_direction: Wind direction in degrees (0-360)
        - wind_gust: Wind gust speed in km/h (if available)
        - cloud_cover: Cloud coverage percentage
        - visibility: Visibility in km
        - rain: Rain flag (1 if raining, 0 otherwise)
        - rain_1h: Rain volume in mm (last hour)
        - condition: Weather condition description
        - icon: Weather icon code
        - timestamp: ISO timestamp
    
    Raises:
        404: If track_id is not found
        503: If OpenWeatherMap API is not configured or unavailable
        500: If API request fails
    """
    # Normalize track_id
    track_id = track_id.lower().replace("_", "-")
    
    # Get track configuration
    track = TRACKS.get(track_id)
    if not track:
        available_tracks = ", ".join(TRACKS.keys())
        raise HTTPException(
            status_code=404,
            detail=f"Track '{track_id}' not found. Available tracks: {available_tracks}"
        )
    
    # Check if track has coordinates
    if "latitude" not in track or "longitude" not in track:
        raise HTTPException(
            status_code=400,
            detail=f"Track '{track_id}' does not have coordinates configured"
        )
    
    # Get OpenWeatherMap service
    service = get_openweathermap_service()
    if not service:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenWeatherMap API is not configured. "
                "Please set 'OpenWeatherMap_API_Key' as a secret in Lovable Cloud. "
                "Get your API key from: https://openweathermap.org/api"
            )
        )
    
    try:
        # Fetch current weather
        weather = await service.get_current_weather(
            lat=track["latitude"],
            lon=track["longitude"]
        )
        
        # Add track metadata
        weather["track_id"] = track_id
        weather["track_name"] = track["name"]
        weather["track_location"] = track["location"]
        
        logger.info(f"Fetched current weather for track: {track_id} ({track['name']})")
        return weather
        
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching weather for track {track_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")


@router.get("/current")
async def get_current_weather_by_coordinates(
    lat: float = Query(..., description="Latitude of location", ge=-90, le=90),
    lon: float = Query(..., description="Longitude of location", ge=-180, le=180)
) -> Dict[str, Any]:
    """
    Get current weather conditions for specific coordinates.
    
    This endpoint allows fetching weather for any location using latitude and longitude.
    Useful for custom track locations or testing.
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
    
    Returns:
        Dictionary containing current weather data (same format as /current/{track_id})
    """
    service = get_openweathermap_service()
    if not service:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenWeatherMap API is not configured. "
                "Please set 'OpenWeatherMap_API_Key' as a secret in Lovable Cloud."
            )
        )
    
    try:
        weather = await service.get_current_weather(lat=lat, lon=lon)
        weather["latitude"] = lat
        weather["longitude"] = lon
        
        logger.info(f"Fetched current weather for coordinates: {lat}, {lon}")
        return weather
        
    except Exception as e:
        logger.error(f"Error fetching weather for coordinates {lat}, {lon}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch weather data: {str(e)}")


@router.get("/forecast/{track_id}")
async def get_weather_forecast_for_track(
    track_id: str,
    hours: int = Query(48, description="Number of hours to forecast (max 48)", ge=1, le=48)
) -> Dict[str, Any]:
    """
    Get weather forecast for a specific track.
    
    Provides hourly weather forecasts for the specified number of hours (up to 48 hours).
    Useful for race planning and strategy optimization.
    
    Args:
        track_id: Track identifier (e.g., "cota", "sebring")
        hours: Number of hours to forecast (1-48)
    
    Returns:
        Dictionary containing:
        - current: Current weather conditions
        - forecast: List of hourly forecasts
        - track_id: Track identifier
        - track_name: Track name
    """
    track_id = track_id.lower().replace("_", "-")
    
    track = TRACKS.get(track_id)
    if not track:
        available_tracks = ", ".join(TRACKS.keys())
        raise HTTPException(
            status_code=404,
            detail=f"Track '{track_id}' not found. Available tracks: {available_tracks}"
        )
    
    if "latitude" not in track or "longitude" not in track:
        raise HTTPException(
            status_code=400,
            detail=f"Track '{track_id}' does not have coordinates configured"
        )
    
    service = get_openweathermap_service()
    if not service:
        raise HTTPException(
            status_code=503,
            detail=(
                "OpenWeatherMap API is not configured. "
                "Please set 'OpenWeatherMap_API_Key' as a secret in Lovable Cloud."
            )
        )
    
    try:
        # Get current weather and forecast
        current = await service.get_current_weather(
            lat=track["latitude"],
            lon=track["longitude"]
        )
        forecast = await service.get_hourly_forecast(
            lat=track["latitude"],
            lon=track["longitude"],
            hours=hours
        )
        
        return {
            "current": current,
            "forecast": forecast,
            "track_id": track_id,
            "track_name": track["name"],
            "track_location": track["location"],
            "forecast_hours": len(forecast)
        }
        
    except Exception as e:
        logger.error(f"Error fetching forecast for track {track_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/forecast")
async def get_weather_forecast_by_coordinates(
    lat: float = Query(..., description="Latitude", ge=-90, le=90),
    lon: float = Query(..., description="Longitude", ge=-180, le=180),
    hours: int = Query(48, description="Number of hours to forecast", ge=1, le=48)
) -> Dict[str, Any]:
    """
    Get weather forecast for specific coordinates.
    
    Args:
        lat: Latitude
        lon: Longitude
        hours: Number of hours to forecast (1-48)
    
    Returns:
        Dictionary with current weather and forecast
    """
    service = get_openweathermap_service()
    if not service:
        raise HTTPException(
            status_code=503,
            detail="OpenWeatherMap API is not configured"
        )
    
    try:
        current = await service.get_current_weather(lat=lat, lon=lon)
        forecast = await service.get_hourly_forecast(lat=lat, lon=lon, hours=hours)
        
        return {
            "current": current,
            "forecast": forecast,
            "latitude": lat,
            "longitude": lon,
            "forecast_hours": len(forecast)
        }
        
    except Exception as e:
        logger.error(f"Error fetching forecast for coordinates {lat}, {lon}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch forecast: {str(e)}")


@router.get("/tracks")
async def list_tracks_with_coordinates() -> Dict[str, Any]:
    """
    List all available tracks with their coordinates.
    
    Returns:
        Dictionary with track information including coordinates for weather API
    """
    tracks_info = {}
    for track_id, track_data in TRACKS.items():
        tracks_info[track_id] = {
            "name": track_data["name"],
            "location": track_data["location"],
            "latitude": track_data.get("latitude"),
            "longitude": track_data.get("longitude"),
            "has_coordinates": "latitude" in track_data and "longitude" in track_data
        }
    
    return {
        "tracks": tracks_info,
        "count": len(tracks_info)
    }


