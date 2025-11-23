"""
Computer Vision Service
Supports Google Cloud Vision API and AWS Rekognition for:
- Track condition analysis from images
- Tire wear visual inspection
- Object detection and scene analysis
"""

import os
import base64
import json
from typing import Dict, List, Optional, Union, Any
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class VisionProvider(str, Enum):
    """Supported computer vision providers"""
    GOOGLE_CLOUD_VISION = "google_cloud_vision"
    AWS_REKOGNITION = "aws_rekognition"
    AUTO = "auto"  # Automatically select based on availability


class ComputerVisionService:
    """
    Service for computer vision analysis using Google Cloud Vision or AWS Rekognition.
    
    Features:
    - Track condition analysis (surface, debris, weather impact)
    - Tire wear visual inspection
    - Object detection and scene analysis
    - OCR for track signage and markers
    """
    
    def __init__(
        self,
        provider: VisionProvider = VisionProvider.AUTO,
        google_api_key: Optional[str] = None,
        aws_access_key: Optional[str] = None,
        aws_secret_key: Optional[str] = None,
        aws_region: str = "us-east-1"
    ):
        """
        Initialize Computer Vision Service
        
        Args:
            provider: Vision provider to use (or AUTO to select automatically)
            google_api_key: Google Cloud Vision API key
            aws_access_key: AWS access key for Rekognition
            aws_secret_key: AWS secret key for Rekognition
            aws_region: AWS region for Rekognition
        """
        self.provider = provider
        self.google_api_key = google_api_key or os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "")
        self.aws_access_key = aws_access_key or os.getenv("AWS_ACCESS_KEY_ID", "")
        self.aws_secret_key = aws_secret_key or os.getenv("AWS_SECRET_ACCESS_KEY", "")
        self.aws_region = aws_region or os.getenv("AWS_REGION", "us-east-1")
        
        # Determine active provider
        self.active_provider = self._determine_provider()
        
        # Initialize provider-specific clients
        self._google_client = None
        self._aws_client = None
        
        if self.active_provider == VisionProvider.GOOGLE_CLOUD_VISION:
            self._init_google_client()
        elif self.active_provider == VisionProvider.AWS_REKOGNITION:
            self._init_aws_client()
    
    def _determine_provider(self) -> VisionProvider:
        """Determine which provider to use"""
        if self.provider != VisionProvider.AUTO:
            return self.provider
        
        # Auto-select based on available credentials
        if self.google_api_key:
            return VisionProvider.GOOGLE_CLOUD_VISION
        elif self.aws_access_key and self.aws_secret_key:
            return VisionProvider.AWS_REKOGNITION
        else:
            logger.warning("No computer vision API credentials found. Service will be disabled.")
            return VisionProvider.GOOGLE_CLOUD_VISION  # Default to Google
    
    def _init_google_client(self):
        """Initialize Google Cloud Vision client"""
        try:
            from google.cloud import vision
            from google.oauth2 import service_account
            
            # Try to use service account if available
            service_account_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
            if service_account_path and os.path.exists(service_account_path):
                credentials = service_account.Credentials.from_service_account_file(
                    service_account_path
                )
                self._google_client = vision.ImageAnnotatorClient(credentials=credentials)
            elif self.google_api_key:
                # Use API key (limited functionality)
                self._google_client = vision.ImageAnnotatorClient()
            else:
                logger.warning("Google Cloud Vision: No credentials found")
        except ImportError:
            logger.warning("google-cloud-vision not installed. Install with: pip install google-cloud-vision")
        except Exception as e:
            logger.error(f"Failed to initialize Google Cloud Vision client: {e}")
    
    def _init_aws_client(self):
        """Initialize AWS Rekognition client"""
        try:
            import boto3
            
            if self.aws_access_key and self.aws_secret_key:
                self._aws_client = boto3.client(
                    'rekognition',
                    aws_access_key_id=self.aws_access_key,
                    aws_secret_access_key=self.aws_secret_key,
                    region_name=self.aws_region
                )
            else:
                # Try default credentials
                self._aws_client = boto3.client('rekognition', region_name=self.aws_region)
        except ImportError:
            logger.warning("boto3 not installed. Install with: pip install boto3")
        except Exception as e:
            logger.error(f"Failed to initialize AWS Rekognition client: {e}")
    
    def is_available(self) -> bool:
        """Check if service is available and configured"""
        if self.active_provider == VisionProvider.GOOGLE_CLOUD_VISION:
            return self._google_client is not None
        elif self.active_provider == VisionProvider.AWS_REKOGNITION:
            return self._aws_client is not None
        return False
    
    def analyze_track_condition(
        self,
        image_data: Union[bytes, str],
        image_format: str = "jpeg"
    ) -> Dict[str, Any]:
        """
        Analyze track condition from image
        
        Args:
            image_data: Image bytes or base64-encoded string
            image_format: Image format (jpeg, png, etc.)
        
        Returns:
            Dictionary with analysis results including:
            - surface_condition: dry, wet, debris, etc.
            - weather_indicators: rain, fog, clear, etc.
            - objects_detected: List of detected objects
            - confidence: Overall confidence score
        """
        if not self.is_available():
            return {"error": "Computer vision service not available"}
        
        try:
            # Convert image to bytes if needed
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            if self.active_provider == VisionProvider.GOOGLE_CLOUD_VISION:
                return self._analyze_track_condition_google(image_bytes)
            elif self.active_provider == VisionProvider.AWS_REKOGNITION:
                return self._analyze_track_condition_aws(image_bytes)
        except Exception as e:
            logger.error(f"Error analyzing track condition: {e}")
            return {"error": str(e)}
    
    def _analyze_track_condition_google(self, image_bytes: bytes) -> Dict[str, Any]:
        """Analyze track condition using Google Cloud Vision"""
        from google.cloud import vision
        
        image = vision.Image(content=image_bytes)
        
        # Perform multiple detections
        response = self._google_client.annotate_image({
            'image': image,
            'features': [
                {'type_': vision.Feature.Type.LABEL_DETECTION},
                {'type_': vision.Feature.Type.OBJECT_LOCALIZATION},
                {'type_': vision.Feature.Type.IMAGE_PROPERTIES},
                {'type_': vision.Feature.Type.SAFE_SEARCH_DETECTION},
            ],
        })
        
        # Extract relevant information
        labels = [label.description for label in response.label_annotations]
        objects = [
            {
                "name": obj.name,
                "confidence": obj.score,
                "bounding_box": {
                    "x": obj.bounding_poly.normalized_vertices[0].x if obj.bounding_poly.normalized_vertices else 0,
                    "y": obj.bounding_poly.normalized_vertices[0].y if obj.bounding_poly.normalized_vertices else 0,
                }
            }
            for obj in response.localized_object_annotations
        ]
        
        # Determine surface condition from labels
        surface_condition = self._infer_surface_condition(labels)
        weather_indicators = self._infer_weather(labels)
        
        return {
            "provider": "google_cloud_vision",
            "surface_condition": surface_condition,
            "weather_indicators": weather_indicators,
            "objects_detected": objects,
            "labels": labels[:10],  # Top 10 labels
            "confidence": response.label_annotations[0].score if response.label_annotations else 0.0,
            "dominant_colors": [
                {
                    "color": f"rgb({c.color.red}, {c.color.green}, {c.color.blue})",
                    "score": c.score
                }
                for c in response.image_properties_annotation.dominant_colors.colors[:5]
            ] if response.image_properties_annotation else []
        }
    
    def _analyze_track_condition_aws(self, image_bytes: bytes) -> Dict[str, Any]:
        """Analyze track condition using AWS Rekognition"""
        response = self._aws_client.detect_labels(
            Image={'Bytes': image_bytes},
            MaxLabels=20,
            MinConfidence=50
        )
        
        labels = [label['Name'] for label in response['Labels']]
        objects = [
            {
                "name": label['Name'],
                "confidence": label['Confidence'],
                "instances": [
                    {
                        "bounding_box": {
                            "x": inst['BoundingBox']['Left'],
                            "y": inst['BoundingBox']['Top'],
                            "width": inst['BoundingBox']['Width'],
                            "height": inst['BoundingBox']['Height'],
                        }
                    }
                    for inst in label.get('Instances', [])
                ]
            }
            for label in response['Labels']
        ]
        
        surface_condition = self._infer_surface_condition(labels)
        weather_indicators = self._infer_weather(labels)
        
        return {
            "provider": "aws_rekognition",
            "surface_condition": surface_condition,
            "weather_indicators": weather_indicators,
            "objects_detected": objects,
            "labels": labels,
            "confidence": response['Labels'][0]['Confidence'] if response['Labels'] else 0.0
        }
    
    def analyze_tire_wear(
        self,
        image_data: Union[bytes, str],
        tire_position: Optional[str] = None  # "front_left", "front_right", "rear_left", "rear_right"
    ) -> Dict[str, Any]:
        """
        Analyze tire wear from image
        
        Args:
            image_data: Image bytes or base64-encoded string
            tire_position: Optional tire position for context
        
        Returns:
            Dictionary with tire analysis results:
            - wear_level: Estimated wear percentage
            - tread_depth: Estimated tread depth (if detectable)
            - defects: List of detected defects
            - confidence: Analysis confidence
        """
        if not self.is_available():
            return {"error": "Computer vision service not available"}
        
        try:
            # Convert image to bytes if needed
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            if self.active_provider == VisionProvider.GOOGLE_CLOUD_VISION:
                return self._analyze_tire_wear_google(image_bytes, tire_position)
            elif self.active_provider == VisionProvider.AWS_REKOGNITION:
                return self._analyze_tire_wear_aws(image_bytes, tire_position)
        except Exception as e:
            logger.error(f"Error analyzing tire wear: {e}")
            return {"error": str(e)}
    
    def _analyze_tire_wear_google(self, image_bytes: bytes, tire_position: Optional[str]) -> Dict[str, Any]:
        """Analyze tire wear using Google Cloud Vision"""
        from google.cloud import vision
        
        image = vision.Image(content=image_bytes)
        
        # Use object localization and label detection
        response = self._google_client.annotate_image({
            'image': image,
            'features': [
                {'type_': vision.Feature.Type.OBJECT_LOCALIZATION},
                {'type_': vision.Feature.Type.LABEL_DETECTION},
                {'type_': vision.Feature.Type.IMAGE_PROPERTIES},
            ],
        })
        
        labels = [label.description.lower() for label in response.label_annotations]
        
        # Look for tire-related objects
        tire_objects = [
            obj for obj in response.localized_object_annotations
            if 'tire' in obj.name.lower() or 'wheel' in obj.name.lower()
        ]
        
        # Infer wear level from visual characteristics
        wear_level = self._estimate_tire_wear(labels, tire_objects)
        defects = self._detect_tire_defects(labels, tire_objects)
        
        return {
            "provider": "google_cloud_vision",
            "tire_position": tire_position,
            "wear_level": wear_level,
            "defects": defects,
            "tire_detected": len(tire_objects) > 0,
            "confidence": tire_objects[0].score if tire_objects else 0.0,
            "labels": [label.description for label in response.label_annotations[:10]]
        }
    
    def _analyze_tire_wear_aws(self, image_bytes: bytes, tire_position: Optional[str]) -> Dict[str, Any]:
        """Analyze tire wear using AWS Rekognition"""
        response = self._aws_client.detect_labels(
            Image={'Bytes': image_bytes},
            MaxLabels=20,
            MinConfidence=50
        )
        
        labels = [label['Name'].lower() for label in response['Labels']]
        
        # Look for tire-related labels
        tire_labels = [
            label for label in response['Labels']
            if 'tire' in label['Name'].lower() or 'wheel' in label['Name'].lower()
        ]
        
        wear_level = self._estimate_tire_wear(labels, tire_labels)
        defects = self._detect_tire_defects(labels, tire_labels)
        
        return {
            "provider": "aws_rekognition",
            "tire_position": tire_position,
            "wear_level": wear_level,
            "defects": defects,
            "tire_detected": len(tire_labels) > 0,
            "confidence": tire_labels[0]['Confidence'] if tire_labels else 0.0,
            "labels": [label['Name'] for label in response['Labels'][:10]]
        }
    
    def _infer_surface_condition(self, labels: List[str]) -> str:
        """Infer track surface condition from labels"""
        labels_lower = [l.lower() for l in labels]
        
        if any(word in ' '.join(labels_lower) for word in ['water', 'wet', 'rain', 'puddle']):
            return "wet"
        elif any(word in ' '.join(labels_lower) for word in ['debris', 'rubble', 'rock', 'gravel']):
            return "debris"
        elif any(word in ' '.join(labels_lower) for word in ['dry', 'asphalt', 'concrete', 'road']):
            return "dry"
        else:
            return "unknown"
    
    def _infer_weather(self, labels: List[str]) -> List[str]:
        """Infer weather conditions from labels"""
        labels_lower = [l.lower() for l in labels]
        weather = []
        
        if any(word in ' '.join(labels_lower) for word in ['rain', 'rainy', 'precipitation']):
            weather.append("rain")
        if any(word in ' '.join(labels_lower) for word in ['fog', 'foggy', 'mist']):
            weather.append("fog")
        if any(word in ' '.join(labels_lower) for word in ['cloud', 'cloudy', 'overcast']):
            weather.append("cloudy")
        if any(word in ' '.join(labels_lower) for word in ['sun', 'sunny', 'clear']):
            weather.append("clear")
        
        return weather if weather else ["unknown"]
    
    def _estimate_tire_wear(self, labels: List[str], tire_objects: List[Any]) -> Optional[float]:
        """
        Estimate tire wear level from visual analysis
        
        Note: This is a basic heuristic. For production, consider:
        - Custom ML models trained on tire images
        - Specialized tire inspection APIs
        - Integration with telemetry-based predictions
        """
        if not tire_objects:
            return None
        
        labels_lower = ' '.join([l.lower() for l in labels])
        
        # Basic heuristics (would need custom model for accuracy)
        if any(word in labels_lower for word in ['worn', 'bald', 'smooth']):
            return 80.0  # High wear
        elif any(word in labels_lower for word in ['new', 'fresh', 'tread']):
            return 20.0  # Low wear
        else:
            return 50.0  # Medium wear (default estimate)
    
    def _detect_tire_defects(self, labels: List[str], tire_objects: List[Any]) -> List[str]:
        """Detect tire defects from visual analysis"""
        if not tire_objects:
            return []
        
        labels_lower = ' '.join([l.lower() for l in labels])
        defects = []
        
        if any(word in labels_lower for word in ['crack', 'cracked', 'split']):
            defects.append("cracking")
        if any(word in labels_lower for word in ['bulge', 'bubble', 'blister']):
            defects.append("bulging")
        if any(word in labels_lower for word in ['cut', 'gash', 'tear']):
            defects.append("cuts")
        if any(word in labels_lower for word in ['flat', 'deflated', 'low pressure']):
            defects.append("low_pressure")
        
        return defects
    
    def extract_text(self, image_data: Union[bytes, str]) -> Dict[str, Any]:
        """
        Extract text from image (OCR)
        Useful for reading track signage, lap boards, etc.
        
        Args:
            image_data: Image bytes or base64-encoded string
        
        Returns:
            Dictionary with extracted text and bounding boxes
        """
        if not self.is_available():
            return {"error": "Computer vision service not available"}
        
        try:
            if isinstance(image_data, str):
                image_bytes = base64.b64decode(image_data)
            else:
                image_bytes = image_data
            
            if self.active_provider == VisionProvider.GOOGLE_CLOUD_VISION:
                return self._extract_text_google(image_bytes)
            elif self.active_provider == VisionProvider.AWS_REKOGNITION:
                return self._extract_text_aws(image_bytes)
        except Exception as e:
            logger.error(f"Error extracting text: {e}")
            return {"error": str(e)}
    
    def _extract_text_google(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract text using Google Cloud Vision OCR"""
        from google.cloud import vision
        
        image = vision.Image(content=image_bytes)
        response = self._google_client.text_detection(image=image)
        
        texts = response.text_annotations
        
        if not texts:
            return {"text": "", "words": []}
        
        full_text = texts[0].description
        words = [
            {
                "text": text.description,
                "bounding_box": {
                    "vertices": [
                        {"x": v.x, "y": v.y}
                        for v in text.bounding_poly.vertices
                    ]
                }
            }
            for text in texts[1:]  # Skip first (full text)
        ]
        
        return {
            "provider": "google_cloud_vision",
            "text": full_text,
            "words": words
        }
    
    def _extract_text_aws(self, image_bytes: bytes) -> Dict[str, Any]:
        """Extract text using AWS Rekognition OCR"""
        response = self._aws_client.detect_text(Image={'Bytes': image_bytes})
        
        text_detections = response.get('TextDetections', [])
        
        words = [
            {
                "text": detection['DetectedText'],
                "confidence": detection['Confidence'],
                "bounding_box": {
                    "x": detection['Geometry']['BoundingBox']['Left'],
                    "y": detection['Geometry']['BoundingBox']['Top'],
                    "width": detection['Geometry']['BoundingBox']['Width'],
                    "height": detection['Geometry']['BoundingBox']['Height'],
                },
                "type": detection['Type']  # 'LINE' or 'WORD'
            }
            for detection in text_detections
        ]
        
        full_text = ' '.join([w['text'] for w in words if w['type'] == 'LINE'])
        
        return {
            "provider": "aws_rekognition",
            "text": full_text,
            "words": words
        }

