"""
Google Maps API Service
Integration with Google Maps Platform APIs for track analysis and location services

Features:
- Elevation API: Track elevation profiles for performance analysis
- Geocoding API: Convert track addresses to coordinates
- Places API: Find nearby weather stations and facilities
- Roads API: Snap track coordinates to roads, get speed limits

API Documentation: https://developers.google.com/maps/documentation
"""
import httpx
import logging
import os
from typing import Dict, List, Optional, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


class GoogleMapsService:
    """
    Service for interacting with Google Maps Platform APIs.
    
    IMPORTANT: The API key must be set as 'GOOGLE_MAPS_API_KEY' environment variable
    or in Lovable Cloud secrets.
    
    Usage:
        service = GoogleMapsService()
        elevation = await service.get_elevation_profile(coordinates)
        weather_stations = await service.find_nearby_weather_stations(lat, lon)
    """
    
    BASE_URL = "https://maps.googleapis.com/maps/api"
    TIMEOUT = 15.0  # 15 second timeout for API calls
    MAX_ELEVATION_POINTS = 512  # Google Maps Elevation API limit per request
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Google Maps service.
        
        Args:
            api_key: Optional API key. If not provided, will use GOOGLE_MAPS_API_KEY
                    from environment (Lovable Cloud secret).
        
        Raises:
            ValueError: If API key is not found in environment or provided.
        """
        self.api_key = api_key or os.getenv("GOOGLE_MAPS_API_KEY")
        
        if not self.api_key:
            logger.warning(
                "Google Maps API key not found. "
                "Please set 'GOOGLE_MAPS_API_KEY' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Get your API key from: https://console.cloud.google.com/"
            )
            # Don't raise error - allow service to exist but methods will fail gracefully
        
        if self.api_key:
            logger.info("Google Maps service initialized (API key configured)")
        else:
            logger.info("Google Maps service initialized (no API key - will use fallback)")
    
    def is_configured(self) -> bool:
        """Check if API key is configured"""
        return self.api_key is not None
    
    async def get_elevation_profile(
        self, 
        coordinates: List[Tuple[float, float]],
        samples: Optional[int] = None
    ) -> List[Dict]:
        """
        Get elevation profile for a path of coordinates.
        
        Args:
            coordinates: List of (latitude, longitude) tuples along the path
            samples: Optional number of samples to return (interpolated)
                    If None, returns elevation for all provided coordinates
        
        Returns:
            List of dictionaries with:
            - location: {"lat": float, "lng": float}
            - elevation: float (meters)
            - resolution: float (distance between data points)
        
        Raises:
            ValueError: If API key is not configured
            httpx.HTTPStatusError: If API request fails
        """
        if not self.api_key:
            raise ValueError("Google Maps API key not configured")
        
        # Google Maps Elevation API supports path elevation
        # Split into chunks if too many points (512 max per request)
        all_results = []
        
        for i in range(0, len(coordinates), self.MAX_ELEVATION_POINTS):
            chunk = coordinates[i:i + self.MAX_ELEVATION_POINTS]
            
            try:
                # Convert coordinates to path string format: lat,lng|lat,lng|...
                path_str = "|".join([f"{lat},{lon}" for lat, lon in chunk])
                
                async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                    response = await client.get(
                        f"{self.BASE_URL}/elevation/json",
                        params={
                            "path": path_str,
                            "samples": samples or len(chunk),
                            "key": self.api_key
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get("status") != "OK":
                        raise ValueError(f"Elevation API error: {data.get('status')} - {data.get('error_message', '')}")
                    
                    all_results.extend(data.get("results", []))
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"Google Maps Elevation API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Error fetching elevation profile: {e}")
                raise
        
        return all_results
    
    async def get_elevation_at_point(self, lat: float, lon: float) -> float:
        """
        Get elevation at a single point.
        
        Args:
            lat: Latitude
            lon: Longitude
        
        Returns:
            Elevation in meters
        """
        results = await self.get_elevation_profile([(lat, lon)])
        if results:
            return results[0]["elevation"]
        return 0.0
    
    async def geocode_address(self, address: str) -> Optional[Dict]:
        """
        Geocode an address to get coordinates and location details.
        
        Args:
            address: Address string or place name
        
        Returns:
            Dictionary with:
            - formatted_address: str
            - location: {"lat": float, "lng": float}
            - place_id: str
            - types: List[str]
            - address_components: List[Dict]
        
        Raises:
            ValueError: If API key is not configured
        """
        if not self.api_key:
            raise ValueError("Google Maps API key not configured")
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/geocoding/json",
                    params={
                        "address": address,
                        "key": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") != "OK":
                    logger.warning(f"Geocoding API error: {data.get('status')} - {data.get('error_message', '')}")
                    return None
                
                results = data.get("results", [])
                if not results:
                    return None
                
                # Return first result
                result = results[0]
                location = result["geometry"]["location"]
                
                return {
                    "formatted_address": result.get("formatted_address", ""),
                    "location": {
                        "lat": location["lat"],
                        "lng": location["lng"]
                    },
                    "place_id": result.get("place_id", ""),
                    "types": result.get("types", []),
                    "address_components": result.get("address_components", [])
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Google Maps Geocoding API error: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Error geocoding address '{address}': {e}")
            return None
    
    async def reverse_geocode(self, lat: float, lon: float) -> Optional[Dict]:
        """
        Reverse geocode coordinates to get address.
        
        Args:
            lat: Latitude
            lon: Longitude
        
        Returns:
            Dictionary with address information (same format as geocode_address)
        """
        if not self.api_key:
            raise ValueError("Google Maps API key not configured")
        
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/geocoding/json",
                    params={
                        "latlng": f"{lat},{lon}",
                        "key": self.api_key
                    }
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") != "OK":
                    logger.warning(f"Reverse geocoding API error: {data.get('status')} - {data.get('error_message', '')}")
                    return None
                
                results = data.get("results", [])
                if not results:
                    return None
                
                # Return first result
                result = results[0]
                location = result["geometry"]["location"]
                
                return {
                    "formatted_address": result.get("formatted_address", ""),
                    "location": {
                        "lat": location["lat"],
                        "lng": location["lng"]
                    },
                    "place_id": result.get("place_id", ""),
                    "types": result.get("types", []),
                    "address_components": result.get("address_components", [])
                }
                
        except Exception as e:
            logger.error(f"Error reverse geocoding ({lat}, {lon}): {e}")
            return None
    
    async def find_nearby_places(
        self,
        lat: float,
        lon: float,
        radius: int = 5000,
        place_type: str = "establishment",
        keyword: Optional[str] = None
    ) -> List[Dict]:
        """
        Find nearby places using Places API (Nearby Search).
        
        Args:
            lat: Latitude of center point
            lon: Longitude of center point
            radius: Search radius in meters (max 50000)
            place_type: Type of place (e.g., "airport", "establishment", "point_of_interest")
            keyword: Optional keyword filter
        
        Returns:
            List of dictionaries with place information:
            - name: str
            - location: {"lat": float, "lng": float}
            - place_id: str
            - types: List[str]
            - rating: float (if available)
            - vicinity: str
            - distance: float (meters from center)
        
        Raises:
            ValueError: If API key is not configured
        """
        if not self.api_key:
            raise ValueError("Google Maps API key not configured")
        
        try:
            params = {
                "location": f"{lat},{lon}",
                "radius": min(radius, 50000),  # Max 50km
                "key": self.api_key
            }
            
            if place_type:
                params["type"] = place_type
            if keyword:
                params["keyword"] = keyword
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/place/nearbysearch/json",
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("status") != "OK" and data.get("status") != "ZERO_RESULTS":
                    logger.warning(f"Places API error: {data.get('status')} - {data.get('error_message', '')}")
                    return []
                
                results = data.get("results", [])
                places = []
                
                for result in results:
                    location = result["geometry"]["location"]
                    
                    # Calculate distance from center (simple haversine)
                    distance = self._haversine_distance(lat, lon, location["lat"], location["lng"])
                    
                    places.append({
                        "name": result.get("name", ""),
                        "location": {
                            "lat": location["lat"],
                            "lng": location["lng"]
                        },
                        "place_id": result.get("place_id", ""),
                        "types": result.get("types", []),
                        "rating": result.get("rating"),
                        "vicinity": result.get("vicinity", ""),
                        "distance": distance
                    })
                
                # Sort by distance
                places.sort(key=lambda x: x["distance"])
                return places
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Google Maps Places API error: {e.response.status_code} - {e.response.text}")
            return []
        except Exception as e:
            logger.error(f"Error finding nearby places: {e}")
            return []
    
    async def find_nearby_weather_stations(
        self,
        lat: float,
        lon: float,
        radius: int = 10000
    ) -> List[Dict]:
        """
        Find nearby weather stations using Places API.
        
        Args:
            lat: Latitude of track location
            lon: Longitude of track location
            radius: Search radius in meters (default 10km)
        
        Returns:
            List of nearby weather stations/airports (often have weather data)
        """
        # Search for airports and weather stations
        airports = await self.find_nearby_places(
            lat, lon, radius=radius, place_type="airport", keyword="weather"
        )
        
        # Also search for generic establishments that might have weather stations
        stations = await self.find_nearby_places(
            lat, lon, radius=radius, keyword="weather station"
        )
        
        # Combine and deduplicate by place_id
        all_stations = {}
        for station in airports + stations:
            place_id = station.get("place_id")
            if place_id and place_id not in all_stations:
                all_stations[place_id] = station
        
        return list(all_stations.values())
    
    async def snap_to_roads(
        self,
        coordinates: List[Tuple[float, float]],
        interpolate: bool = True
    ) -> List[Dict]:
        """
        Snap GPS coordinates to nearest roads using Roads API.
        
        Args:
            coordinates: List of (latitude, longitude) tuples
            interpolate: Whether to interpolate additional points
        
        Returns:
            List of snapped points with:
            - location: {"latitude": float, "longitude": float}
            - originalIndex: int (index in input coordinates)
            - placeId: str
            - speedLimit: float (km/h, if available)
        
        Raises:
            ValueError: If API key is not configured
        """
        if not self.api_key:
            raise ValueError("Google Maps API key not configured")
        
        # Roads API supports up to 100 points per request
        MAX_ROADS_POINTS = 100
        all_results = []
        
        for i in range(0, len(coordinates), MAX_ROADS_POINTS):
            chunk = coordinates[i:i + MAX_ROADS_POINTS]
            
            try:
                # Convert coordinates to path string format
                path_str = "|".join([f"{lat},{lon}" for lat, lon in chunk])
                
                async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                    response = await client.get(
                        "https://roads.googleapis.com/v1/snapToRoads",
                        params={
                            "path": path_str,
                            "interpolate": str(interpolate).lower(),
                            "key": self.api_key
                        }
                    )
                    response.raise_for_status()
                    data = response.json()
                    
                    if "snappedPoints" in data:
                        all_results.extend(data["snappedPoints"])
                    
            except httpx.HTTPStatusError as e:
                logger.error(f"Google Maps Roads API error: {e.response.status_code} - {e.response.text}")
                # Don't raise - return partial results
                break
            except Exception as e:
                logger.error(f"Error snapping to roads: {e}")
                break
        
        return all_results
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in meters using Haversine formula"""
        import math
        
        R = 6371000  # Earth radius in meters
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c


# Global instance (lazy initialization)
_google_maps_service: Optional[GoogleMapsService] = None


def get_google_maps_service() -> Optional[GoogleMapsService]:
    """
    Get global Google Maps service instance.
    Returns None if API key is not configured.
    """
    global _google_maps_service
    
    if _google_maps_service is None:
        try:
            _google_maps_service = GoogleMapsService()
        except Exception as e:
            logger.warning(f"Google Maps service not available: {e}")
            return None
    
    return _google_maps_service


