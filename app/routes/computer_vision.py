"""
Computer Vision API Routes
Endpoints for track condition analysis and tire wear visual inspection
"""

import base64
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel

from app.config import (
    COMPUTER_VISION_ENABLED,
    GOOGLE_CLOUD_VISION_API_KEY,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    COMPUTER_VISION_PROVIDER
)
from app.services.computer_vision_service import (
    ComputerVisionService,
    VisionProvider
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/vision", tags=["computer-vision"])

# Initialize service
_vision_service = None


def get_vision_service() -> Optional[ComputerVisionService]:
    """Get or create vision service instance"""
    global _vision_service
    
    if not COMPUTER_VISION_ENABLED:
        return None
    
    if _vision_service is None:
        provider = VisionProvider(COMPUTER_VISION_PROVIDER) if COMPUTER_VISION_PROVIDER != "auto" else VisionProvider.AUTO
        _vision_service = ComputerVisionService(
            provider=provider,
            google_api_key=GOOGLE_CLOUD_VISION_API_KEY,
            aws_access_key=AWS_ACCESS_KEY_ID,
            aws_secret_key=AWS_SECRET_ACCESS_KEY,
            aws_region=AWS_REGION
        )
    
    return _vision_service


class ImageAnalysisRequest(BaseModel):
    """Request model for image analysis"""
    image_data: str  # Base64-encoded image
    image_format: Optional[str] = "jpeg"


class TireAnalysisRequest(BaseModel):
    """Request model for tire wear analysis"""
    image_data: str  # Base64-encoded image
    tire_position: Optional[str] = None  # "front_left", "front_right", "rear_left", "rear_right"


@router.get("/health")
async def health_check():
    """Check if computer vision service is available"""
    service = get_vision_service()
    
    if not service:
        return {
            "enabled": False,
            "message": "Computer vision service not configured. Set API keys in environment variables."
        }
    
    return {
        "enabled": True,
        "available": service.is_available(),
        "provider": service.active_provider.value,
        "message": "Computer vision service is ready" if service.is_available() else "Service initialized but not available"
    }


@router.post("/track-condition")
async def analyze_track_condition(
    image: UploadFile = File(...),
    track_id: Optional[str] = Form(None)
):
    """
    Analyze track condition from uploaded image
    
    Returns:
    - surface_condition: dry, wet, debris, unknown
    - weather_indicators: List of weather conditions detected
    - objects_detected: List of detected objects
    - confidence: Analysis confidence score
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        # Read image data
        image_bytes = await image.read()
        
        # Analyze track condition
        result = service.analyze_track_condition(image_bytes, image_format=image.content_type or "jpeg")
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Add metadata
        result["track_id"] = track_id
        result["image_size"] = len(image_bytes)
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing track condition: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze track condition: {str(e)}")


@router.post("/track-condition/base64")
async def analyze_track_condition_base64(request: ImageAnalysisRequest):
    """
    Analyze track condition from base64-encoded image
    
    Request body:
    - image_data: Base64-encoded image string
    - image_format: Optional image format (jpeg, png, etc.)
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        result = service.analyze_track_condition(
            request.image_data,
            image_format=request.image_format
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing track condition: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze track condition: {str(e)}")


@router.post("/tire-wear")
async def analyze_tire_wear(
    image: UploadFile = File(...),
    tire_position: Optional[str] = Form(None)
):
    """
    Analyze tire wear from uploaded image
    
    Parameters:
    - image: Tire image file
    - tire_position: Optional position (front_left, front_right, rear_left, rear_right)
    
    Returns:
    - wear_level: Estimated wear percentage (0-100)
    - defects: List of detected defects
    - confidence: Analysis confidence score
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        # Read image data
        image_bytes = await image.read()
        
        # Analyze tire wear
        result = service.analyze_tire_wear(image_bytes, tire_position=tire_position)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        # Add metadata
        result["image_size"] = len(image_bytes)
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing tire wear: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze tire wear: {str(e)}")


@router.post("/tire-wear/base64")
async def analyze_tire_wear_base64(request: TireAnalysisRequest):
    """
    Analyze tire wear from base64-encoded image
    
    Request body:
    - image_data: Base64-encoded image string
    - tire_position: Optional tire position
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        result = service.analyze_tire_wear(
            request.image_data,
            tire_position=request.tire_position
        )
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    
    except Exception as e:
        logger.error(f"Error analyzing tire wear: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze tire wear: {str(e)}")


@router.post("/ocr")
async def extract_text(image: UploadFile = File(...)):
    """
    Extract text from image using OCR
    
    Useful for reading track signage, lap boards, timing displays, etc.
    
    Returns:
    - text: Full extracted text
    - words: List of words with bounding boxes
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        # Read image data
        image_bytes = await image.read()
        
        # Extract text
        result = service.extract_text(image_bytes)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


@router.post("/ocr/base64")
async def extract_text_base64(request: ImageAnalysisRequest):
    """
    Extract text from base64-encoded image using OCR
    """
    service = get_vision_service()
    
    if not service or not service.is_available():
        raise HTTPException(
            status_code=503,
            detail="Computer vision service not available. Please configure API keys."
        )
    
    try:
        result = service.extract_text(request.image_data)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
    
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")


@router.get("/providers")
async def list_providers():
    """List available computer vision providers and their status"""
    service = get_vision_service()
    
    providers = {
        "google_cloud_vision": {
            "enabled": bool(GOOGLE_CLOUD_VISION_API_KEY),
            "configured": bool(GOOGLE_CLOUD_VISION_API_KEY),
            "available": False
        },
        "aws_rekognition": {
            "enabled": bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY),
            "configured": bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY),
            "available": False
        }
    }
    
    if service and service.is_available():
        providers[service.active_provider.value]["available"] = True
    
    return {
        "providers": providers,
        "active_provider": service.active_provider.value if service else None,
        "service_enabled": COMPUTER_VISION_ENABLED
    }


