"""
F1API.dev Service
Alternative F1 data API - No API key required
https://api.f1api.dev/v1
"""
import httpx
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class F1APIService:
    """Service for fetching F1 data from f1api.dev (no API key required)"""
    
    BASE_URL = "https://api.f1api.dev/v1"
    TIMEOUT = 10.0  # 10 second timeout
    
    async def get_drivers(self) -> List[Dict]:
        """Get all F1 drivers"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/drivers")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching drivers: {e}")
            return []
    
    async def get_teams(self) -> List[Dict]:
        """Get all F1 teams/constructors"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/teams")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching teams: {e}")
            return []
    
    async def get_seasons(self) -> List[Dict]:
        """Get all F1 seasons"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/seasons")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching seasons: {e}")
            return []
    
    async def get_season_races(self, year: int) -> List[Dict]:
        """Get all races for a season"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/seasons/{year}/races")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching season races for {year}: {e}")
            return []
    
    async def get_race_results(self, year: int, round: int) -> Optional[Dict]:
        """Get race results"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/seasons/{year}/races/{round}/results")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching race results for {year}/{round}: {e}")
            return None
    
    async def get_driver_standings(self, year: int) -> List[Dict]:
        """Get driver championship standings"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/seasons/{year}/standings/drivers")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching driver standings for {year}: {e}")
            return []
    
    async def get_constructor_standings(self, year: int) -> List[Dict]:
        """Get constructor championship standings"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/seasons/{year}/standings/constructors")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching constructor standings for {year}: {e}")
            return []
    
    async def get_circuits(self) -> List[Dict]:
        """Get all F1 circuits"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/circuits")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching circuits: {e}")
            return []
    
    async def get_circuit_info(self, circuit_id: str) -> Optional[Dict]:
        """Get specific circuit information"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/circuits/{circuit_id}")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching circuit info for {circuit_id}: {e}")
            return None


# Global instance
f1api_service = F1APIService()

