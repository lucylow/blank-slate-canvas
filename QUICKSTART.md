# PitWall A.I. - CSV Processing Quick Start Guide

## Files Provided

- `pitwall_processor.py` - Core data processing engine
- `pitwall_integration.py` - Frontend integration layer
- This guide - Implementation instructions

## Installation & Setup

```bash
# Copy both Python files to your project directory
cp pitwall_processor.py /path/to/your/project/
cp pitwall_integration.py /path/to/your/project/

# Install required dependencies
pip install pandas numpy

# Optional: For real-time features
pip install fastapi uvicorn
```

## Quick Start (5 minutes)

### Option 1: Simple CSV Processing

```python
from pitwall_processor import PitWallProcessor

# Load and process race data
processor = PitWallProcessor(track_name="Road America")
result = processor.process_race_csv('road_america_results.csv')

# Export to JSON for dashboard
processor.export_to_json('road_america_dashboard.json')

# Export for ML model training
processor.export_to_csv('road_america_training_data.csv')

print("✓ Processing complete")
print(f"  - Pit windows detected: {len(processor.pit_windows)}")
print(f"  - Driver insights generated: {len(processor.driver_insights)}")
print(f"  - Tire degradation: {processor.metrics['tire_degradation_percent']}%")
```

### Option 2: Multi-Role Dashboard (for blank-slate-canvas)

```python
from pitwall_integration import PitWallIntegration

# Initialize integration
integration = PitWallIntegration()

# Load and process
integration.load_and_process('road_america_results.csv')

# Export role-specific dashboards
exports = integration.export_role_specific_json('race_engineer')

# Get dashboard data for any role
race_eng_dashboard = integration.get_context_by_role('race_engineer')
strategist_dashboard = integration.get_context_by_role('strategist')
data_eng_dashboard = integration.get_context_by_role('data_engineer')
driver_dashboard = integration.get_context_by_role('driver')
broadcaster_dashboard = integration.get_context_by_role('broadcaster')

print("✓ Role-specific dashboards exported")
```

## Integration with blank-slate-canvas

### 1. Copy CSV Files to Data Directory

```bash
mkdir -p race_data/
cp *.csv race_data/

# Structure:
# race_data/
#   ├── road_america_results.csv
#   ├── sonoma_results.csv
#   ├── vir_results.csv
#   └── ...
```

### 2. Create Processing Script

```python
# process_races.py
from pitwall_integration import PitWallIntegration

def process_all_races():
    integration = PitWallIntegration(output_dir='./race_data/processed')
    
    # Process each track
    tracks = ['road_america', 'sonoma', 'vir', 'cota', 'barber', 'sebring']
    
    for track in tracks:
        csv_path = f'race_data/{track}_results.csv'
        
        try:
            integration.load_and_process(csv_path, track)
            integration.export_dashboard_json(f'{track}_dashboard.json')
            print(f"✓ Processed {track}")
        except FileNotFoundError:
            print(f"⚠ Skipped {track} (file not found)")

if __name__ == '__main__':
    process_all_races()
    print("\n✓ All races processed successfully")
```

### 3. FastAPI Integration

```python
# app.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import tempfile
from pathlib import Path

from pitwall_integration import PitWallIntegration

app = FastAPI()
integration = PitWallIntegration(output_dir='./race_data/processed')

# Serve React app
app.mount("/static", StaticFiles(directory="build"), name="static")

# API endpoints
@app.post("/api/process-race")
async def process_race(file: UploadFile = File(...)):
    """Process uploaded race CSV"""
    with tempfile.NamedTemporaryFile(suffix='.csv', delete=False) as temp:
        content = await file.read()
        temp.write(content)
        temp_path = temp.name
    
    try:
        dashboard_data = integration.load_and_process(temp_path)
        return JSONResponse(dashboard_data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)
    finally:
        Path(temp_path).unlink()

@app.get("/api/dashboard/{role}")
async def get_dashboard(role: str):
    """Get role-specific dashboard"""
    try:
        data = integration.get_context_by_role(role)
        return JSONResponse(data)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=400)

@app.get("/api/export/training")
async def export_training():
    """Export training data"""
    path = integration.export_training_data()
    return FileResponse(path, filename="training_data.csv")

@app.get("/api/metrics")
async def get_metrics():
    """Get current metrics"""
    dashboard = integration.get_dashboard_json()
    return JSONResponse(dashboard.get('metrics', {}))

# Run: uvicorn app:app --reload
```

## CSV Data Format Expected

The processor expects CSV with these columns:

```
POSITION, NUMBER, STATUS, LAPS, TOTAL_TIME, GAP_FIRST, GAP_PREVIOUS,
FL_LAPNUM, FL_TIME, FL_KPH, CLASS, GROUP, DIVISION, VEHICLE, TIRES
```

Example row:

```
1,55,Classified,15,45:03.689,-,-,14,2:43.767,143.2,Am,,GR Cup,Toyota GR86,
```

Delimiters supported: Semicolon (;) or Comma (,)

## Key Features

### 1. Pit Window Detection

```python
processor = PitWallProcessor('Road America')
processor.process_race_csv('road_america_results.csv')

# Access pit windows
for pit_event in processor.pit_windows:
    print(f"Car {pit_event['car_number']}: "
          f"Gap {pit_event['gap_to_previous_sec']}s "
          f"({pit_event['severity']})")
```

### 2. Driver Coaching Insights

```python
# Get specific driver insights
driver_insights = processor.driver_insights  # Car #88

print(driver_insights['rating'])  # 🟢 EXCELLENT
print(driver_insights['coaching_recommendation'])
print(driver_insights['improvement_areas'])
```

### 3. Tire Degradation Analysis

```python
metrics = processor.metrics

print(f"Tire degradation: {metrics['tire_degradation_percent']}%")
print(f"Peak speed: {metrics['peak_speed_kph']} kph")
print(f"Average speed: {metrics['average_lap_speed_kph']} kph")
```

### 4. Multi-Track Analysis

```python
processor = PitWallProcessor()

csv_files = {
    'Road America': 'road_america_results.csv',
    'Sonoma': 'sonoma_results.csv',
    'VIR': 'vir_results.csv'
}

result = processor.process_multiple_races(csv_files)
driver_strength = result['driver_strength_index']
```

## Output Files

After processing, you'll have:

```
race_data/processed/
├── road_america_dashboard.json       # Full dashboard data
├── dashboard_race_engineer.json       # Race engineer view
├── dashboard_strategist.json          # Strategist view
├── dashboard_data_engineer.json       # Data engineer view
├── dashboard_driver.json              # Driver/coach view
├── dashboard_broadcaster.json         # Broadcaster view
└── training_data.csv                  # ML training data
```

## JSON Output Structure

```json
{
  "race_info": {
    "track": "Road America",
    "date": "2025-11-20T20:12:00",
    "finishers": 28,
    "total_laps": 15
  },
  "top_performers": {
    "winner": {...},
    "fastest_lap": {...}
  },
  "pit_strategy": {
    "optimal_pit_window": {...},
    "detected_changes": [...],
    "strategy_recommendations": [...]
  },
  "driver_insights": {
    "88": {...},
    "55": {...}
  },
  "metrics": {
    "tire_degradation_percent": 3.0,
    "model_metrics": {...}
  }
}
```

## Common Use Cases

### Use Case 1: Real-Time Race Wall Console

```python
# For pit engineer
dashboard = integration.get_race_engineer_dashboard()
pit_window = dashboard['pit_window']
print(f"PIT NOW LAP {pit_window['recommended_lap']}")
print(f"Confidence: {pit_window['confidence']*100}%")
```

### Use Case 2: Post-Race Driver Debrief

```python
# For driver/coach
debrief = integration.get_driver_coach_dashboard()
for insight in debrief['coaching_insights']:
    print(f"{insight['sector']}: {insight['insight']}")
    print(f"Action: {insight['action']}")
```

### Use Case 3: Strategy Planning (Next Race)

```python
# For chief strategist
strategist = integration.get_strategist_dashboard()
for scenario in strategist['strategy_scenarios']:
    print(f"{scenario['name']}: "
          f"P{scenario['projected_position']} "
          f"(win prob: {scenario['win_probability']*100}%)")
```

### Use Case 4: Broadcast Commentary

```python
# For commentators
broadcaster = integration.get_broadcaster_dashboard()
print(broadcaster['race_headline'])
print(broadcaster['race_story'])
for moment in broadcaster['key_moments']:
    print(f"Lap {moment['lap']}: {moment['description']}")
```

## Troubleshooting

### Issue: "KeyError: 'number'"
**Solution:** CSV column names are case-sensitive. Ensure column names match (or they'll be auto-converted to lowercase by the processor).

### Issue: "No data loaded"
**Solution:** Make sure to call `load_and_process()` or `process_race_csv()` before accessing data.

### Issue: Times not parsing correctly
**Solution:** Check CSV delimiter. Processor auto-detects but semicolon (;) is the default for European formats.

### Issue: Pit windows not detected
**Solution:** Gap threshold is 5 seconds by default. Adjust in `_detect_pit_windows(gap_threshold=3.0)` for more sensitivity.

## Performance Notes

- Single race processing: ~200ms for 28 drivers
- Multi-track processing: ~1.2s for 6 tracks
- JSON export: <50ms
- CSV export: <100ms

For production, use `verbose=False` to suppress logging overhead.

## Integration Checklist

- [ ] Copy `pitwall_processor.py` to project
- [ ] Copy `pitwall_integration.py` to project
- [ ] Install dependencies: `pip install pandas numpy`
- [ ] Place CSV files in `race_data/` directory
- [ ] Run processing script
- [ ] Verify JSON exports in `race_data/processed/`
- [ ] Integrate FastAPI endpoints (if needed)
- [ ] Connect frontend to `/api/dashboard/{role}` endpoint
- [ ] Test with React/TypeScript dashboard
- [ ] Deploy!

## Questions or Issues?

For PitWall A.I. hackathon:
- Contact: hackathon@toyota.com
- GitHub: [PitWall A.I. repo]
- Devpost: [Hack-the-Track submission]

---

**Last Updated:** November 20, 2025  
**Version:** 1.0.0  
**Status:** Production Ready


