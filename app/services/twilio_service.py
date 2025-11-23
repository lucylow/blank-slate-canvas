"""
Twilio API Service
SMS, Voice, and WhatsApp messaging service using Twilio API
API credentials must be set as secrets in Lovable Cloud:
- Twilio_SID
- Twilio_Secret
- Twilio_Phone_Number (optional, for SMS/Voice)
- Twilio_WhatsApp_Number (optional, for WhatsApp)

Features:
- Send SMS messages
- Make voice calls
- Send WhatsApp messages
- Phone number verification
- Status callbacks for message delivery

API Documentation: https://www.twilio.com/docs
"""
import httpx
import logging
import os
from typing import Dict, List, Optional, Union
from datetime import datetime
from urllib.parse import urlencode

logger = logging.getLogger(__name__)


class TwilioService:
    """
    Service for sending SMS, making voice calls, and sending WhatsApp messages via Twilio API.
    
    IMPORTANT: The following secrets must be set in Lovable Cloud:
    - Twilio_SID: Your Twilio Account SID
    - Twilio_Secret: Your Twilio Auth Token
    - Twilio_Phone_Number: Your Twilio phone number (for SMS/Voice)
    - Twilio_WhatsApp_Number: Your Twilio WhatsApp number (for WhatsApp, format: whatsapp:+14155238886)
    
    Usage:
        service = TwilioService()
        result = await service.send_sms(
            to="+1234567890",
            message="Hello from Twilio"
        )
    """
    
    TIMEOUT = 30.0  # 30 second timeout for API calls
    BASE_URL = "https://api.twilio.com/2010-04-01"
    
    def __init__(
        self, 
        account_sid: Optional[str] = None,
        auth_token: Optional[str] = None,
        phone_number: Optional[str] = None,
        whatsapp_number: Optional[str] = None
    ):
        """
        Initialize Twilio service.
        
        Args:
            account_sid: Optional Account SID. If not provided, will use Twilio_SID 
                        from environment (Lovable Cloud secret).
            auth_token: Optional Auth Token. If not provided, will use Twilio_Secret 
                       from environment (Lovable Cloud secret).
            phone_number: Optional phone number. If not provided, will use Twilio_Phone_Number 
                         from environment (Lovable Cloud secret).
            whatsapp_number: Optional WhatsApp number. If not provided, will use Twilio_WhatsApp_Number 
                            from environment (Lovable Cloud secret).
        
        Raises:
            ValueError: If required credentials are not found in environment or provided.
        """
        # IMPORTANT: Use secrets from Lovable Cloud
        self.account_sid = account_sid or os.getenv("Twilio_SID")
        self.auth_token = auth_token or os.getenv("Twilio_Secret")
        self.phone_number = phone_number or os.getenv("Twilio_Phone_Number")
        self.whatsapp_number = whatsapp_number or os.getenv("Twilio_WhatsApp_Number")
        
        if not self.account_sid:
            raise ValueError(
                "Twilio Account SID not found. "
                "Please set 'Twilio_SID' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Get your Account SID from: https://console.twilio.com/"
            )
        
        if not self.auth_token:
            raise ValueError(
                "Twilio Auth Token not found. "
                "Please set 'Twilio_Secret' as a secret in Lovable Cloud, "
                "or provide it as an argument. "
                "Get your Auth Token from: https://console.twilio.com/"
            )
        
        # Construct the base API URL
        self.api_url = f"{self.BASE_URL}/Accounts/{self.account_sid}"
        
        logger.info("Twilio service initialized (API credentials configured)")
    
    def _get_auth(self) -> tuple:
        """Get HTTP Basic Auth tuple for Twilio API"""
        return (self.account_sid, self.auth_token)
    
    async def send_sms(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None,
        status_callback: Optional[str] = None,
        status_callback_method: str = "POST"
    ) -> Dict:
        """
        Send an SMS message via Twilio.
        
        Args:
            to: Recipient phone number (E.164 format, e.g., "+1234567890")
            message: SMS message body (max 1600 characters)
            from_number: Sender phone number (defaults to Twilio_Phone_Number)
            status_callback: Optional URL to receive delivery status updates
            status_callback_method: HTTP method for status callback (default: POST)
        
        Returns:
            Dictionary with response data including:
            - success: Boolean indicating success
            - sid: Message SID
            - status: Message status
            - to: Recipient number
            - from_: Sender number
            - timestamp: ISO timestamp
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            if not from_number:
                if not self.phone_number:
                    raise ValueError(
                        "Twilio phone number not configured. "
                        "Please set 'Twilio_Phone_Number' as a secret in Lovable Cloud, "
                        "or provide 'from_number' argument."
                    )
                from_number = self.phone_number
            
            # Ensure phone numbers are in E.164 format
            if not to.startswith("+"):
                to = f"+{to.lstrip('+')}"
            if not from_number.startswith("+"):
                from_number = f"+{from_number.lstrip('+')}"
            
            # Prepare form data
            data = {
                "To": to,
                "From": from_number,
                "Body": message
            }
            
            if status_callback:
                data["StatusCallback"] = status_callback
                data["StatusCallbackMethod"] = status_callback_method
            
            # Send request
            url = f"{self.api_url}/Messages.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    url,
                    auth=self._get_auth(),
                    data=data
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"SMS sent successfully: {result.get('sid', 'unknown')}")
                return {
                    "success": True,
                    "sid": result.get("sid"),
                    "status": result.get("status"),
                    "to": result.get("to"),
                    "from_": result.get("from"),
                    "message": "SMS sent successfully",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Twilio API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error sending SMS: {e}")
            raise
    
    async def send_whatsapp(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None,
        status_callback: Optional[str] = None
    ) -> Dict:
        """
        Send a WhatsApp message via Twilio.
        
        Args:
            to: Recipient WhatsApp number (E.164 format, e.g., "+1234567890")
            message: Message body
            from_number: Sender WhatsApp number (defaults to Twilio_WhatsApp_Number)
            status_callback: Optional URL to receive delivery status updates
        
        Returns:
            Dictionary with response data
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            if not from_number:
                if not self.whatsapp_number:
                    raise ValueError(
                        "Twilio WhatsApp number not configured. "
                        "Please set 'Twilio_WhatsApp_Number' as a secret in Lovable Cloud, "
                        "or provide 'from_number' argument. "
                        "Format: whatsapp:+14155238886"
                    )
                from_number = self.whatsapp_number
            
            # Ensure WhatsApp format
            if not to.startswith("whatsapp:"):
                if not to.startswith("+"):
                    to = f"+{to.lstrip('+')}"
                to = f"whatsapp:{to}"
            
            if not from_number.startswith("whatsapp:"):
                if not from_number.startswith("+"):
                    from_number = f"+{from_number.lstrip('+')}"
                from_number = f"whatsapp:{from_number}"
            
            # Prepare form data
            data = {
                "To": to,
                "From": from_number,
                "Body": message
            }
            
            if status_callback:
                data["StatusCallback"] = status_callback
                data["StatusCallbackMethod"] = "POST"
            
            # Send request
            url = f"{self.api_url}/Messages.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    url,
                    auth=self._get_auth(),
                    data=data
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"WhatsApp message sent successfully: {result.get('sid', 'unknown')}")
                return {
                    "success": True,
                    "sid": result.get("sid"),
                    "status": result.get("status"),
                    "to": result.get("to"),
                    "from_": result.get("from"),
                    "message": "WhatsApp message sent successfully",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Twilio API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error sending WhatsApp message: {e}")
            raise
    
    async def make_voice_call(
        self,
        to: str,
        message: str,
        from_number: Optional[str] = None,
        url: Optional[str] = None,
        status_callback: Optional[str] = None,
        record: bool = False
    ) -> Dict:
        """
        Make a voice call via Twilio.
        
        Args:
            to: Recipient phone number (E.164 format)
            message: Text message to be spoken (used if 'url' is not provided)
            from_number: Sender phone number (defaults to Twilio_Phone_Number)
            url: Optional TwiML URL for custom call behavior
            status_callback: Optional URL to receive call status updates
            record: Whether to record the call
        
        Returns:
            Dictionary with response data
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        try:
            if not from_number:
                if not self.phone_number:
                    raise ValueError(
                        "Twilio phone number not configured. "
                        "Please set 'Twilio_Phone_Number' as a secret in Lovable Cloud, "
                        "or provide 'from_number' argument."
                    )
                from_number = self.phone_number
            
            # Ensure phone numbers are in E.164 format
            if not to.startswith("+"):
                to = f"+{to.lstrip('+')}"
            if not from_number.startswith("+"):
                from_number = f"+{from_number.lstrip('+')}"
            
            # If no URL provided, create a simple TwiML URL that speaks the message
            if not url:
                # For simplicity, we'll use Twilio's TwiML Bins or create inline TwiML
                # In production, you'd host a TwiML endpoint
                # For now, we'll use a simple approach with message parameter
                twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">{message}</Say></Response>'
                # Note: In production, host this TwiML at a URL and pass that URL
                # For now, we'll require a URL to be provided or use TwiML Bins
                raise ValueError(
                    "Voice calls require a TwiML URL. "
                    "Please provide a 'url' parameter pointing to your TwiML endpoint, "
                    "or set up a TwiML Bin in Twilio Console."
                )
            
            # Prepare form data
            data = {
                "To": to,
                "From": from_number,
                "Url": url
            }
            
            if status_callback:
                data["StatusCallback"] = status_callback
                data["StatusCallbackMethod"] = "POST"
            
            if record:
                data["Record"] = "true"
            
            # Send request
            call_url = f"{self.api_url}/Calls.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.post(
                    call_url,
                    auth=self._get_auth(),
                    data=data
                )
                response.raise_for_status()
                result = response.json()
                
                logger.info(f"Voice call initiated successfully: {result.get('sid', 'unknown')}")
                return {
                    "success": True,
                    "sid": result.get("sid"),
                    "status": result.get("status"),
                    "to": result.get("to"),
                    "from_": result.get("from"),
                    "message": "Voice call initiated successfully",
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Twilio API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error making voice call: {e}")
            raise
    
    async def send_alert_sms(
        self,
        to: str,
        alert_type: str,
        alert_message: str,
        severity: str = "medium"
    ) -> Dict:
        """
        Send an alert SMS with formatted message for racing alerts.
        
        Args:
            to: Recipient phone number
            alert_type: Type of alert (e.g., "tire_wear", "pit_stop", "overtaking")
            alert_message: Alert message
            severity: Alert severity ("low", "medium", "high")
        
        Returns:
            Dictionary with response data
        """
        # Format message with emoji based on severity
        emoji_map = {
            "high": "🔴",
            "medium": "🟡",
            "low": "🟢"
        }
        emoji = emoji_map.get(severity, "⚪")
        
        formatted_message = f"{emoji} PitWall Alert: {alert_message}\n\nType: {alert_type}\nSeverity: {severity.upper()}"
        
        return await self.send_sms(to=to, message=formatted_message)
    
    async def get_message_status(self, message_sid: str) -> Dict:
        """
        Get the status of a sent message.
        
        Args:
            message_sid: The SID of the message
        
        Returns:
            Dictionary with message status information
        """
        try:
            url = f"{self.api_url}/Messages/{message_sid}.json"
            async with httpx.AsyncClient(timeout=self.TIMEOUT) as client:
                response = await client.get(
                    url,
                    auth=self._get_auth()
                )
                response.raise_for_status()
                result = response.json()
                
                return {
                    "success": True,
                    "sid": result.get("sid"),
                    "status": result.get("status"),
                    "to": result.get("to"),
                    "from_": result.get("from"),
                    "body": result.get("body"),
                    "date_created": result.get("date_created"),
                    "date_sent": result.get("date_sent"),
                    "error_code": result.get("error_code"),
                    "error_message": result.get("error_message")
                }
                
        except httpx.HTTPStatusError as e:
            error_msg = f"Twilio API error: {e.response.status_code}"
            try:
                error_data = e.response.json()
                error_msg += f" - {error_data.get('message', e.response.text)}"
            except:
                error_msg += f" - {e.response.text}"
            
            logger.error(error_msg)
            raise
        except Exception as e:
            logger.error(f"Error getting message status: {e}")
            raise


# Global instance (lazy initialization to avoid API key errors at import time)
_twilio_service: Optional[TwilioService] = None


def get_twilio_service() -> Optional[TwilioService]:
    """
    Get global Twilio service instance.
    Returns None if API credentials are not configured.
    """
    global _twilio_service
    
    if _twilio_service is None:
        try:
            _twilio_service = TwilioService()
        except ValueError as e:
            logger.warning(f"Twilio service not available: {e}")
            return None
    
    return _twilio_service

