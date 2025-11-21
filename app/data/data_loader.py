"""
Data loader for race telemetry and lap data
"""
import pandas as pd
import os
from pathlib import Path
from typing import Optional, List, Dict
import logging

from app.config import DATA_DIR, TRACKS

logger = logging.getLogger(__name__)


class DataLoader:
    """Load and cache race data from CSV files"""
    
    def __init__(self):
        self.data_dir = Path(DATA_DIR)
        self._cache = {}
    
    def get_track_path(self, track: str) -> Optional[Path]:
        """Get the data directory path for a track"""
        if track not in TRACKS:
            return None
        
        track_config = TRACKS[track]
        track_path = self.data_dir / track_config["data_dir"]
        
        if not track_path.exists():
            logger.warning(f"Track data path does not exist: {track_path}")
            return None
        
        return track_path
    
    def get_race_path(self, track: str, race: int) -> Optional[Path]:
        """Get the race directory path"""
        track_path = self.get_track_path(track)
        if not track_path:
            return None
        
        race_path = track_path / f"Race {race}"
        if not race_path.exists():
            logger.warning(f"Race path does not exist: {race_path}")
            return None
        
        return race_path
    
    def load_telemetry(self, track: str, race: int, lap_start: int = 1, lap_end: int = None, 
                       vehicle_number: Optional[int] = None, max_rows: int = 500000) -> Optional[pd.DataFrame]:
        """
        Load telemetry data for specified laps
        
        Args:
            track: Track identifier
            race: Race number (1 or 2)
            lap_start: Starting lap number
            lap_end: Ending lap number (None = lap_start only)
            vehicle_number: Filter by vehicle number (None = all vehicles)
            max_rows: Maximum rows to read
        
        Returns:
            DataFrame with telemetry data or None if not found
        """
        cache_key = f"{track}_R{race}_telemetry"
        
        race_path = self.get_race_path(track, race)
        if not race_path:
            return None
        
        # Find telemetry file
        telemetry_files = list(race_path.glob(f"*_telemetry_R{race}.csv"))
        if not telemetry_files:
            logger.error(f"No telemetry file found for {track} Race {race}")
            return None
        
        telemetry_file = telemetry_files[0]
        logger.info(f"Loading telemetry from: {telemetry_file}")
        
        try:
            # Read telemetry data with lap filter
            if lap_end is None:
                lap_end = lap_start
            
            # Read in chunks to filter by lap efficiently
            chunks = []
            for chunk in pd.read_csv(telemetry_file, chunksize=100000):
                # Filter by lap range
                chunk_filtered = chunk[(chunk['lap'] >= lap_start) & (chunk['lap'] <= lap_end)]
                
                # Filter by vehicle if specified
                if vehicle_number is not None:
                    chunk_filtered = chunk_filtered[chunk_filtered['vehicle_number'] == vehicle_number]
                
                if not chunk_filtered.empty:
                    chunks.append(chunk_filtered)
                
                # Stop if we have enough data
                if sum(len(c) for c in chunks) >= max_rows:
                    break
            
            if not chunks:
                logger.warning(f"No data found for laps {lap_start}-{lap_end}")
                return None
            
            df = pd.concat(chunks, ignore_index=True)
            logger.info(f"Loaded {len(df)} telemetry rows for laps {lap_start}-{lap_end}")
            return df
        
        except Exception as e:
            logger.error(f"Error loading telemetry: {e}")
            return None
    
    def load_lap_times(self, track: str, race: int) -> Optional[pd.DataFrame]:
        """Load lap times data"""
        race_path = self.get_race_path(track, race)
        if not race_path:
            return None
        
        lap_time_files = list(race_path.glob(f"*_lap_time_R{race}.csv"))
        if not lap_time_files:
            logger.error(f"No lap time file found for {track} Race {race}")
            return None
        
        try:
            df = pd.read_csv(lap_time_files[0])
            logger.info(f"Loaded {len(df)} lap time records")
            return df
        except Exception as e:
            logger.error(f"Error loading lap times: {e}")
            return None
    
    def get_available_vehicles(self, track: str, race: int) -> List[int]:
        """Get list of vehicle numbers in the race"""
        df = self.load_telemetry(track, race, lap_start=1, lap_end=1, max_rows=10000)
        if df is None:
            return []
        
        vehicles = sorted(df['vehicle_number'].unique().tolist())
        return vehicles
    
    def get_total_laps(self, track: str, race: int, vehicle_number: int) -> int:
        """Get total number of laps for a vehicle"""
        # Try to read lap times file first (more efficient)
        lap_times = self.load_lap_times(track, race)
        if lap_times is not None and 'vehicle_number' in lap_times.columns:
            vehicle_laps = lap_times[lap_times['vehicle_number'] == vehicle_number]
            if not vehicle_laps.empty:
                return int(vehicle_laps['lap'].max())
        
        # Fallback: scan telemetry (less efficient)
        df = self.load_telemetry(track, race, lap_start=1, lap_end=999, 
                                 vehicle_number=vehicle_number, max_rows=100000)
        if df is not None:
            return int(df['lap'].max())
        
        return 25  # Default assumption


# Global data loader instance
data_loader = DataLoader()
