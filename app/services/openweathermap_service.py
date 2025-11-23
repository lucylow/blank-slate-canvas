"""
OpenWeatherMap API Service
Real-time weather data for track conditions using OpenWeatherMap API
API Key must be set as OpenWeatherMap_API_Key secret in Lovable Cloud

Features:
- Current weather conditions (temperature, humidity, wind, precipitation)
- Hourly forecasts (48 hours)
- Daily forecasts (8 days)
- Historical weather data (One Call API)
- Track temperature estimation
- Weather alerts

API Documentation: https://openweathermap.org/api
"""
import httpx
import logging
import os
from typing import Dict, List, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class OpenWeatherMapService:
    """
    Service for fetching weather data from OpenWeatherMap API.
    
    IMPORTANT: The API key must be set as 'OpenWeatherMap_API_Key' secret in Lovable Cloud.
    The service will automatically retrieve it from environment variables.
    
    Usage:
        service = OpenWeatherMapService()
        weather = await service.get_current_weather(lat=30.1327, lon=-97.6344)  # COTA
    """
    
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    ONE_CALL_URL = "https://api.openweathermap.org/data/3.0/onecall"
    TIMEOUT = 15.0  # 15 second timeout for API calls
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OpenWeatherMap service.
        
        Args:
            api_key: Optional API key. If not provided, will use OpenWeatherMap_API_Key 
                    from environment (Lovable Cloud secret).
        
        Raises:
            ValueError: If API key is not found in environment or provided.
        """
        # IMPORTANT: Use OpenWeatherMap_API_Key from Lovable Cloud secrets
        # This is the environment variable name that Lovable uses for secrets
        self.api_key = api_key or os.getenv("OpenWeatherMap_API_Key")
        
        if not self.api_key:
            raise ValueError(
                "OpenWeatherMap API key not found. "
                "Please set 'OpenWeatherMap_API_Key' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Get your API key from: https://openweathermap.org/api"
            )
        
        logger.info("OpenWeatherMap service initialized (API key configured)")
    
    async def get_current_weather(self, lat: float, lon: float) -> Dict:
        """
        Get current weather conditions for track location.
        
        Args:
            lat: Latitude of track location
            lon: Longitude of track location
        
        Returns:
            Dictionary with current weather data including:
            - air_temp: Air temperature in Celsius
            - track_temp: Estimated track temperature in Celsius
            - humidity: Relative humidity percentage
            - pressure: Atmospheric pressure in hPa
            - wind_speed: Wind speed in km/h
            - wind_direction: Wind direction in degrees (0-360)
            - wind_gust: Wind gust speed in km/h
            - cloud_cover: Cloud coverage percentage
            - visibility: Visibility in km
            - rain: Rain volume in mm (last hour)
            - uv_index: UV index (if available)
            - condition: Weather condition description
            - icon: Weather icon code
            - timestamp: ISO timestamp
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/weather",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric"  # Celsius, km/h, hPa
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Extract and format weather data
                current = {
                    "air_temp": data["main"]["temp"],
                    "feels_like": data["main"]["feels_like"],
                    "humidity": data["main"]["humidity"],
                    "pressure": data["main"]["pressure"],
                    "wind_speed": data["wind"]["speed"] * 3.6,  # m/s to km/h
                    "wind_direction": data["wind"].get("deg", 0),
                    "wind_gust": data["wind"].get("gust", 0) * 3.6 if data["wind"].get("gust") else 0,
                    "cloud_cover": data["clouds"]["all"],
                    "visibility": (data.get("visibility", 0) / 1000) if data.get("visibility") else None,  # m to km
                    "rain_1h": data.get("rain", {}).get("1h", 0) if isinstance(data.get("rain"), dict) else 0,
                    "snow_1h": data.get("snow", {}).get("1h", 0) if isinstance(data.get("snow"), dict) else 0,
                    "condition": data["weather"][0]["description"],
                    "icon": data["weather"][0]["icon"],
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
                # Estimate track temperature (typically 10-30°C higher than air temp)
                uv_index = 0  # Not available in basic current weather API
                current["track_temp"] = self._estimate_track_temp(
                    current["air_temp"], 
                    uv_index,
                    current.get("cloud_cover", 0)
                )
                
                # Rain flag (boolean)
                current["rain"] = 1 if (current["rain_1h"] > 0 or current["snow_1h"] > 0) else 0
                
                logger.debug(f"Fetched current weather for {lat}, {lon}: {current['air_temp']}°C")
                return current
                
        except httpx.HTTPStatusError as e:
            logger.error(f"OpenWeatherMap API error: {e.response.status_code} - {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Error fetching current weather: {e}")
            raise
    
    async def get_hourly_forecast(self, lat: float, lon: float, hours: int = 48) -> List[Dict]:
        """
        Get hourly weather forecast (up to 48 hours).
        
        Args:
            lat: Latitude of track location
            lon: Longitude of track location
            hours: Number of hours to forecast (max 48)
        
        Returns:
            List of dictionaries with hourly forecast data
        """
        try:
            # Note: Hourly forecast requires paid plan or One Call API
            # Fallback to 3-hour forecast (free tier)
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/forecast",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric",
                        "cnt": min(16, hours // 3)  # 3-hour intervals, max 5 days
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                forecasts = []
                for item in data["list"]:
                    forecasts.append({
                        "timestamp": datetime.fromtimestamp(item["dt"]).isoformat() + "Z",
                        "air_temp": item["main"]["temp"],
                        "track_temp": self._estimate_track_temp(
                            item["main"]["temp"],
                            0,  # UV index not available in forecast
                            item["clouds"]["all"]
                        ),
                        "humidity": item["main"]["humidity"],
                        "pressure": item["main"]["pressure"],
                        "wind_speed": item["wind"]["speed"] * 3.6,  # m/s to km/h
                        "wind_direction": item["wind"].get("deg", 0),
                        "wind_gust": item["wind"].get("gust", 0) * 3.6 if item["wind"].get("gust") else 0,
                        "cloud_cover": item["clouds"]["all"],
                        "precipitation_prob": item.get("pop", 0) * 100,  # Probability of precipitation
                        "rain_3h": item.get("rain", {}).get("3h", 0) if isinstance(item.get("rain"), dict) else 0,
                        "snow_3h": item.get("snow", {}).get("3h", 0) if isinstance(item.get("snow"), dict) else 0,
                        "condition": item["weather"][0]["description"],
                        "icon": item["weather"][0]["icon"]
                    })
                
                logger.debug(f"Fetched {len(forecasts)} hourly forecasts for {lat}, {lon}")
                return forecasts[:min(len(forecasts), hours)]
                
        except Exception as e:
            logger.error(f"Error fetching hourly forecast: {e}")
            raise
    
    async def get_onecall_data(self, lat: float, lon: float) -> Dict:
        """
        Get comprehensive weather data using One Call API 3.0.
        NOTE: Requires paid plan (One Call API subscription).
        
        Args:
            lat: Latitude of track location
            lon: Longitude of track location
        
        Returns:
            Dictionary with current, hourly, and daily forecasts
        """
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    self.ONE_CALL_URL,
                    params={
                        "lat": lat,
                        "lon": lon,
                        "appid": self.api_key,
                        "units": "metric",
                        "exclude": "minutely"  # Exclude minute-by-minute to save quota
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                # Format current conditions
                current = data.get("current", {})
                formatted_current = {
                    "air_temp": current.get("temp", 0),
                    "track_temp": self._estimate_track_temp(
                        current.get("temp", 0),
                        current.get("uvi", 0),
                        current.get("clouds", 0)
                    ),
                    "humidity": current.get("humidity", 0),
                    "pressure": current.get("pressure", 1013.25),
                    "wind_speed": current.get("wind_speed", 0) * 3.6,  # m/s to km/h
                    "wind_direction": current.get("wind_deg", 0),
                    "wind_gust": current.get("wind_gust", 0) * 3.6 if current.get("wind_gust") else 0,
                    "uv_index": current.get("uvi", 0),
                    "visibility": (current.get("visibility", 0) / 1000) if current.get("visibility") else None,
                    "cloud_cover": current.get("clouds", 0),
                    "rain": current.get("rain", {}).get("1h", 0) if isinstance(current.get("rain"), dict) else 0,
                    "condition": current.get("weather", [{}])[0].get("description", ""),
                    "icon": current.get("weather", [{}])[0].get("icon", ""),
                    "timestamp": datetime.fromtimestamp(current.get("dt", 0)).isoformat() + "Z"
                }
                
                # Format hourly forecasts
                hourly_forecasts = []
                for hour in data.get("hourly", [])[:48]:
                    hourly_forecasts.append({
                        "timestamp": datetime.fromtimestamp(hour["dt"]).isoformat() + "Z",
                        "air_temp": hour.get("temp", 0),
                        "track_temp": self._estimate_track_temp(
                            hour.get("temp", 0),
                            hour.get("uvi", 0),
                            hour.get("clouds", 0)
                        ),
                        "humidity": hour.get("humidity", 0),
                        "wind_speed": hour.get("wind_speed", 0) * 3.6,
                        "wind_direction": hour.get("wind_deg", 0),
                        "precipitation_prob": hour.get("pop", 0) * 100,
                        "rain": hour.get("rain", {}).get("1h", 0) if isinstance(hour.get("rain"), dict) else 0,
                        "condition": hour.get("weather", [{}])[0].get("description", "")
                    })
                
                # Format daily forecasts
                daily_forecasts = []
                for day in data.get("daily", [])[:8]:
                    daily_forecasts.append({
                        "date": datetime.fromtimestamp(day["dt"]).date().isoformat(),
                        "temp_min": day.get("temp", {}).get("min", 0),
                        "temp_max": day.get("temp", {}).get("max", 0),
                        "temp_day": day.get("temp", {}).get("day", 0),
                        "humidity": day.get("humidity", 0),
                        "wind_speed": day.get("wind_speed", 0) * 3.6,
                        "wind_direction": day.get("wind_deg", 0),
                        "precipitation_prob": day.get("pop", 0) * 100,
                        "rain": day.get("rain", 0) if day.get("rain") else 0,
                        "condition": day.get("weather", [{}])[0].get("description", "")
                    })
                
                return {
                    "current": formatted_current,
                    "hourly": hourly_forecasts,
                    "daily": daily_forecasts,
                    "alerts": data.get("alerts", [])
                }
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                logger.error(
                    "OpenWeatherMap One Call API requires a paid subscription. "
                    "Falling back to standard API endpoints."
                )
                raise ValueError("One Call API requires paid subscription")
            raise
        except Exception as e:
            logger.error(f"Error fetching One Call data: {e}")
            raise
    
    async def get_historical_weather(
        self, 
        lat: float, 
        lon: float, 
        timestamp: datetime
    ) -> Dict:
        """
        Get historical weather for a specific timestamp.
        NOTE: Requires One Call API subscription (paid plan).
        
        Args:
            lat: Latitude of track location
            lon: Longitude of track location
            timestamp: Datetime for historical data
        
        Returns:
            Dictionary with historical weather data
        """
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.ONE_CALL_URL}/timemachine",
                    params={
                        "lat": lat,
                        "lon": lon,
                        "dt": int(timestamp.timestamp()),
                        "appid": self.api_key,
                        "units": "metric"
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                current = data.get("current", {})
                return {
                    "air_temp": current.get("temp", 0),
                    "track_temp": self._estimate_track_temp(
                        current.get("temp", 0),
                        current.get("uvi", 0),
                        current.get("clouds", 0)
                    ),
                    "humidity": current.get("humidity", 0),
                    "wind_speed": current.get("wind_speed", 0) * 3.6,
                    "wind_direction": current.get("wind_deg", 0),
                    "pressure": current.get("pressure", 1013.25),
                    "rain": current.get("rain", {}).get("1h", 0) if isinstance(current.get("rain"), dict) else 0,
                    "timestamp": timestamp.isoformat() + "Z"
                }
                
        except Exception as e:
            logger.error(f"Error fetching historical weather: {e}")
            raise
    
    def _estimate_track_temp(
        self, 
        air_temp: float, 
        uv_index: float = 0, 
        cloud_cover: float = 0
    ) -> float:
        """
        Estimate track temperature from air temperature, UV index, and cloud cover.
        
        Track temperature is typically 10-30°C higher than air temperature,
        influenced by solar radiation (UV index) and cloud cover.
        
        Args:
            air_temp: Air temperature in Celsius
            uv_index: UV index (0-11 scale)
            cloud_cover: Cloud coverage percentage (0-100)
        
        Returns:
            Estimated track temperature in Celsius
        """
        # Base track temp increase (asphalt heats up more than air)
        base_increase = 15.0
        
        # UV index contributes to heating (more UV = hotter track)
        uv_factor = uv_index * 1.5
        
        # Cloud cover reduces heating (more clouds = cooler track)
        cloud_reduction = (cloud_cover / 100) * 8  # Max 8°C reduction with full clouds
        
        track_temp = air_temp + base_increase + uv_factor - cloud_reduction
        
        # Ensure track temp is at least air temp
        return max(track_temp, air_temp + 5.0)


# Global instance (lazy initialization to avoid API key errors at import time)
_openweathermap_service: Optional[OpenWeatherMapService] = None


def get_openweathermap_service() -> Optional[OpenWeatherMapService]:
    """
    Get global OpenWeatherMap service instance.
    Returns None if API key is not configured.
    """
    global _openweathermap_service
    
    if _openweathermap_service is None:
        try:
            _openweathermap_service = OpenWeatherMapService()
        except ValueError as e:
            logger.warning(f"OpenWeatherMap service not available: {e}")
            return None
    
    return _openweathermap_service

