# Computer Vision API - Quick Start Guide

## Quick Setup

### 1. Install Dependencies (Optional)

```bash
# For Google Cloud Vision
pip install google-cloud-vision

# For AWS Rekognition  
pip install boto3
```

### 2. Configure API Keys

**Google Cloud Vision:**
```bash
export GOOGLE_CLOUD_VISION_API_KEY="your-api-key"
# OR for service account:
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

**AWS Rekognition:**
```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
```

### 3. Verify Service

```bash
curl http://localhost:8000/api/vision/health
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/vision/health` | GET | Check service availability |
| `/api/vision/track-condition` | POST | Analyze track from uploaded image |
| `/api/vision/track-condition/base64` | POST | Analyze track from base64 image |
| `/api/vision/tire-wear` | POST | Analyze tire wear from uploaded image |
| `/api/vision/tire-wear/base64` | POST | Analyze tire wear from base64 image |
| `/api/vision/ocr` | POST | Extract text from uploaded image |
| `/api/vision/ocr/base64` | POST | Extract text from base64 image |
| `/api/vision/providers` | GET | List available providers |

## Example Usage

### Track Condition Analysis

```bash
curl -X POST "http://localhost:8000/api/vision/track-condition" \
  -F "image=@track_photo.jpg" \
  -F "track_id=sebring"
```

### Tire Wear Analysis

```bash
curl -X POST "http://localhost:8000/api/vision/tire-wear" \
  -F "image=@tire_photo.jpg" \
  -F "tire_position=front_left"
```

## Integration Points

1. **Tire Wear Validation**: Use visual analysis to validate telemetry-based predictions
2. **Track Condition Monitoring**: Analyze track photos for strategy decisions
3. **OCR for Timing**: Extract text from lap boards and timing displays

## Pricing

- **Google Cloud Vision**: Free tier (1,000 units/month), then $1.50-$2.25 per 1,000 units
- **AWS Rekognition**: Free tier (1M images/month), then $0.001 per image

## Documentation

See [COMPUTER_VISION_INTEGRATION.md](./COMPUTER_VISION_INTEGRATION.md) for full documentation.

