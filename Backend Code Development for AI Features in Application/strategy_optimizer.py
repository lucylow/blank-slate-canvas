"""
Race strategy optimization service
"""
import numpy as np
from typing import List, Dict
import logging

from app.models.analytics import StrategyOptimization, StrategyRecommendation, TireWearData
from app.config import PIT_STOP_CONFIG
from app.utils.calculations import format_lap_time

logger = logging.getLogger(__name__)


class StrategyOptimizer:
    """Optimize race strategy using simulation"""
    
    def __init__(self):
        self.pit_time_loss = PIT_STOP_CONFIG["time_loss_seconds"]
    
    def optimize_strategy(self, current_lap: int, total_laps: int, current_position: int,
                         tire_laps: int, base_lap_time: float, tire_wear: TireWearData) -> StrategyOptimization:
        """
        Optimize pit stop strategy
        
        Args:
            current_lap: Current lap number
            total_laps: Total laps in race
            current_position: Current race position
            tire_laps: Number of laps on current tires
            base_lap_time: Base lap time with fresh tires (seconds)
            tire_wear: Current tire wear data
        
        Returns:
            StrategyOptimization with recommended strategies
        """
        strategies = []
        
        # Strategy 1: No pit stop (if tires can last)
        if tire_wear.predicted_laps_remaining and tire_wear.predicted_laps_remaining >= (total_laps - current_lap):
            no_stop_strategy = self._simulate_no_stop(
                current_lap, total_laps, base_lap_time, tire_wear, current_position
            )
            strategies.append(no_stop_strategy)
        
        # Strategy 2-4: Pit at different laps
        remaining_laps = total_laps - current_lap
        
        # Early pit (next 2-3 laps)
        if remaining_laps > 5:
            early_pit_lap = current_lap + 2
            early_strategy = self._simulate_pit_strategy(
                current_lap, total_laps, early_pit_lap, base_lap_time, tire_wear, current_position
            )
            strategies.append(early_strategy)
        
        # Optimal pit (based on tire wear prediction)
        if tire_wear.pit_window_optimal:
            optimal_pit_lap = tire_wear.pit_window_optimal[0]
            if current_lap < optimal_pit_lap <= total_laps - 3:
                optimal_strategy = self._simulate_pit_strategy(
                    current_lap, total_laps, optimal_pit_lap, base_lap_time, tire_wear, current_position
                )
                strategies.append(optimal_strategy)
        
        # Late pit (push tires longer)
        if remaining_laps > 8:
            late_pit_lap = current_lap + min(8, remaining_laps - 3)
            late_strategy = self._simulate_pit_strategy(
                current_lap, total_laps, late_pit_lap, base_lap_time, tire_wear, current_position
            )
            strategies.append(late_strategy)
        
        # Sort strategies by expected finish position and time
        strategies.sort(key=lambda s: (int(s.expected_finish[1:]), s.expected_time))
        
        # Select recommended strategy (best expected finish)
        recommended = strategies[0].name if strategies else "no_stop"
        
        return StrategyOptimization(
            recommended_strategy=recommended,
            strategies=strategies,
            current_tire_laps=tire_laps,
            fuel_remaining_laps=total_laps - current_lap
        )
    
    def _simulate_no_stop(self, current_lap: int, total_laps: int, base_lap_time: float,
                         tire_wear: TireWearData, current_position: int) -> StrategyRecommendation:
        """Simulate no pit stop strategy"""
        total_time = 0.0
        
        for lap in range(current_lap, total_laps + 1):
            # Calculate tire degradation
            laps_on_tire = lap - current_lap + tire_wear.front_left / 1.5
            wear_penalty = self._calculate_tire_penalty(laps_on_tire)
            lap_time = base_lap_time + wear_penalty
            total_time += lap_time
        
        # Estimate finish position (simplified)
        expected_position = max(1, current_position - 1)  # Might lose position with worn tires
        
        return StrategyRecommendation(
            name="no_stop",
            pit_lap=0,
            expected_finish=f"P{expected_position}",
            expected_time=format_lap_time(total_time),
            confidence=0.70,
            reasoning="No pit stop - risk of tire degradation in final laps"
        )
    
    def _simulate_pit_strategy(self, current_lap: int, total_laps: int, pit_lap: int,
                               base_lap_time: float, tire_wear: TireWearData, 
                               current_position: int) -> StrategyRecommendation:
        """Simulate pit stop strategy"""
        total_time = 0.0
        
        for lap in range(current_lap, total_laps + 1):
            if lap == pit_lap:
                # Add pit stop time
                total_time += self.pit_time_loss
                laps_on_tire = 0
            elif lap < pit_lap:
                # Before pit: old tires
                laps_on_tire = lap - current_lap + tire_wear.front_left / 1.5
                wear_penalty = self._calculate_tire_penalty(laps_on_tire)
                lap_time = base_lap_time + wear_penalty
                total_time += lap_time
            else:
                # After pit: fresh tires
                laps_on_tire = lap - pit_lap
                wear_penalty = self._calculate_tire_penalty(laps_on_tire)
                lap_time = base_lap_time + wear_penalty
                total_time += lap_time
        
        # Estimate finish position
        # Pit stop typically costs 1-2 positions
        positions_lost = 1 if pit_lap - current_lap > 3 else 2
        expected_position = min(20, current_position + positions_lost)
        
        # But fresh tires might allow overtaking
        if total_laps - pit_lap > 5:
            expected_position = max(1, expected_position - 1)
        
        confidence = 0.85 if pit_lap in range(current_lap + 3, current_lap + 8) else 0.75
        
        return StrategyRecommendation(
            name=f"pit_lap_{pit_lap}",
            pit_lap=pit_lap,
            expected_finish=f"P{expected_position}",
            expected_time=format_lap_time(total_time),
            confidence=confidence,
            reasoning=f"Pit on lap {pit_lap} for fresh tires, strong finish pace"
        )
    
    def _calculate_tire_penalty(self, laps_on_tire: float) -> float:
        """Calculate lap time penalty due to tire wear"""
        if laps_on_tire < 5:
            return 0.0
        elif laps_on_tire < 10:
            return (laps_on_tire - 5) * 0.1
        elif laps_on_tire < 15:
            return 0.5 + (laps_on_tire - 10) * 0.15
        else:
            return 1.25 + (laps_on_tire - 15) * 0.25


# Global optimizer instance
strategy_optimizer = StrategyOptimizer()
