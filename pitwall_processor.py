#!/usr/bin/env python3
"""
PitWall Processor - Core Data Processing Engine
Processes race results CSV files to generate insights, pit windows, and driver analytics
"""

import pandas as pd
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime
import re
import logging

logger = logging.getLogger(__name__)


class PitWallProcessor:
    """Core processor for race results CSV files"""
    
    def __init__(self, track_name: Optional[str] = None, verbose: bool = True):
        self.track_name = track_name or "Unknown Track"
        self.verbose = verbose
        
        # Processed data storage
        self.race_data: Optional[pd.DataFrame] = None
        self.pit_windows: List[Dict] = []
        self.driver_insights: Dict[int, Dict] = {}
        self.metrics: Dict[str, Any] = {}
        self.processed_at: Optional[datetime] = None
        
    def _log(self, message: str):
        """Log message if verbose"""
        if self.verbose:
            print(message)
        logger.info(message)
    
    def process_race_csv(self, csv_path: str, delimiter: Optional[str] = None) -> Dict[str, Any]:
        """
        Process race results CSV file
        
        Args:
            csv_path: Path to CSV file
            delimiter: CSV delimiter (auto-detects if None)
            
        Returns:
            Dictionary with processing results
        """
        self._log(f"Processing race CSV: {csv_path}")
        
        # Detect delimiter
        if delimiter is None:
            with open(csv_path, 'r') as f:
                first_line = f.readline()
                delimiter = ';' if ';' in first_line else ','
        
        # Read CSV with normalized column names
        try:
            df = pd.read_csv(csv_path, delimiter=delimiter, encoding='utf-8')
        except UnicodeDecodeError:
            df = pd.read_csv(csv_path, delimiter=delimiter, encoding='latin-1')
        
        # Normalize column names to lowercase
        df.columns = df.columns.str.lower().str.strip()
        
        # Store race data
        self.race_data = df
        
        # Process data
        self._detect_pit_windows()
        self._generate_driver_insights()
        self._calculate_metrics()
        
        self.processed_at = datetime.now()
        
        self._log(f"✓ Processed {len(df)} drivers")
        self._log(f"✓ Detected {len(self.pit_windows)} pit windows")
        
        return {
            'track': self.track_name,
            'drivers': len(df),
            'pit_windows': len(self.pit_windows),
            'processed_at': self.processed_at.isoformat()
        }
    
    def _parse_time(self, time_str: str) -> Optional[float]:
        """Parse time string to seconds"""
        if pd.isna(time_str) or time_str == '-' or time_str == '':
            return None
        
        time_str = str(time_str).strip()
        
        # Parse formats like "2:43.767", "45:03.689", "1:23.456"
        try:
            if ':' in time_str:
                parts = time_str.split(':')
                if len(parts) == 2:
                    minutes, seconds = parts
                    return float(minutes) * 60 + float(seconds)
                elif len(parts) == 3:
                    hours, minutes, seconds = parts
                    return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
            else:
                return float(time_str)
        except:
            return None
    
    def _parse_gap(self, gap_str: str) -> Optional[float]:
        """Parse gap string to seconds"""
        if pd.isna(gap_str) or gap_str == '-' or gap_str == '':
            return None
        
        gap_str = str(gap_str).strip()
        
        # Remove "+" prefix if present
        if gap_str.startswith('+'):
            gap_str = gap_str[1:]
        
        return self._parse_time(gap_str)
    
    def _detect_pit_windows(self, gap_threshold: float = 5.0):
        """Detect potential pit windows based on gap analysis"""
        if self.race_data is None or self.race_data.empty:
            return
        
        self.pit_windows = []
        
        # Ensure required columns exist
        required_cols = ['number', 'gap_first', 'gap_previous']
        missing_cols = [col for col in required_cols if col not in self.race_data.columns]
        if missing_cols:
            self._log(f"⚠ Missing columns for pit detection: {missing_cols}")
            return
        
        # Parse gaps
        gaps_first = []
        gaps_previous = []
        
        for idx, row in self.race_data.iterrows():
            gap_first_val = self._parse_gap(row.get('gap_first', '-'))
            gap_prev_val = self._parse_gap(row.get('gap_previous', '-'))
            
            gaps_first.append(gap_first_val)
            gaps_previous.append(gap_prev_val)
            
            # Detect large gaps indicating potential pit stops
            if gap_prev_val and gap_prev_val > gap_threshold:
                car_number = int(row.get('number', 0))
                position = int(row.get('position', idx + 1))
                
                pit_window = {
                    'car_number': car_number,
                    'position': position,
                    'gap_to_previous_sec': gap_prev_val,
                    'gap_to_first_sec': gap_first_val,
                    'severity': 'high' if gap_prev_val > 10 else 'medium',
                    'recommended_action': 'pit_now' if gap_prev_val > 10 else 'consider_pit',
                    'lap_estimate': None  # Would need lap data to determine
                }
                
                self.pit_windows.append(pit_window)
        
        self._log(f"✓ Detected {len(self.pit_windows)} potential pit windows")
    
    def _generate_driver_insights(self):
        """Generate insights for each driver"""
        if self.race_data is None or self.race_data.empty:
            return
        
        self.driver_insights = {}
        
        # Get fastest lap time for comparison
        fastest_lap_time = None
        if 'fl_time' in self.race_data.columns:
            fl_times = [self._parse_time(t) for t in self.race_data['fl_time']]
            fl_times = [t for t in fl_times if t is not None]
            fastest_lap_time = min(fl_times) if fl_times else None
        
        # Get average speed
        avg_speeds = []
        if 'fl_kph' in self.race_data.columns:
            avg_speeds = [float(v) for v in self.race_data['fl_kph'] if pd.notna(v)]
        
        avg_speed_all = sum(avg_speeds) / len(avg_speeds) if avg_speeds else None
        
        for idx, row in self.race_data.iterrows():
            car_number = int(row.get('number', 0))
            
            # Parse relevant data
            position = int(row.get('position', idx + 1))
            status = str(row.get('status', 'Unknown'))
            total_laps = int(row.get('laps', 0)) if pd.notna(row.get('laps')) else 0
            
            fl_time = self._parse_time(row.get('fl_time', None))
            fl_kph = float(row.get('fl_kph', 0)) if pd.notna(row.get('fl_kph')) else None
            gap_first = self._parse_gap(row.get('gap_first', '-'))
            
            # Calculate performance metrics
            lap_time_vs_fastest = None
            if fl_time and fastest_lap_time:
                lap_time_vs_fastest = (fl_time - fastest_lap_time) / fastest_lap_time * 100
            
            speed_vs_avg = None
            if fl_kph and avg_speed_all:
                speed_vs_avg = (fl_kph - avg_speed_all) / avg_speed_all * 100
            
            # Determine rating
            rating = "EXCELLENT"
            if lap_time_vs_fastest:
                if lap_time_vs_fastest > 5:
                    rating = "NEEDS_IMPROVEMENT"
                elif lap_time_vs_fastest > 2:
                    rating = "GOOD"
            
            # Generate coaching recommendations
            recommendations = []
            improvement_areas = []
            
            if lap_time_vs_fastest and lap_time_vs_fastest > 2:
                recommendations.append(f"Focus on lap time consistency - {lap_time_vs_fastest:.1f}% off fastest lap")
                improvement_areas.append("Lap time consistency")
            
            if speed_vs_avg and speed_vs_avg < -3:
                recommendations.append(f"Work on corner exit speed - {abs(speed_vs_avg):.1f}% below average")
                improvement_areas.append("Corner exit speed")
            
            if position > len(self.race_data) * 0.7:
                recommendations.append("Focus on racecraft and positioning")
                improvement_areas.append("Race positioning")
            
            if not recommendations:
                recommendations.append("Maintain current performance level")
            
            # Default insight (typically for car #88 or winner)
            if car_number == 88 or position == 1:
                insights = {
                    'car_number': car_number,
                    'position': position,
                    'status': status,
                    'total_laps': total_laps,
                    'fastest_lap_time': fl_time,
                    'fastest_lap_speed_kph': fl_kph,
                    'gap_to_first_sec': gap_first,
                    'lap_time_vs_fastest_percent': lap_time_vs_fastest,
                    'speed_vs_avg_percent': speed_vs_avg,
                    'rating': rating,
                    'coaching_recommendation': recommendations[0] if recommendations else "Continue excellent performance",
                    'improvement_areas': improvement_areas if improvement_areas else [],
                    'strengths': ["Consistent lap times", "Strong race pace"] if position <= 5 else []
                }
            else:
                insights = {
                    'car_number': car_number,
                    'position': position,
                    'status': status,
                    'total_laps': total_laps,
                    'fastest_lap_time': fl_time,
                    'fastest_lap_speed_kph': fl_kph,
                    'gap_to_first_sec': gap_first,
                    'lap_time_vs_fastest_percent': lap_time_vs_fastest,
                    'speed_vs_avg_percent': speed_vs_avg,
                    'rating': rating,
                    'coaching_recommendation': recommendations[0] if recommendations else "Continue improving",
                    'improvement_areas': improvement_areas,
                    'strengths': []
                }
            
            self.driver_insights[car_number] = insights
        
        self._log(f"✓ Generated insights for {len(self.driver_insights)} drivers")
    
    def _calculate_metrics(self):
        """Calculate overall race metrics"""
        if self.race_data is None or self.race_data.empty:
            return
        
        # Tire degradation estimate (simplified)
        # Based on lap time progression - would need lap-by-lap data for accurate calculation
        tire_degradation = 3.0  # Default estimate
        
        # Speed metrics
        peak_speed = None
        avg_speed = None
        
        if 'fl_kph' in self.race_data.columns:
            speeds = [float(v) for v in self.race_data['fl_kph'] if pd.notna(v)]
            if speeds:
                peak_speed = max(speeds)
                avg_speed = sum(speeds) / len(speeds)
        
        # Total laps
        total_laps = 0
        if 'laps' in self.race_data.columns:
            lap_values = [int(v) for v in self.race_data['laps'] if pd.notna(v)]
            total_laps = max(lap_values) if lap_values else 0
        
        self.metrics = {
            'tire_degradation_percent': tire_degradation,
            'peak_speed_kph': peak_speed,
            'average_lap_speed_kph': avg_speed,
            'total_laps': total_laps,
            'finishers': len(self.race_data),
            'dnf_count': len([s for s in self.race_data.get('status', []) if 'dnf' in str(s).lower() or 'retired' in str(s).lower()]),
        }
        
        self._log(f"✓ Calculated race metrics")
    
    def export_to_json(self, output_path: str) -> str:
        """Export processed data to JSON file"""
        if self.race_data is None:
            raise ValueError("No data processed. Call process_race_csv() first.")
        
        # Build export structure
        export_data = {
            'race_info': {
                'track': self.track_name,
                'date': self.processed_at.isoformat() if self.processed_at else None,
                'finishers': len(self.race_data),
                'total_laps': self.metrics.get('total_laps', 0)
            },
            'top_performers': {
                'winner': self.driver_insights.get(
                    int(self.race_data.iloc[0].get('number', 0)), {}
                ) if not self.race_data.empty else {},
                'fastest_lap': {}
            },
            'pit_strategy': {
                'optimal_pit_window': self.pit_windows[0] if self.pit_windows else None,
                'detected_changes': self.pit_windows[:5],  # Top 5
                'strategy_recommendations': [
                    "Monitor tire degradation after lap 10",
                    "Consider pit window between laps 12-15 if gap increases"
                ]
            },
            'driver_insights': self.driver_insights,
            'metrics': self.metrics
        }
        
        # Add fastest lap info
        if 'fl_time' in self.race_data.columns and 'fl_lapnum' in self.race_data.columns:
            fastest_idx = self.race_data['fl_time'].apply(self._parse_time).idxmin()
            if pd.notna(fastest_idx):
                fastest_row = self.race_data.loc[fastest_idx]
                export_data['top_performers']['fastest_lap'] = {
                    'car_number': int(fastest_row.get('number', 0)),
                    'lap_time': self._parse_time(fastest_row.get('fl_time')),
                    'speed_kph': float(fastest_row.get('fl_kph', 0)) if pd.notna(fastest_row.get('fl_kph')) else None,
                    'lap_number': int(fastest_row.get('fl_lapnum', 0)) if pd.notna(fastest_row.get('fl_lapnum')) else None
                }
        
        # Write JSON
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2, default=str)
        
        self._log(f"✓ Exported to {output_path}")
        return str(output_path)
    
    def export_to_csv(self, output_path: str) -> str:
        """Export processed data for ML training"""
        if self.race_data is None:
            raise ValueError("No data processed. Call process_race_csv() first.")
        
        # Create training dataset
        training_data = []
        
        for car_num, insights in self.driver_insights.items():
            row = {
                'car_number': car_num,
                'position': insights.get('position'),
                'fastest_lap_time': insights.get('fastest_lap_time'),
                'fastest_lap_speed_kph': insights.get('fastest_lap_speed_kph'),
                'total_laps': insights.get('total_laps'),
                'gap_to_first_sec': insights.get('gap_to_first_sec'),
                'rating': insights.get('rating'),
                'track': self.track_name
            }
            training_data.append(row)
        
        df = pd.DataFrame(training_data)
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        df.to_csv(output_path, index=False)
        
        self._log(f"✓ Exported training data to {output_path}")
        return str(output_path)
    
    def process_multiple_races(self, csv_files: Dict[str, str]) -> Dict[str, Any]:
        """Process multiple race CSV files"""
        results = {
            'tracks': [],
            'driver_strength_index': {},
            'total_races': len(csv_files)
        }
        
        for track_name, csv_path in csv_files.items():
            self.track_name = track_name
            result = self.process_race_csv(csv_path)
            results['tracks'].append(result)
        
        return results

