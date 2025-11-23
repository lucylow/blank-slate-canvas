"""
Ergast F1 API Service
Free Formula 1 historical data API - No API key required
http://ergast.com/api/f1/
"""
import httpx
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class ErgastF1Service:
    """Service for fetching F1 data from Ergast API (no API key required)"""
    
    BASE_URL = "http://ergast.com/api/f1"
    TIMEOUT = 10.0  # 10 second timeout
    
    async def get_current_season_races(self) -> List[Dict]:
        """Get current F1 season race calendar"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/current.json")
                response.raise_for_status()
                data = response.json()
                return data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        except Exception as e:
            logger.error(f"Error fetching current season races: {e}")
            return []
    
    async def get_season_races(self, year: int) -> List[Dict]:
        """Get all races for a specific year"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{year}.json")
                response.raise_for_status()
                data = response.json()
                return data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
        except Exception as e:
            logger.error(f"Error fetching season races for {year}: {e}")
            return []
    
    async def get_race_results(self, year: int, round: int) -> Optional[Dict]:
        """Get race results for specific race"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{year}/{round}/results.json")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching race results for {year}/{round}: {e}")
            return None
    
    async def get_qualifying_results(self, year: int, round: int) -> Optional[Dict]:
        """Get qualifying results for specific race"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{year}/{round}/qualifying.json")
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching qualifying results for {year}/{round}: {e}")
            return None
    
    async def get_lap_times(self, year: int, round: int, lap: Optional[int] = None) -> List[Dict]:
        """Get lap times for a race"""
        try:
            url = f"{self.BASE_URL}/{year}/{round}/laps"
            if lap:
                url += f"/{lap}"
            url += ".json"
            
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
                if races and "Laps" in races[0]:
                    return races[0]["Laps"]
                return []
        except Exception as e:
            logger.error(f"Error fetching lap times for {year}/{round}: {e}")
            return []
    
    async def get_driver_standings(self, year: Optional[int] = None) -> List[Dict]:
        """Get driver championship standings"""
        try:
            url = f"{self.BASE_URL}/{'current' if not year else str(year)}/driverStandings.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                standings = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
                return standings[0].get("DriverStandings", []) if standings else []
        except Exception as e:
            logger.error(f"Error fetching driver standings: {e}")
            return []
    
    async def get_constructor_standings(self, year: Optional[int] = None) -> List[Dict]:
        """Get constructor championship standings"""
        try:
            url = f"{self.BASE_URL}/{'current' if not year else str(year)}/constructorStandings.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(url)
                response.raise_for_status()
                data = response.json()
                standings = data.get("MRData", {}).get("StandingsTable", {}).get("StandingsLists", [])
                return standings[0].get("ConstructorStandings", []) if standings else []
        except Exception as e:
            logger.error(f"Error fetching constructor standings: {e}")
            return []
    
    async def get_circuit_info(self, circuit_id: str) -> Optional[Dict]:
        """Get circuit information"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/circuits/{circuit_id}.json")
                response.raise_for_status()
                data = response.json()
                circuits = data.get("MRData", {}).get("CircuitTable", {}).get("Circuits", [])
                return circuits[0] if circuits else None
        except Exception as e:
            logger.error(f"Error fetching circuit info for {circuit_id}: {e}")
            return None
    
    async def get_all_circuits(self) -> List[Dict]:
        """Get all F1 circuits"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/circuits.json?limit=1000")
                response.raise_for_status()
                data = response.json()
                return data.get("MRData", {}).get("CircuitTable", {}).get("Circuits", [])
        except Exception as e:
            logger.error(f"Error fetching all circuits: {e}")
            return []
    
    async def get_pit_stops(self, year: int, round: int) -> List[Dict]:
        """Get pit stop data for a race"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{year}/{round}/pitstops.json")
                response.raise_for_status()
                data = response.json()
                races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
                if races and "PitStops" in races[0]:
                    return races[0]["PitStops"]
                return []
        except Exception as e:
            logger.error(f"Error fetching pit stops for {year}/{round}: {e}")
            return []
    
    async def get_fastest_laps(self, year: int, round: int) -> List[Dict]:
        """Get fastest lap data for a race"""
        try:
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(f"{self.BASE_URL}/{year}/{round}/fastest/1/laps.json")
                response.raise_for_status()
                data = response.json()
                races = data.get("MRData", {}).get("RaceTable", {}).get("Races", [])
                if races and "Laps" in races[0]:
                    return races[0]["Laps"]
                return []
        except Exception as e:
            logger.error(f"Error fetching fastest laps for {year}/{round}: {e}")
            return []


# Global instance
ergast_service = ErgastF1Service()

