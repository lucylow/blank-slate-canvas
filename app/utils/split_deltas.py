"""
Lap Split Delta Calculations
Calculate sector/lap split differences across cars for comparison
"""
import pandas as pd
import logging
from typing import List, Dict, Optional
import numpy as np

logger = logging.getLogger(__name__)


def calculate_split_deltas(
    lap_time_data: pd.DataFrame,
    car_list: List[int],
    ref_car: Optional[int] = None
) -> pd.DataFrame:
    """
    Calculate lap split deltas across cars.
    
    Args:
        lap_time_data: DataFrame with columns=['lap', 'car_number', 'split_time_S1', 'split_time_S2', 'split_time_S3', ...]
                      Can also handle alternative column names like 'vehicle_number', 'sector1', etc.
        car_list: List of car numbers to compare
        ref_car: Reference car number (if None, uses first car in car_list)
    
    Returns:
        DataFrame with columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3']
    """
    if lap_time_data.empty:
        logger.warning("Empty lap_time_data provided")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    if not car_list or len(car_list) < 2:
        logger.warning("Need at least 2 cars for comparison")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    # Normalize column names
    car_col = None
    for col in ['car_number', 'vehicle_number', 'car', 'vehicle']:
        if col in lap_time_data.columns:
            car_col = col
            break
    
    if car_col is None:
        logger.error("Could not find car number column in lap_time_data")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    # Normalize sector column names
    sector_cols = {}
    for sector in ['S1', 'S2', 'S3']:
        # Try multiple possible column names
        for pattern in [f'split_time_{sector}', f'split_{sector}', f'{sector}_time', 
                       f'sector_{sector[1]}', f'{sector.lower()}_seconds', 
                       f'time_{sector.lower()}']:
            if pattern in lap_time_data.columns:
                sector_cols[sector] = pattern
                break
        
        if sector not in sector_cols:
            logger.warning(f"Could not find sector {sector} column")
    
    if not sector_cols:
        logger.error("Could not find any sector time columns")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    # Set reference car
    if ref_car is None:
        ref_car = car_list[0]
    
    if ref_car not in lap_time_data[car_col].unique():
        logger.warning(f"Reference car {ref_car} not found in data")
        # Try to use first available car
        available_cars = lap_time_data[car_col].unique()
        if len(available_cars) == 0:
            return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
        ref_car = available_cars[0]
    
    delta_data = []
    
    # Get reference car laps
    ref_laps = lap_time_data[lap_time_data[car_col] == ref_car].copy()
    
    if ref_laps.empty:
        logger.warning(f"No laps found for reference car {ref_car}")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    # Process each compare car
    for car in car_list:
        if car == ref_car:
            continue
        
        car_laps = lap_time_data[lap_time_data[car_col] == car].copy()
        
        if car_laps.empty:
            logger.debug(f"No laps found for car {car}")
            continue
        
        # Find common laps between ref and compare car
        common_laps = set(ref_laps['lap'].unique()) & set(car_laps['lap'].unique())
        
        for lap in sorted(common_laps):
            ref_row = ref_laps[ref_laps['lap'] == lap].iloc[0]
            car_row = car_laps[car_laps['lap'] == lap].iloc[0]
            
            # Extract sector times
            ref_splits = []
            car_splits = []
            
            for sector in ['S1', 'S2', 'S3']:
                if sector in sector_cols:
                    ref_val = ref_row.get(sector_cols[sector], None)
                    car_val = car_row.get(sector_cols[sector], None)
                    
                    if pd.notna(ref_val) and pd.notna(car_val):
                        try:
                            ref_splits.append(float(ref_val))
                            car_splits.append(float(car_val))
                        except (ValueError, TypeError):
                            ref_splits.append(None)
                            car_splits.append(None)
                    else:
                        ref_splits.append(None)
                        car_splits.append(None)
                else:
                    ref_splits.append(None)
                    car_splits.append(None)
            
            # Calculate deltas (compare_car - ref_car)
            # Positive delta = compare car is slower
            # Negative delta = compare car is faster
            deltas = {}
            for i, sector in enumerate(['S1', 'S2', 'S3']):
                if ref_splits[i] is not None and car_splits[i] is not None:
                    deltas[f'delta_{sector}'] = car_splits[i] - ref_splits[i]
                else:
                    deltas[f'delta_{sector}'] = None
            
            # Only add if we have at least one valid delta
            if any(v is not None for v in deltas.values()):
                delta_data.append({
                    'lap': int(lap),
                    'ref_car': int(ref_car),
                    'compare_car': int(car),
                    **deltas
                })
    
    if not delta_data:
        logger.warning("No delta data calculated")
        return pd.DataFrame(columns=['lap', 'ref_car', 'compare_car', 'delta_S1', 'delta_S2', 'delta_S3'])
    
    return pd.DataFrame(delta_data)


def load_lap_times_with_sectors(track: str, race: int, data_loader) -> Optional[pd.DataFrame]:
    """
    Load lap times with sector split data.
    Tries multiple data sources to find sector timing information.
    
    Args:
        track: Track identifier
        race: Race number
        data_loader: DataLoader instance
    
    Returns:
        DataFrame with lap and sector time data, or None if not found
    """
    race_path = data_loader.get_race_path(track, race)
    if not race_path:
        return None
    
    # Try to load from analysis files (which often contain sector data)
    analysis_files = list(race_path.glob("*Analysis*.csv")) + list(race_path.glob("*analysis*.csv"))
    
    for file in analysis_files:
        try:
            df = pd.read_csv(file)
            # Look for columns that might contain sector data
            sector_cols = [col for col in df.columns if any(term in col.lower() for term in ['sector', 'split', 's1', 's2', 's3', 'section'])]
            car_cols = [col for col in df.columns if any(term in col.lower() for term in ['car', 'vehicle', 'number'])]
            lap_cols = [col for col in df.columns if 'lap' in col.lower()]
            
            if sector_cols and car_cols and lap_cols:
                logger.info(f"Found sector data in {file.name}")
                return df
        except Exception as e:
            logger.debug(f"Error reading {file}: {e}")
            continue
    
    # Fallback: Try to construct from lap time files
    lap_time_df = data_loader.load_lap_times(track, race)
    if lap_time_df is not None and not lap_time_df.empty:
        # Create mock sector data if not available (for demo purposes)
        # In production, this would come from actual timing data
        logger.info("Using lap times and generating mock sector data for demo")
        
        # Normalize car column
        car_col = None
        for col in ['car_number', 'vehicle_number', 'car', 'vehicle']:
            if col in lap_time_df.columns:
                car_col = col
                break
        
        if car_col:
            # Generate synthetic sector times (proportional to lap time)
            # In real implementation, these would come from actual timing data
            lap_time_df = lap_time_df.copy()
            if 'lap_time' in lap_time_df.columns:
                lap_time_col = 'lap_time'
            elif 'time' in lap_time_df.columns:
                lap_time_col = 'time'
            else:
                # Assume first numeric column is lap time
                numeric_cols = lap_time_df.select_dtypes(include=[np.number]).columns
                lap_time_col = numeric_cols[0] if len(numeric_cols) > 0 else None
            
            if lap_time_col:
                # Convert to seconds if needed
                lap_times = lap_time_df[lap_time_col]
                if lap_times.dtype == 'object':
                    # Try to parse time strings like "1:45.123"
                    lap_times = lap_times.apply(lambda x: parse_time_to_seconds(x) if pd.notna(x) else None)
                
                # Generate sector splits (rough proportions: S1=30%, S2=45%, S3=25%)
                lap_time_df['split_time_S1'] = lap_times * 0.30
                lap_time_df['split_time_S2'] = lap_times * 0.45
                lap_time_df['split_time_S3'] = lap_times * 0.25
                
                return lap_time_df
    
    return None


def parse_time_to_seconds(time_str: str) -> Optional[float]:
    """Parse time string like '1:45.123' or '105.123' to seconds"""
    if pd.isna(time_str):
        return None
    
    try:
        if ':' in str(time_str):
            parts = str(time_str).split(':')
            if len(parts) == 2:
                minutes = float(parts[0])
                seconds = float(parts[1])
                return minutes * 60 + seconds
        else:
            return float(time_str)
    except (ValueError, TypeError):
        return None
    
    return None

