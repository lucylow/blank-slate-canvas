# PitWall AI Enhancements - Implementation Summary

## Overview
This document summarizes the AI enhancements implemented for PitWall AI, focusing on short-term wins that provide measurable model quality, explainability, and robust live inference.

## Implemented Features

### 1. Enhanced Tire Wear Prediction with Confidence Intervals ✅

**Backend Changes:**
- Enhanced `TireWearData` model in `app/models/analytics.py` with:
  - `confidence`: Confidence score (0-1)
  - `ci_lower`: Lower confidence intervals for each tire
  - `ci_upper`: Upper confidence intervals for each tire
  - `top_features`: Top contributing features with importance scores
  - `model_version`: Model version identifier

**Implementation:**
- Added `bootstrap_ci()` method to `TireWearPredictor` class
- Uses bootstrap sampling (25 samples by default) with 1% noise perturbation
- Calculates 5th and 95th percentiles for confidence intervals
- Confidence score calculated as inverse of relative CI width

**Location:** `Backend Code Development for AI Features in Application/pitwall-backend/app/services/tire_wear_predictor.py`

### 2. Feature Explainability (Ablation-based) ✅

**Implementation:**
- Added `ablation_importance()` method to calculate feature importance
- Uses ablation technique: estimates impact of each feature on tire wear prediction
- Returns top 6 features with normalized importance scores (0-1)
- Features analyzed:
  - `avg_lateral_g`: Average lateral G-forces
  - `avg_longitudinal_g`: Average longitudinal G-forces
  - `max_lateral_g`: Maximum lateral G-forces
  - `avg_speed`: Average speed
  - `heavy_braking_events`: Count of heavy braking events
  - `hard_cornering_events`: Count of hard cornering events

**Location:** `Backend Code Development for AI Features in Application/pitwall-backend/app/services/tire_wear_predictor.py`

### 3. Evaluation Endpoint ✅

**New Endpoint:** `GET /api/analytics/eval/tire-wear`

**Parameters:**
- `track` (optional): Track to evaluate (None = all tracks)
- `race` (optional): Race number (default: 1)
- `vehicle` (optional): Vehicle number (None = first available)
- `max_laps` (optional): Maximum laps to evaluate (default: 20)

**Returns:**
- For specific track: RMSE, MAE, sample count, and example predictions
- For all tracks: Per-track metrics and overall summary

**Implementation:**
- Uses leave-one-out validation: predict lap N using laps 1 to N-1
- Calculates RMSE and MAE metrics
- Supports evaluation across all tracks or specific track

**Location:** 
- Endpoint: `Backend Code Development for AI Features in Application/pitwall-backend/app/main.py`
- Evaluation logic: `Backend Code Development for AI Features in Application/pitwall-backend/app/analytics/eval.py`

### 4. Enhanced Dashboard Endpoint ✅

**Updated Endpoint:** `GET /api/dashboard/live`

**Changes:**
- Now uses enhanced predictor with CI and explainability enabled by default
- Returns tire wear predictions with:
  - Confidence intervals for all tires
  - Feature importance scores
  - Model version information

**Location:** `Backend Code Development for AI Features in Application/pitwall-backend/app/main.py`

### 5. Frontend Type Updates ✅

**Updated Types:**
- `TireWearData` interface in `src/api/pitwall.ts` now includes:
  - `confidence?: number`
  - `ci_lower?: Record<string, number>`
  - `ci_upper?: Record<string, number>`
  - `top_features?: Record<string, number>`
  - `model_version?: string`

- `DashboardData` in `src/lib/types.ts` updated to match backend structure

**Location:** 
- `src/api/pitwall.ts`
- `src/lib/types.ts`

### 6. Frontend UI Enhancements ✅

**Enhanced Component:** `TireWearCard`

**New Features:**
- Displays confidence score with color-coded badge (green/yellow/red)
- Shows confidence intervals for each tire wear percentage
- Displays top 3 contributing factors with:
  - Feature names (human-readable)
  - Importance bars (visual progress bars)
  - Percentage importance scores
- Shows model version badge
- Displays predicted laps remaining with CI

**Location:** `src/components/dashboard/TireWearCard.tsx`

### 7. Evaluation API Client ✅

**New Function:** `evaluateTireWear()`

**Usage:**
```typescript
import { evaluateTireWear } from '@/api/pitwall';

// Evaluate all tracks
const result = await evaluateTireWear();

// Evaluate specific track
const trackResult = await evaluateTireWear('sebring', 1, 7, 20);
```

**Location:** `src/api/pitwall.ts`

## API Usage Examples

### Get Enhanced Dashboard Data
```bash
GET /api/dashboard/live?track=sebring&race=1&vehicle=7&lap=15
```

**Response includes:**
```json
{
  "tire_wear": {
    "front_left": 45.2,
    "front_right": 47.1,
    "rear_left": 38.5,
    "rear_right": 39.8,
    "predicted_laps_remaining": 8,
    "pit_window_optimal": [20, 22],
    "confidence": 0.85,
    "ci_lower": {
      "front_left": 43.1,
      "front_right": 45.0,
      "rear_left": 36.8,
      "rear_right": 38.1,
      "predicted_laps_remaining": 6
    },
    "ci_upper": {
      "front_left": 47.3,
      "front_right": 49.2,
      "rear_left": 40.2,
      "rear_right": 41.5,
      "predicted_laps_remaining": 10
    },
    "top_features": {
      "avg_lateral_g": 0.43,
      "heavy_braking_events": 0.31,
      "avg_speed": 0.18,
      "hard_cornering_events": 0.08
    },
    "model_version": "v1.0-enhanced"
  }
}
```

### Evaluate Model Performance
```bash
# Evaluate all tracks
GET /api/analytics/eval/tire-wear?max_laps=20

# Evaluate specific track
GET /api/analytics/eval/tire-wear?track=sebring&race=1&vehicle=7&max_laps=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "track": "sebring",
    "race": 1,
    "vehicle": 7,
    "rmse": 2.45,
    "mae": 1.89,
    "samples": 15,
    "predictions": [...]
  },
  "timestamp": "2025-01-XX..."
}
```

## Technical Details

### Bootstrap Confidence Intervals
- Uses 25 bootstrap samples with 1% relative noise
- Calculates 5th and 95th percentiles for 90% confidence intervals
- Confidence score = 1 - (average CI width / (max wear + 1))

### Feature Importance
- Uses ablation-based approach
- Estimates contribution of each feature to tire wear calculation
- Normalizes scores to sum to 1.0
- Returns top 6 features by default

### Model Evaluation
- Leave-one-out cross-validation
- Predicts lap N using data from laps 1 to N-1
- Calculates RMSE and MAE metrics
- Supports per-track and aggregate evaluation

## Next Steps (Medium-term)

1. **Per-track Models**: Fine-tune models per track for 20-40% improvement
2. **Sequence Models**: Replace heuristics with TCN/LSTM for time-series modeling
3. **Monte Carlo Strategy Optimizer**: Add probabilistic strategy simulation
4. **Driver Fingerprinting**: Add anomaly detection and coaching insights

## Files Modified

### Backend
- `pitwall-backend/app/models/analytics.py` - Enhanced TireWearData model
- `pitwall-backend/app/services/tire_wear_predictor.py` - Added CI and explainability
- `pitwall-backend/app/main.py` - Added evaluation endpoint, updated dashboard
- `pitwall-backend/app/analytics/eval.py` - Evaluation harness (already existed, now integrated)

### Frontend
- `src/api/pitwall.ts` - Updated types, added evaluation function
- `src/lib/types.ts` - Updated DashboardData structure
- `src/components/dashboard/TireWearCard.tsx` - Enhanced UI with CI and explainability

## Testing

To test the enhancements:

1. **Start the backend server**
2. **Test dashboard endpoint:**
   ```bash
   curl "http://localhost:8000/api/dashboard/live?track=sebring&race=1&vehicle=7&lap=15"
   ```

3. **Test evaluation endpoint:**
   ```bash
   curl "http://localhost:8000/api/analytics/eval/tire-wear?track=sebring&max_laps=20"
   ```

4. **View in frontend:** Navigate to dashboard and verify:
   - Confidence badges display correctly
   - CI ranges show for each tire
   - Top features section displays with importance bars

## Performance Notes

- Bootstrap CI adds ~25x computation (25 samples), acceptable for demo
- Feature importance calculation is fast (O(n) where n = number of features)
- Evaluation endpoint may take time for all tracks (runs validation per track)


