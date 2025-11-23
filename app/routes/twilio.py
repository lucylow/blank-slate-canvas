"""
Twilio API Routes
Endpoints for sending SMS, making voice calls, and sending WhatsApp messages via Twilio
"""
from fastapi import APIRouter, HTTPException, Body, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Union
import logging

from app.services.twilio_service import get_twilio_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/twilio", tags=["Twilio"])


class SMSRequest(BaseModel):
    """Request model for sending SMS"""
    to: str = Field(..., description="Recipient phone number (E.164 format, e.g., '+1234567890')")
    message: str = Field(..., description="SMS message body (max 1600 characters)")
    from_number: Optional[str] = Field(None, description="Sender phone number (defaults to Twilio_Phone_Number)")
    status_callback: Optional[str] = Field(None, description="URL to receive delivery status updates")
    status_callback_method: str = Field("POST", description="HTTP method for status callback")


class WhatsAppRequest(BaseModel):
    """Request model for sending WhatsApp messages"""
    to: str = Field(..., description="Recipient WhatsApp number (E.164 format, e.g., '+1234567890')")
    message: str = Field(..., description="Message body")
    from_number: Optional[str] = Field(None, description="Sender WhatsApp number (defaults to Twilio_WhatsApp_Number)")
    status_callback: Optional[str] = Field(None, description="URL to receive delivery status updates")


class VoiceCallRequest(BaseModel):
    """Request model for making voice calls"""
    to: str = Field(..., description="Recipient phone number (E.164 format)")
    message: str = Field(..., description="Text message to be spoken (used if 'url' is not provided)")
    from_number: Optional[str] = Field(None, description="Sender phone number (defaults to Twilio_Phone_Number)")
    url: Optional[str] = Field(None, description="TwiML URL for custom call behavior")
    status_callback: Optional[str] = Field(None, description="URL to receive call status updates")
    record: bool = Field(False, description="Whether to record the call")


class AlertSMSRequest(BaseModel):
    """Request model for sending alert SMS"""
    to: str = Field(..., description="Recipient phone number (E.164 format)")
    alert_type: str = Field(..., description="Type of alert (e.g., 'tire_wear', 'pit_stop', 'overtaking')")
    alert_message: str = Field(..., description="Alert message")
    severity: str = Field("medium", description="Alert severity: 'low', 'medium', or 'high'")


class TwilioResponse(BaseModel):
    """Response model for Twilio operations"""
    success: bool
    sid: Optional[str] = None
    status: Optional[str] = None
    to: Optional[str] = None
    from_: Optional[str] = None
    message: str
    timestamp: str


@router.post("/sms/send", response_model=TwilioResponse)
async def send_sms(request: SMSRequest):
    """
    Send an SMS message via Twilio.
    
    Requires Twilio secrets to be configured in Lovable Cloud:
    - Twilio_SID
    - Twilio_Secret
    - Twilio_Phone_Number
    
    Example request:
    ```json
    {
        "to": "+1234567890",
        "message": "Hello from PitWall AI!"
    }
    ```
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        raise HTTPException(
            status_code=503,
            detail="Twilio service is not configured. Please set Twilio_SID, Twilio_Secret, and Twilio_Phone_Number secrets in Lovable Cloud."
        )
    
    try:
        result = await twilio_service.send_sms(
            to=request.to,
            message=request.message,
            from_number=request.from_number,
            status_callback=request.status_callback,
            status_callback_method=request.status_callback_method
        )
        
        return TwilioResponse(**result)
        
    except Exception as e:
        logger.error(f"Error sending SMS: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send SMS: {str(e)}"
        )


@router.post("/whatsapp/send", response_model=TwilioResponse)
async def send_whatsapp(request: WhatsAppRequest):
    """
    Send a WhatsApp message via Twilio.
    
    Requires Twilio secrets to be configured in Lovable Cloud:
    - Twilio_SID
    - Twilio_Secret
    - Twilio_WhatsApp_Number (format: whatsapp:+14155238886)
    
    Example request:
    ```json
    {
        "to": "+1234567890",
        "message": "Hello from PitWall AI!"
    }
    ```
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        raise HTTPException(
            status_code=503,
            detail="Twilio service is not configured. Please set Twilio_SID, Twilio_Secret, and Twilio_WhatsApp_Number secrets in Lovable Cloud."
        )
    
    try:
        result = await twilio_service.send_whatsapp(
            to=request.to,
            message=request.message,
            from_number=request.from_number,
            status_callback=request.status_callback
        )
        
        return TwilioResponse(**result)
        
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send WhatsApp message: {str(e)}"
        )


@router.post("/voice/call", response_model=TwilioResponse)
async def make_voice_call(request: VoiceCallRequest):
    """
    Make a voice call via Twilio.
    
    Requires Twilio secrets to be configured in Lovable Cloud:
    - Twilio_SID
    - Twilio_Secret
    - Twilio_Phone_Number
    
    Note: Voice calls require a TwiML URL. You can:
    1. Host a TwiML endpoint that returns XML
    2. Use Twilio TwiML Bins
    3. Use Twilio Functions
    
    Example request:
    ```json
    {
        "to": "+1234567890",
        "message": "This is a test call",
        "url": "https://your-server.com/twiml/voice"
    }
    ```
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        raise HTTPException(
            status_code=503,
            detail="Twilio service is not configured. Please set Twilio_SID, Twilio_Secret, and Twilio_Phone_Number secrets in Lovable Cloud."
        )
    
    try:
        result = await twilio_service.make_voice_call(
            to=request.to,
            message=request.message,
            from_number=request.from_number,
            url=request.url,
            status_callback=request.status_callback,
            record=request.record
        )
        
        return TwilioResponse(**result)
        
    except Exception as e:
        logger.error(f"Error making voice call: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to make voice call: {str(e)}"
        )


@router.post("/alerts/sms", response_model=TwilioResponse)
async def send_alert_sms(request: AlertSMSRequest):
    """
    Send an alert SMS with formatted message for racing alerts.
    
    This endpoint formats the alert message with emojis and severity indicators.
    
    Example request:
    ```json
    {
        "to": "+1234567890",
        "alert_type": "tire_wear",
        "alert_message": "Critical tire wear: 15% remaining. Pit window: Laps 15-17",
        "severity": "high"
    }
    ```
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        raise HTTPException(
            status_code=503,
            detail="Twilio service is not configured. Please set Twilio_SID, Twilio_Secret, and Twilio_Phone_Number secrets in Lovable Cloud."
        )
    
    # Validate severity
    if request.severity not in ["low", "medium", "high"]:
        raise HTTPException(
            status_code=400,
            detail="Severity must be 'low', 'medium', or 'high'"
        )
    
    try:
        result = await twilio_service.send_alert_sms(
            to=request.to,
            alert_type=request.alert_type,
            alert_message=request.alert_message,
            severity=request.severity
        )
        
        return TwilioResponse(**result)
        
    except Exception as e:
        logger.error(f"Error sending alert SMS: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to send alert SMS: {str(e)}"
        )


@router.get("/messages/{message_sid}/status")
async def get_message_status(message_sid: str):
    """
    Get the status of a sent message.
    
    Args:
        message_sid: The SID of the message (returned when sending a message)
    
    Returns:
        Message status information including delivery status, error codes, etc.
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        raise HTTPException(
            status_code=503,
            detail="Twilio service is not configured."
        )
    
    try:
        result = await twilio_service.get_message_status(message_sid)
        return result
        
    except Exception as e:
        logger.error(f"Error getting message status: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get message status: {str(e)}"
        )


@router.get("/health")
async def twilio_health():
    """
    Check if Twilio service is configured and available.
    """
    twilio_service = get_twilio_service()
    
    if not twilio_service:
        return {
            "available": False,
            "message": "Twilio service is not configured. Please set Twilio_SID, Twilio_Secret, and Twilio_Phone_Number secrets in Lovable Cloud."
        }
    
    return {
        "available": True,
        "message": "Twilio service is configured and ready",
        "account_sid": twilio_service.account_sid[:10] + "..." if twilio_service.account_sid else None,
        "phone_number_configured": bool(twilio_service.phone_number),
        "whatsapp_number_configured": bool(twilio_service.whatsapp_number)
    }

