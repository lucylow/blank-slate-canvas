# Preprocessor v2 & Feature Engineering Integration Summary

## What Was Integrated

This integration adds improved Data Preprocessing & Feature Engineering capabilities to the PitWall AI multi-agent system, based on the proposed workflow improvements.

## Files Created/Modified

### New Files

1. **`preprocessor/preprocessor_v2.js`**
   - Improved preprocessor with Redis Streams ingestion
   - AJV schema validation for strict data quality
   - Real-time derived feature computation
   - Per-sector aggregation with evidence samples
   - Metrics tracking in Redis

2. **`predictor/fe_lib.py`**
   - Python feature engineering library
   - Functions: canonicalize, compute_derived, sectorize, aggregate_per_sector
   - Model-ready feature vector preparation
   - Compatible with training notebooks

3. **`predictor/predictor_wrapper.py`**
   - Integration wrapper for predictor agents
   - `features_from_task()` - Extract features from aggregate_window tasks
   - `get_feature_names()` - Feature names for explainability

4. **`PREPROCESSOR_V2_INTEGRATION.md`**
   - Complete integration guide
   - Setup instructions
   - Message format documentation
   - Testing guide

### Modified Files

1. **`package.json`**
   - Added `ajv` (schema validation)
   - Added `lodash` (utilities)
   - Added `preprocessor:v2` npm script

2. **`requirements.txt`**
   - Added `pandas>=2.0.0` (for fe_lib.py)

3. **`README.md`**
   - Updated with preprocessor v2 information
   - Added feature engineering library references

## Key Improvements

### 1. Strict Schema Validation
- AJV validates all incoming telemetry
- Type coercion ensures data consistency
- Invalid frames rejected and counted

### 2. Enhanced Canonicalization
- Standardized field names across all sources
- Unit normalization
- Missing field handling

### 3. Real-Time Derived Features
- `lateral_g` - Lateral acceleration
- `long_g` - Longitudinal acceleration
- `inst_tire_stress` - Instantaneous tire stress (accx² + accy²)
- `brake_power` - Brake power (brake_pct × speed)
- `steer_rate` - Steering rate (computed from previous sample)

### 4. Sectorization
- Uses `track_sectors.json` for deterministic sector mapping
- Falls back to equal-thirds if track not found
- Supports variable sectors per track

### 5. Per-Sector Aggregation
- Aggregates by (track, chassis, lap, sector)
- Computes: avg_speed, max_lat_g, tire_stress_sum, brake_energy
- Includes evidence samples (top 3) for debugging

### 6. Data Quality Metrics
- Tracks: frames_processed, invalid_frames, parse_errors, process_errors
- Stored in Redis hash `preproc.metrics`
- Enables monitoring and alerting

### 7. Compact Message Format
- Aggregate windows include only essential data
- Evidence samples limited to 3 per sector
- Full traces available on-demand via evidence references

## Integration Points

### Preprocessor v2 → Predictor
```
telemetry.stream → preprocessor_v2 → aggregates.stream → predictor
                                      tasks.stream
```

### Predictor Integration
```python
from predictor_wrapper import features_from_task

# In predictor_agent.py
features = features_from_task(task)
prediction = model.predict([features])[0]
```

### EDA Integration
```python
from fe_lib import aggregate_per_sector, prepare_features_for_model

# Use same feature engineering for clustering
agg = aggregate_per_sector(samples, track_sectors, track)
features = prepare_features_for_model(agg)
```

## Next Steps (Recommended)

1. **Unit Tests**
   - Test `computeDerived` with synthetic inputs
   - Test `sectorize_point` for all 7 tracks
   - Test `aggregate_per_sector` with known data

2. **Training Notebook**
   - Use `fe_lib.prepare_features_for_model` to train per-track models
   - Export joblib pickles for predictor agents

3. **Docker Compose**
   - Local testing environment with Redis + all agents
   - End-to-end testing with sample data

4. **Prometheus Export**
   - Export `preproc.metrics` to Prometheus
   - Dashboard for data quality monitoring

## Testing

### Quick Test
```bash
# Start Redis
redis-server

# Start preprocessor v2
cd agents/preprocessor
REDIS_URL=redis://localhost:6379 node preprocessor_v2.js

# In another terminal, publish test data
redis-cli XADD telemetry.stream '*' data '{"meta_time":"2025-01-20T12:00:00Z","track":"cota","chassis":"GR86-002","lap":12,"lapdist_m":1500,"speed_kmh":180,"accx_can":0.5,"accy_can":-1.2,"Steering_Angle":15,"throttle_pct":85,"brake_pct":0,"rpm":6500}'

# Check aggregates
redis-cli XREAD COUNT 1 STREAMS aggregates.stream 0

# Check metrics
redis-cli HGETALL preproc.metrics
```

## Compatibility

- **Backward Compatible**: Original `preprocessor-agent.js` still available
- **Gradual Migration**: Can run both versions in parallel
- **Same Output Format**: Aggregate windows compatible with existing predictors

## References

- Integration Guide: `PREPROCESSOR_V2_INTEGRATION.md`
- Feature Engineering: `predictor/fe_lib.py`
- Predictor Wrapper: `predictor/predictor_wrapper.py`
- Seed Document: `/mnt/data/2 Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I. .md`

## Questions?

See `PREPROCESSOR_V2_INTEGRATION.md` for detailed documentation, or check the code comments in the new files.

