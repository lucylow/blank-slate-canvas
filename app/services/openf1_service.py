"""
OpenF1 API Service
Open-source F1 API with real-time and historical data - No API key required for historical
https://api.openf1.org/v1
"""
import httpx
import logging
from typing import Dict, List, Optional
from datetime import date, datetime

logger = logging.getLogger(__name__)


class OpenF1Service:
    """Service for fetching F1 data from OpenF1 API (no API key required for historical)"""
    
    BASE_URL = "https://api.openf1.org/v1"
    TIMEOUT = 10.0  # 10 second timeout
    
    async def get_sessions_by_date(self, race_date: date) -> List[Dict]:
        """Get all sessions for a specific date"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/sessions",
                    params={"date": race_date.isoformat()}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching sessions for date {race_date}: {e}")
            return []
    
    async def get_sessions_by_location(self, location: str) -> List[Dict]:
        """Get all sessions for a specific circuit location"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/sessions",
                    params={"location": location}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching sessions for location {location}: {e}")
            return []
    
    async def get_lap_times(
        self, 
        session_key: int, 
        driver_number: Optional[int] = None,
        lap_number: Optional[int] = None
    ) -> List[Dict]:
        """Get lap times for a session"""
        try:
            params = {"session_key": session_key}
            if driver_number:
                params["driver_number"] = driver_number
            if lap_number:
                params["lap_number"] = lap_number
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/laps", params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching lap times for session {session_key}: {e}")
            return []
    
    async def get_car_telemetry(
        self, 
        session_key: int, 
        driver_number: Optional[int] = None,
        date_start: Optional[datetime] = None,
        date_end: Optional[datetime] = None
    ) -> List[Dict]:
        """Get car telemetry data (speed, throttle, brake, gear, etc.)"""
        try:
            params = {"session_key": session_key}
            if driver_number:
                params["driver_number"] = driver_number
            if date_start:
                params["date_start"] = date_start.isoformat()
            if date_end:
                params["date_end"] = date_end.isoformat()
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/car_data", params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching car telemetry for session {session_key}: {e}")
            return []
    
    async def get_position_data(
        self, 
        session_key: int,
        driver_number: Optional[int] = None
    ) -> List[Dict]:
        """Get position data for all drivers"""
        try:
            params = {"session_key": session_key}
            if driver_number:
                params["driver_number"] = driver_number
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/position", params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching position data for session {session_key}: {e}")
            return []
    
    async def get_stints(self, session_key: int, driver_number: Optional[int] = None) -> List[Dict]:
        """Get stint data (tire compounds, pit stops)"""
        try:
            params = {"session_key": session_key}
            if driver_number:
                params["driver_number"] = driver_number
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/stints", params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching stints for session {session_key}: {e}")
            return []
    
    async def get_weather(self, session_key: int) -> List[Dict]:
        """Get weather data for a session"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/weather",
                    params={"session_key": session_key}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching weather for session {session_key}: {e}")
            return []
    
    async def get_drivers(self, session_key: Optional[int] = None) -> List[Dict]:
        """Get driver information"""
        try:
            params = {}
            if session_key:
                params["session_key"] = session_key
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/drivers", params=params)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching drivers: {e}")
            return []
    
    async def get_race_control(self, session_key: int) -> List[Dict]:
        """Get race control messages (flags, incidents, etc.)"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    f"{self.BASE_URL}/race_control",
                    params={"session_key": session_key}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching race control for session {session_key}: {e}")
            return []


# Global instance
openf1_service = OpenF1Service()

