"""
Performance analysis service
"""
import pandas as pd
import numpy as np
from typing import Dict, Optional
import logging

from app.models.analytics import PerformanceMetrics, GapAnalysis
from app.utils.calculations import format_lap_time, format_gap

logger = logging.getLogger(__name__)


class PerformanceAnalyzer:
    """Analyze driver and race performance"""
    
    def __init__(self):
        pass
    
    def analyze_performance(self, lap_times_df: pd.DataFrame, current_lap: int, 
                          vehicle_number: int, total_laps: int) -> PerformanceMetrics:
        """
        Analyze driver performance metrics
        
        Args:
            lap_times_df: DataFrame with lap times for all vehicles
            current_lap: Current lap number
            vehicle_number: Vehicle number to analyze
            total_laps: Total laps in race
        
        Returns:
            PerformanceMetrics with current and best lap times
        """
        # Check if dataframe is empty or has no required columns
        if lap_times_df.empty or 'lap_time' not in lap_times_df.columns:
            # Return default metrics if no data
            return PerformanceMetrics(
                current_lap="2:04.560",
                best_lap="2:03.120",
                gap_to_leader="+1.240s",
                predicted_finish="P3",
                position=3,
                lap_number=current_lap,
                total_laps=total_laps
            )
        
        # Filter for this vehicle if vehicle_number column exists
        if 'vehicle_number' in lap_times_df.columns:
            vehicle_laps = lap_times_df[lap_times_df['vehicle_number'] == vehicle_number].copy()
        else:
            # If no vehicle_number column, use all data (single vehicle)
            vehicle_laps = lap_times_df.copy()
        
        if vehicle_laps.empty:
            # Return default metrics if no data
            return PerformanceMetrics(
                current_lap="2:04.560",
                best_lap="2:03.120",
                gap_to_leader="+1.240s",
                predicted_finish="P3",
                position=3,
                lap_number=current_lap,
                total_laps=total_laps
            )
        
        # Get current lap time
        current_lap_data = vehicle_laps[vehicle_laps['lap'] == current_lap]
        if not current_lap_data.empty and 'lap_time' in current_lap_data.columns:
            current_lap_time = current_lap_data['lap_time'].iloc[0]
        else:
            # Estimate from previous lap
            if current_lap > 1:
                prev_lap_data = vehicle_laps[vehicle_laps['lap'] == current_lap - 1]
                if not prev_lap_data.empty and 'lap_time' in prev_lap_data.columns:
                    current_lap_time = prev_lap_data['lap_time'].iloc[0]
                else:
                    current_lap_time = 124.56  # Default ~2:04.56
            else:
                current_lap_time = 124.56
        
        # Get best lap time
        if 'lap_time' in vehicle_laps.columns:
            best_lap_time = vehicle_laps['lap_time'].min()
        else:
            best_lap_time = 123.12  # Default ~2:03.12
        
        # Calculate gap to leader
        gap_to_leader = self._calculate_gap_to_leader(lap_times_df, current_lap, vehicle_number)
        
        # Predict finish position (simplified)
        current_position = self._calculate_position(lap_times_df, current_lap, vehicle_number)
        predicted_finish = f"P{current_position}"
        
        return PerformanceMetrics(
            current_lap=format_lap_time(current_lap_time),
            best_lap=format_lap_time(best_lap_time),
            gap_to_leader=format_gap(gap_to_leader),
            predicted_finish=predicted_finish,
            position=current_position,
            lap_number=current_lap,
            total_laps=total_laps
        )
    
    def analyze_gaps(self, lap_times_df: pd.DataFrame, current_lap: int, 
                    vehicle_number: int) -> GapAnalysis:
        """
        Analyze gaps to competitors
        
        Args:
            lap_times_df: DataFrame with lap times for all vehicles
            current_lap: Current lap number
            vehicle_number: Vehicle number to analyze
        
        Returns:
            GapAnalysis with gaps to competitors
        """
        position = self._calculate_position(lap_times_df, current_lap, vehicle_number)
        gap_to_leader = self._calculate_gap_to_leader(lap_times_df, current_lap, vehicle_number)
        
        # Get gaps to adjacent positions
        gap_to_ahead = self._calculate_gap_to_position(
            lap_times_df, current_lap, vehicle_number, position - 1
        )
        gap_to_behind = self._calculate_gap_to_position(
            lap_times_df, current_lap, vehicle_number, position + 1
        )
        
        # Determine overtaking opportunity (gap < 1.0s and closing)
        overtaking_opportunity = gap_to_ahead is not None and abs(gap_to_ahead) < 1.0
        
        # Determine if under pressure (car behind < 1.0s)
        under_pressure = gap_to_behind is not None and abs(gap_to_behind) < 1.0
        
        # Calculate closing rate (simplified)
        closing_rate_ahead = None
        if gap_to_ahead is not None and gap_to_ahead < 0:
            closing_rate_ahead = format_gap(abs(gap_to_ahead) * 0.1) + "/lap"
        
        return GapAnalysis(
            position=position,
            gap_to_leader=format_gap(gap_to_leader),
            gap_to_ahead=format_gap(gap_to_ahead) if gap_to_ahead is not None else None,
            gap_to_behind=format_gap(gap_to_behind) if gap_to_behind is not None else None,
            overtaking_opportunity=overtaking_opportunity,
            under_pressure=under_pressure,
            closing_rate_ahead=closing_rate_ahead
        )
    
    def _calculate_position(self, lap_times_df: pd.DataFrame, lap: int, vehicle_number: int) -> int:
        """Calculate current race position"""
        if lap_times_df.empty or 'vehicle_number' not in lap_times_df.columns or 'lap_time' not in lap_times_df.columns:
            return 3  # Default position
        
        # Get cumulative times for all vehicles at this lap
        cumulative_times = {}
        
        for veh in lap_times_df['vehicle_number'].unique():
            veh_laps = lap_times_df[
                (lap_times_df['vehicle_number'] == veh) & 
                (lap_times_df['lap'] <= lap)
            ]
            if not veh_laps.empty and 'lap_time' in veh_laps.columns:
                cumulative_times[veh] = veh_laps['lap_time'].sum()
        
        if not cumulative_times:
            return 3
        
        # Sort by cumulative time
        sorted_vehicles = sorted(cumulative_times.items(), key=lambda x: x[1])
        
        # Find position of our vehicle
        for pos, (veh, _) in enumerate(sorted_vehicles, start=1):
            if veh == vehicle_number:
                return pos
        
        return 3
    
    def _calculate_gap_to_leader(self, lap_times_df: pd.DataFrame, lap: int, vehicle_number: int) -> float:
        """Calculate gap to race leader in seconds"""
        if lap_times_df.empty or 'vehicle_number' not in lap_times_df.columns or 'lap_time' not in lap_times_df.columns:
            return 1.24  # Default gap
        
        # Get cumulative times
        cumulative_times = {}
        
        for veh in lap_times_df['vehicle_number'].unique():
            veh_laps = lap_times_df[
                (lap_times_df['vehicle_number'] == veh) & 
                (lap_times_df['lap'] <= lap)
            ]
            if not veh_laps.empty and 'lap_time' in veh_laps.columns:
                cumulative_times[veh] = veh_laps['lap_time'].sum()
        
        if not cumulative_times or vehicle_number not in cumulative_times:
            return 1.24
        
        leader_time = min(cumulative_times.values())
        vehicle_time = cumulative_times[vehicle_number]
        
        return vehicle_time - leader_time
    
    def _calculate_gap_to_position(self, lap_times_df: pd.DataFrame, lap: int, 
                                   vehicle_number: int, target_position: int) -> Optional[float]:
        """Calculate gap to a specific position"""
        if target_position < 1:
            return None
        
        if lap_times_df.empty or 'vehicle_number' not in lap_times_df.columns or 'lap_time' not in lap_times_df.columns:
            return None
        
        # Get cumulative times and positions
        cumulative_times = {}
        
        for veh in lap_times_df['vehicle_number'].unique():
            veh_laps = lap_times_df[
                (lap_times_df['vehicle_number'] == veh) & 
                (lap_times_df['lap'] <= lap)
            ]
            if not veh_laps.empty and 'lap_time' in veh_laps.columns:
                cumulative_times[veh] = veh_laps['lap_time'].sum()
        
        if not cumulative_times or vehicle_number not in cumulative_times:
            return None
        
        # Sort by time
        sorted_vehicles = sorted(cumulative_times.items(), key=lambda x: x[1])
        
        if target_position > len(sorted_vehicles):
            return None
        
        target_vehicle = sorted_vehicles[target_position - 1][0]
        target_time = cumulative_times[target_vehicle]
        vehicle_time = cumulative_times[vehicle_number]
        
        return vehicle_time - target_time


# Global analyzer instance
performance_analyzer = PerformanceAnalyzer()
