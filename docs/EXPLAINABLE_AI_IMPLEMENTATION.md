# Explainable AI Implementation

## Overview

This document describes the Explainable AI system that provides top-3 evidence-based explanations for all predictions in the PitWall A.I. system.

## Features

- **SHAP-based feature importance** with fallback methods
- **Top-3 evidence extraction** with confidence scoring
- **Human-readable explanations** with actionable insights
- **Real-time evidence frames** with telemetry visualization
- **Multiple explanation formats** (summary, evidence, technical)
- **Batch processing support** for multiple predictions
- **Comparison capabilities** across different explanations

## Architecture

### Backend Components

1. **ExplainableAIService** (`app/services/explainable_ai_service.py`)
   - Core service for generating explanations
   - Calculates SHAP values for feature importance
   - Extracts top-3 contributing features
   - Generates human-readable explanations

2. **Explanation Routes** (`app/routes/explanations.py`)
   - `/api/explanations/explain` - Generate single explanation
   - `/api/explanations/{explanation_id}` - Get stored explanation
   - `/api/explanations/compare` - Compare multiple explanations
   - `/api/explanations/batch-explain` - Batch explanation generation

### Frontend Components

1. **ExplanationViewer** (`src/components/ExplanationViewer.tsx`)
   - React component for displaying explanations
   - Three-tab interface: Summary, Evidence, Technical
   - Real-time explanation generation
   - Visual evidence breakdown

2. **ExplanationViewer.css** (`src/components/ExplanationViewer.css`)
   - Styled components for explanation display
   - Responsive design
   - Dark theme optimized

## Usage Examples

### Python Backend

```python
from app.services.explainable_ai_service import ExplainableAIService

explainable_ai = ExplainableAIService()

# Generate explanation for tire degradation prediction
tire_features = {
    'tire_stress_sector_1': 168000,
    'tire_stress_sector_2': 142000,
    'brake_energy': 1.12,
    'avg_speed': 185.5,
    'slip_angle_avg': 2.1,
    'track_temperature': 45.2,
    'lap_count': 12,
    'cornering_aggression': 0.8
}

explanation = await explainable_ai.generate_explanation(
    prediction_type='tire_degradation',
    model=None,  # Optional model object
    features=tire_features,
    prediction=0.321,  # predicted degradation per lap
    baseline_data=None  # Optional baseline
)

print(explanation['human_readable']['summary'])
# "Predicted degradation of 0.321s per lap is primarily driven by:"
```

### API Request

```bash
curl -X POST http://localhost:8000/api/explanations/explain \
  -H "Content-Type: application/json" \
  -d '{
    "prediction_type": "tire_degradation",
    "features": {
      "tire_stress_sector_1": 168000,
      "tire_stress_sector_2": 142000,
      "brake_energy": 1.12
    },
    "prediction": 0.321
  }'
```

### React Component

```tsx
import ExplanationViewer from './components/ExplanationViewer';

function MyComponent() {
  const features = {
    tire_stress_sector_1: 168000,
    tire_stress_sector_2: 142000,
    brake_energy: 1.12
  };

  return (
    <ExplanationViewer
      prediction={0.321}
      features={features}
      predictionType="tire_degradation"
    />
  );
}
```

## Explanation Types

### 1. Tire Degradation

Provides explanations for tire wear predictions:
- Tire stress in different sectors
- Brake energy impact
- Cornering aggression
- Track temperature effects

### 2. Lap Time Prediction

Explains lap time predictions:
- Sector performance breakdown
- Tire wear effects
- Fuel load impact
- Track evolution

### 3. Pit Strategy

Explains strategy recommendations:
- Tire wear rate considerations
- Competitor strategies
- Safety car probability
- Weather forecasts

## Response Structure

```json
{
  "explanation_id": "explain_uuid",
  "prediction_type": "tire_degradation",
  "prediction_value": 0.321,
  "top_evidence": [
    {
      "rank": 1,
      "feature": "tire_stress_sector_1",
      "importance": 0.15,
      "impact": "positive",
      "actual_value": 168000,
      "description": "High lateral loads in Sector 1 corners",
      "impact_strength": "high",
      "evidence_strength": 85.5
    }
  ],
  "evidence_frames": [...],
  "human_readable": {
    "title": "Tire Degradation Analysis",
    "summary": "Predicted degradation of 0.321s per lap is primarily driven by:",
    "key_factors": [...],
    "recommendation": [...],
    "confidence_note": "High confidence in explanation"
  },
  "confidence": {
    "overall": 0.92,
    "coverage": 0.78,
    "reliability": "high",
    "factors_considered": 8
  }
}
```

## Dependencies

### Optional Dependencies

- **SHAP library**: For advanced SHAP value calculations
  ```bash
  pip install shap
  ```
  
  Note: The system works without SHAP using fallback methods, but SHAP provides more accurate explanations.

- **Redis**: For storing explanations (optional)
  - The system includes in-memory fallback storage
  - Redis is only used if available

### Required Dependencies

- FastAPI (already in requirements.txt)
- NumPy (for numerical operations)
- Standard Python libraries

## Configuration

The system is automatically configured when imported. No additional configuration is required.

## Error Handling

The system includes comprehensive error handling:
- Fallback explanations when SHAP is unavailable
- Graceful degradation when Redis is unavailable
- Validation of input parameters
- Detailed error logging

## Future Enhancements

1. **Model-specific explainers**: Support for different model types (LightGBM, XGBoost, Neural Networks)
2. **Real-time streaming explanations**: WebSocket support for live explanations
3. **Explanation history**: Track explanation trends over time
4. **A/B testing**: Compare different explanation methods
5. **Multi-language support**: Translate explanations to different languages

## Testing

Example test cases:

```python
import pytest
from app.services.explainable_ai_service import ExplainableAIService

@pytest.mark.asyncio
async def test_tire_degradation_explanation():
    service = ExplainableAIService()
    features = {
        'tire_stress_sector_1': 168000,
        'brake_energy': 1.12
    }
    
    explanation = await service.generate_explanation(
        prediction_type='tire_degradation',
        features=features,
        prediction=0.321
    )
    
    assert explanation['prediction_type'] == 'tire_degradation'
    assert len(explanation['top_evidence']) <= 3
    assert explanation['confidence']['overall'] > 0
```

## License

This implementation is part of the PitWall A.I. project.



