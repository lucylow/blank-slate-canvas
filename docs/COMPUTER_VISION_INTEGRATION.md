# Computer Vision API Integration

This document describes the integration of Computer Vision APIs for track condition analysis and tire wear visual inspection.

## Overview

The Computer Vision service supports two major providers:
- **Google Cloud Vision API**: General-purpose image analysis with OCR capabilities
- **AWS Rekognition**: Similar capabilities with better video analysis support

Both APIs can be used for:
- **Track Condition Analysis**: Analyzing track surface conditions, weather indicators, and debris detection
- **Tire Wear Visual Inspection**: Visual analysis of tire condition from images
- **OCR (Optical Character Recognition)**: Extracting text from track signage, lap boards, etc.

## Features

### Track Condition Analysis
- Surface condition detection (dry, wet, debris)
- Weather indicator detection (rain, fog, cloudy, clear)
- Object detection (debris, barriers, flags, etc.)
- Confidence scoring

### Tire Wear Analysis
- Wear level estimation (0-100%)
- Defect detection (cracks, bulges, cuts, low pressure)
- Tire position tracking (front_left, front_right, rear_left, rear_right)
- Visual validation of telemetry-based predictions

### OCR
- Text extraction from images
- Bounding box coordinates for each word
- Useful for reading track signage, timing displays, lap boards

## Setup

### Prerequisites

Install optional dependencies:

```bash
# For Google Cloud Vision
pip install google-cloud-vision

# For AWS Rekognition
pip install boto3
```

### Configuration

#### Google Cloud Vision API

**Option 1: Service Account (Recommended for Production)**

1. Create a service account in Google Cloud Console
2. Download the JSON key file
3. Set environment variable:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

**Option 2: API Key (Limited Functionality)**

1. Get API key from Google Cloud Console
2. Set environment variable:
   ```bash
   export GOOGLE_CLOUD_VISION_API_KEY="your-api-key"
   ```

#### AWS Rekognition

1. Create AWS credentials (Access Key ID and Secret Access Key)
2. Set environment variables:
   ```bash
   export AWS_ACCESS_KEY_ID="your-access-key"
   export AWS_SECRET_ACCESS_KEY="your-secret-key"
   export AWS_REGION="us-east-1"  # Optional, defaults to us-east-1
   ```

#### Provider Selection

The service automatically selects a provider based on available credentials. You can also explicitly set it:

```bash
export COMPUTER_VISION_PROVIDER="google_cloud_vision"  # or "aws_rekognition" or "auto"
```

## API Endpoints

### Health Check

```http
GET /api/vision/health
```

Check if the computer vision service is available and configured.

**Response:**
```json
{
  "enabled": true,
  "available": true,
  "provider": "google_cloud_vision",
  "message": "Computer vision service is ready"
}
```

### Track Condition Analysis

#### Upload Image

```http
POST /api/vision/track-condition
Content-Type: multipart/form-data

image: <file>
track_id: "sebring" (optional)
```

#### Base64 Image

```http
POST /api/vision/track-condition/base64
Content-Type: application/json

{
  "image_data": "base64-encoded-image-string",
  "image_format": "jpeg"
}
```

**Response:**
```json
{
  "provider": "google_cloud_vision",
  "surface_condition": "dry",
  "weather_indicators": ["clear", "sunny"],
  "objects_detected": [
    {
      "name": "Road",
      "confidence": 0.95,
      "bounding_box": {
        "x": 0.1,
        "y": 0.2
      }
    }
  ],
  "labels": ["Road", "Asphalt", "Racing", "Track"],
  "confidence": 0.95,
  "dominant_colors": [
    {
      "color": "rgb(120, 120, 120)",
      "score": 0.45
    }
  ],
  "track_id": "sebring",
  "image_size": 245678
}
```

### Tire Wear Analysis

#### Upload Image

```http
POST /api/vision/tire-wear
Content-Type: multipart/form-data

image: <file>
tire_position: "front_left" (optional)
```

#### Base64 Image

```http
POST /api/vision/tire-wear/base64
Content-Type: application/json

{
  "image_data": "base64-encoded-image-string",
  "tire_position": "front_left"
}
```

**Response:**
```json
{
  "provider": "google_cloud_vision",
  "tire_position": "front_left",
  "wear_level": 65.0,
  "defects": [],
  "tire_detected": true,
  "confidence": 0.92,
  "labels": ["Tire", "Wheel", "Rubber", "Tread"],
  "image_size": 189234
}
```

### OCR (Text Extraction)

#### Upload Image

```http
POST /api/vision/ocr
Content-Type: multipart/form-data

image: <file>
```

#### Base64 Image

```http
POST /api/vision/ocr/base64
Content-Type: application/json

{
  "image_data": "base64-encoded-image-string",
  "image_format": "jpeg"
}
```

**Response:**
```json
{
  "provider": "google_cloud_vision",
  "text": "LAP 12\nBEST: 1:45.234",
  "words": [
    {
      "text": "LAP",
      "bounding_box": {
        "vertices": [
          {"x": 10, "y": 20},
          {"x": 50, "y": 20},
          {"x": 50, "y": 40},
          {"x": 10, "y": 40}
        ]
      }
    }
  ]
}
```

### List Providers

```http
GET /api/vision/providers
```

Get status of all available providers.

**Response:**
```json
{
  "providers": {
    "google_cloud_vision": {
      "enabled": true,
      "configured": true,
      "available": true
    },
    "aws_rekognition": {
      "enabled": false,
      "configured": false,
      "available": false
    }
  },
  "active_provider": "google_cloud_vision",
  "service_enabled": true
}
```

## Usage Examples

### Python Client

```python
import requests
import base64

# Read image file
with open("track_photo.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# Analyze track condition
response = requests.post(
    "http://localhost:8000/api/vision/track-condition/base64",
    json={
        "image_data": image_data,
        "image_format": "jpeg"
    }
)

result = response.json()
print(f"Surface condition: {result['surface_condition']}")
print(f"Weather: {result['weather_indicators']}")
```

### JavaScript/TypeScript Client

```typescript
// Convert image to base64
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64 = reader.result as string;
  const imageData = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
  
  const response = await fetch('/api/vision/track-condition/base64', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_data: imageData,
      image_format: 'jpeg'
    })
  });
  
  const result = await response.json();
  console.log('Surface condition:', result.surface_condition);
};
reader.readAsDataURL(file);
```

### cURL Examples

```bash
# Track condition analysis
curl -X POST "http://localhost:8000/api/vision/track-condition" \
  -F "image=@track_photo.jpg" \
  -F "track_id=sebring"

# Tire wear analysis
curl -X POST "http://localhost:8000/api/vision/tire-wear" \
  -F "image=@tire_photo.jpg" \
  -F "tire_position=front_left"

# OCR
curl -X POST "http://localhost:8000/api/vision/ocr" \
  -F "image=@lap_board.jpg"
```

## Integration with Existing Features

### Tire Wear Validation

The computer vision service can be used to validate and calibrate telemetry-based tire wear predictions:

```python
# Get telemetry-based prediction
telemetry_wear = get_tire_wear_from_telemetry(vehicle_id, lap)

# Get visual inspection
visual_result = vision_service.analyze_tire_wear(tire_image)

# Combine for higher confidence
if abs(telemetry_wear - visual_result['wear_level']) < 10:
    confidence = 0.95  # High confidence when both agree
else:
    confidence = 0.70  # Lower confidence when they disagree
```

### Track Condition Monitoring

Use track condition analysis to inform strategy decisions:

```python
track_condition = vision_service.analyze_track_condition(track_image)

if track_condition['surface_condition'] == 'wet':
    # Adjust tire strategy for wet conditions
    recommend_wet_weather_tires()
elif 'debris' in track_condition['objects_detected']:
    # Alert about track debris
    send_alert("Track debris detected - caution advised")
```

## Pricing Considerations

### Google Cloud Vision API

- **Label Detection**: First 1,000 units/month free, then $1.50 per 1,000 units
- **Object Localization**: First 1,000 units/month free, then $2.25 per 1,000 units
- **Image Properties**: First 1,000 units/month free, then $1.50 per 1,000 units
- **Text Detection (OCR)**: First 1,000 units/month free, then $1.50 per 1,000 units

### AWS Rekognition

- **DetectLabels**: First 1M images/month at $0.001 per image
- **DetectText**: First 1M images/month at $0.001 per image
- **Custom Labels**: Additional cost for custom model training

**Note**: Both providers offer free tiers that are sufficient for development and low-volume production use.

## Limitations and Recommendations

### Current Implementation

The current implementation uses general-purpose computer vision APIs with basic heuristics for tire wear estimation. For production use, consider:

1. **Custom Model Training**: Train domain-specific models for tire wear analysis
2. **Specialized APIs**: Consider specialized tire inspection APIs (TireScan, Tiretest.Ai) for higher accuracy
3. **Hybrid Approach**: Combine visual analysis with telemetry-based predictions for best results

### Best Practices

1. **Image Quality**: Ensure images are well-lit and in focus for best results
2. **Consistent Angles**: Use consistent camera angles for tire inspection
3. **Caching**: Cache results for the same images to reduce API costs
4. **Error Handling**: Always handle cases where the service is unavailable
5. **Cost Management**: Monitor API usage and set up billing alerts

## Future Enhancements

- [ ] Custom ML models for tire-specific analysis
- [ ] Integration with specialized tire inspection APIs
- [ ] Real-time video stream analysis
- [ ] Multi-image analysis for better accuracy
- [ ] Historical image comparison
- [ ] Automated image capture from pit lane cameras

## Troubleshooting

### Service Not Available

If the service returns "not available":
1. Check that API keys are set in environment variables
2. Verify that optional dependencies are installed (`google-cloud-vision` or `boto3`)
3. Check service account permissions (for Google Cloud)
4. Verify AWS credentials have Rekognition permissions

### Low Confidence Scores

- Ensure images are high quality and well-lit
- Use consistent camera angles
- Consider custom model training for domain-specific use cases

### API Errors

- Check API quotas and limits
- Verify billing is enabled (for Google Cloud)
- Check network connectivity
- Review API logs for detailed error messages

## References

- [Google Cloud Vision API Documentation](https://cloud.google.com/vision/docs)
- [AWS Rekognition Documentation](https://docs.aws.amazon.com/rekognition/)
- [Computer Vision API Research Summary](./COMPUTER_VISION_APIS.md) (if created)

