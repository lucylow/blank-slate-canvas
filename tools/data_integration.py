#!/usr/bin/env python3

"""

PitBull A.I. - Mock Data Integration Code

Demonstrates how to process and integrate all 7 race track data files

"""



import pandas as pd

import numpy as np

from pathlib import Path

from datetime import datetime, timedelta

import json



# ============================================================================

# CONFIGURATION

# ============================================================================



BASE_PATH = Path("/home/ubuntu/upload")



TRACKS = {

    "barber": "barber-motorsports-park/barber",

    "cota": "circuit-of-the-americas/circuit-of-the-americas/COTA",

    "indianapolis": "indianapolis/indianapolis/Indianapolis",

    "road_america": "road-america/road-america/Road America",

    "sebring": "sebring/sebring/Sebring",

    "sonoma": "sonoma/Sonoma",

    "vir": "virginia-international-raceway/virginia-international-raceway/VIR"

}



# ============================================================================

# DATA LOADER CLASS

# ============================================================================



class RaceDataLoader:

    """Handles loading and integration of all race data types."""

    

    def __init__(self, track_path):

        self.track_path = Path(track_path)

        self.track_name = self.track_path.name

        

    def load_telemetry(self, race_num):

        """Load and pivot telemetry data."""

        race_path = self.track_path / f"Race {race_num}"

        telemetry_files = list(race_path.glob("*telemetry*.csv"))

        

        if not telemetry_files:

            print(f"No telemetry file found for {self.track_name} Race {race_num}")

            return None

            

        df = pd.read_csv(telemetry_files[0])

        df['timestamp'] = pd.to_datetime(df['timestamp'])

        

        # Pivot telemetry data

        pivot_df = df.pivot_table(

            index=['timestamp', 'vehicle_id', 'vehicle_number', 'lap'],

            columns='telemetry_name',

            values='telemetry_value',

            aggfunc='first'

        ).reset_index()

        

        return pivot_df

    

    def load_lap_times(self, race_num):

        """Load lap timing data."""

        race_path = self.track_path / f"Race {race_num}"

        lap_files = list(race_path.glob("*lap_time*.csv"))

        

        if not lap_files:

            return None

            

        df = pd.read_csv(lap_files[0])

        df['timestamp'] = pd.to_datetime(df['timestamp'])

        return df

    

    def load_weather(self, race_num):

        """Load weather data."""

        race_path = self.track_path / f"Race {race_num}"

        weather_files = list(race_path.glob("*Weather*.CSV"))

        

        if not weather_files:

            return None

        

        # Handle semicolon-separated CSV

        df = pd.read_csv(weather_files[0], sep=';')

        df['TIME_UTC_STR'] = pd.to_datetime(df['TIME_UTC_STR'])

        return df

    

    def load_results(self, race_num):

        """Load race results."""

        race_path = self.track_path / f"Race {race_num}"

        result_files = list(race_path.glob("*Results*.CSV"))

        

        if not result_files:

            return None

        

        # Use the official results file

        official = [f for f in result_files if "Official" in f.name]

        if official:

            df = pd.read_csv(official[0], sep=';')

        else:

            df = pd.read_csv(result_files[0], sep=';')

        return df

    

    def load_endurance_sections(self, race_num):

        """Load endurance/sector data."""

        race_path = self.track_path / f"Race {race_num}"

        section_files = list(race_path.glob("*Endurance*.CSV"))

        

        if not section_files:

            return None

        

        df = pd.read_csv(section_files[0], sep=';')

        return df

    

    def integrate_all_data(self, race_num):

        """Integrate all data sources for a race."""

        print(f"\n{'='*80}")

        print(f"Integrating data for {self.track_name} - Race {race_num}")

        print(f"{'='*80}")

        

        # Load all data sources

        telemetry = self.load_telemetry(race_num)

        lap_times = self.load_lap_times(race_num)

        weather = self.load_weather(race_num)

        results = self.load_results(race_num)

        sections = self.load_endurance_sections(race_num)

        

        if telemetry is None:

            print("ERROR: No telemetry data found!")

            return None

        

        print(f"✓ Loaded telemetry: {len(telemetry)} rows")

        print(f"✓ Loaded lap times: {len(lap_times) if lap_times is not None else 0} rows")

        print(f"✓ Loaded weather: {len(weather) if weather is not None else 0} rows")

        print(f"✓ Loaded results: {len(results) if results is not None else 0} rows")

        print(f"✓ Loaded sections: {len(sections) if sections is not None else 0} rows")

        

        # Merge telemetry with lap times

        if lap_times is not None:

            merged = pd.merge_asof(

                telemetry.sort_values('timestamp'),

                lap_times[['timestamp', 'vehicle_id', 'lap']].sort_values('timestamp'),

                on='timestamp',

                by='vehicle_id',

                direction='backward',

                suffixes=('', '_lap')

            )

        else:

            merged = telemetry

        

        # Merge with weather data

        if weather is not None:

            weather_renamed = weather.rename(columns={'TIME_UTC_STR': 'timestamp'})

            merged = pd.merge_asof(

                merged.sort_values('timestamp'),

                weather_renamed.sort_values('timestamp'),

                on='timestamp',

                direction='backward'

            )

        

        print(f"\n✓ Final integrated dataset: {len(merged)} rows, {len(merged.columns)} columns")

        

        return {

            'merged': merged,

            'results': results,

            'sections': sections

        }



# ============================================================================

# ANALYTICS ENGINE

# ============================================================================



class RealTimeAnalytics:

    """Real-time analytics engine for race data."""

    

    def __init__(self, integrated_data):

        self.data = integrated_data['merged']

        self.results = integrated_data['results']

        self.sections = integrated_data['sections']

    

    def calculate_live_gaps(self):

        """Calculate gaps between cars."""

        if self.data is None or len(self.data) == 0:

            return None

        

        # Get the latest timestamp for each vehicle

        latest = self.data.sort_values('timestamp').groupby('vehicle_id').tail(1)

        

        # Calculate lap progress

        if 'Laptrigger_lapdist_dls' in latest.columns:

            latest['lap_distance'] = latest['Laptrigger_lapdist_dls']

        

        # Sort by position (approximate based on lap and distance)

        latest = latest.sort_values(['lap', 'lap_distance'], ascending=[False, False])

        

        # Calculate gaps

        leader_time = latest['timestamp'].iloc[0]

        latest['gap_to_leader'] = (latest['timestamp'] - leader_time).dt.total_seconds()

        

        return latest[['vehicle_id', 'vehicle_number', 'lap', 'gap_to_leader']]

    

    def calculate_tire_wear(self):

        """Calculate tire wear index based on G-forces."""

        if self.data is None:

            return None

        

        # Calculate cumulative G-force exposure

        if 'accy_can' in self.data.columns and 'accx_can' in self.data.columns:

            self.data['g_force_total'] = (

                self.data['accy_can'].abs() + self.data['accx_can'].abs()

            )

            self.data['tire_wear_index'] = self.data.groupby('vehicle_id')['g_force_total'].cumsum()

        

        return self.data[['vehicle_id', 'timestamp', 'tire_wear_index']].tail(20)

    

    def predict_lap_time(self):

        """Predict lap time based on sector performance."""

        if self.sections is None:

            return None

        

        # Calculate average sector times per vehicle

        sector_cols = ['S1_SECONDS', 'S2_SECONDS', 'S3_SECONDS']

        

        if all(col in self.sections.columns for col in sector_cols):

            avg_sectors = self.sections.groupby('NUMBER')[sector_cols].mean()

            avg_sectors['predicted_lap_time'] = avg_sectors.sum(axis=1)

            return avg_sectors

        

        return None

    

    def driver_consistency_score(self):

        """Calculate driver consistency based on lap time variance."""

        if self.sections is None:

            return None

        

        if 'LAP_TIME' in self.sections.columns:

            consistency = self.sections.groupby('NUMBER')['LAP_TIME'].agg(['mean', 'std'])

            consistency['consistency_score'] = 100 * (1 - consistency['std'] / consistency['mean'])

            return consistency.sort_values('consistency_score', ascending=False)

        

        return None



# ============================================================================

# MOCK DATA GENERATOR

# ============================================================================



def generate_mock_realtime_stream():

    """Generate mock real-time data stream for demonstration."""

    print("\n" + "="*80)

    print("MOCK REAL-TIME DATA STREAM")

    print("="*80)

    

    # Simulate 10 cars

    vehicles = [f"GR86-00{i}-{i*10}" for i in range(1, 11)]

    

    mock_stream = []

    base_time = datetime.now()

    

    for i in range(50):  # 50 data points

        for vehicle in vehicles:

            data_point = {

                'timestamp': base_time + timedelta(seconds=i*0.1),

                'vehicle_id': vehicle,

                'vehicle_number': int(vehicle.split('-')[-1]),

                'lap': 5 + (i // 10),

                'Speed': 120 + np.random.uniform(-10, 10),

                'gear': np.random.choice([3, 4, 5, 6]),

                'nmot': 6000 + np.random.uniform(-500, 500),

                'aps': 80 + np.random.uniform(-20, 20),

                'pbrake_f': np.random.uniform(0, 100) if np.random.random() > 0.7 else 0,

                'accx_can': np.random.uniform(-0.5, 1.2),

                'accy_can': np.random.uniform(-1.0, 1.0),

                'Steering_Angle': np.random.uniform(-45, 45),

                'Laptrigger_lapdist_dls': 1000 + i * 100

            }

            mock_stream.append(data_point)

    

    df = pd.DataFrame(mock_stream)

    print(f"\n✓ Generated {len(df)} mock data points")

    print(f"\nSample data:")

    print(df.head(10))

    

    return df



# ============================================================================

# MAIN EXECUTION

# ============================================================================



def main():

    """Main execution function."""

    print("\n" + "="*80)

    print("PITBULL A.I. - DATA INTEGRATION DEMONSTRATION")

    print("="*80)

    

    # Example 1: Load and integrate data from Barber track

    print("\n\n### EXAMPLE 1: Loading Real Data from Barber Track ###")

    barber_path = BASE_PATH / TRACKS['barber']

    loader = RaceDataLoader(barber_path)

    

    # Integrate Race 1 data

    integrated_data = loader.integrate_all_data(race_num=1)

    

    if integrated_data and integrated_data['merged'] is not None:

        # Run analytics

        print("\n\n### Running Analytics ###")

        analytics = RealTimeAnalytics(integrated_data)

        

        print("\n1. Live Gaps:")

        gaps = analytics.calculate_live_gaps()

        if gaps is not None:

            print(gaps.head(10))

        

        print("\n2. Tire Wear Index:")

        tire_wear = analytics.calculate_tire_wear()

        if tire_wear is not None:

            print(tire_wear.tail(10))

        

        print("\n3. Predicted Lap Times:")

        predictions = analytics.predict_lap_time()

        if predictions is not None:

            print(predictions.head())

        

        print("\n4. Driver Consistency Scores:")

        consistency = analytics.driver_consistency_score()

        if consistency is not None:

            print(consistency.head())

    

    # Example 2: Generate mock real-time stream

    print("\n\n### EXAMPLE 2: Mock Real-Time Data Stream ###")

    mock_data = generate_mock_realtime_stream()

    

    # Process mock data

    mock_integrated = {

        'merged': mock_data,

        'results': None,

        'sections': None

    }

    

    mock_analytics = RealTimeAnalytics(mock_integrated)

    

    print("\nMock Live Gaps:")

    mock_gaps = mock_analytics.calculate_live_gaps()

    if mock_gaps is not None:

        print(mock_gaps.head())

    

    print("\nMock Tire Wear:")

    mock_tire = mock_analytics.calculate_tire_wear()

    if mock_tire is not None:

        print(mock_tire.tail(10))

    

    # Example 3: Multi-track integration summary

    print("\n\n### EXAMPLE 3: Multi-Track Integration Summary ###")

    

    summary = []

    for track_key, track_path in TRACKS.items():

        full_path = BASE_PATH / track_path

        if full_path.exists():

            loader = RaceDataLoader(full_path)

            for race_num in [1, 2]:

                try:

                    data = loader.integrate_all_data(race_num)

                    if data and data['merged'] is not None:

                        summary.append({

                            'track': track_key,

                            'race': race_num,

                            'telemetry_rows': len(data['merged']),

                            'vehicles': data['merged']['vehicle_id'].nunique(),

                            'time_span': (data['merged']['timestamp'].max() - 

                                        data['merged']['timestamp'].min()).total_seconds() / 60

                        })

                except Exception as e:

                    print(f"Error processing {track_key} Race {race_num}: {e}")

    

    summary_df = pd.DataFrame(summary)

    print("\n" + "="*80)

    print("MULTI-TRACK INTEGRATION SUMMARY")

    print("="*80)

    print(summary_df.to_string(index=False))

    

    print("\n\n" + "="*80)

    print("DATA INTEGRATION COMPLETE")

    print("="*80)



if __name__ == "__main__":

    main()


