"""
Twilio Alert Integration Service
Integrates Twilio SMS/WhatsApp/Voice with the alert system for racing notifications
"""
import logging
from typing import Dict, List, Optional
from datetime import datetime

from app.services.twilio_service import get_twilio_service
from app.services.coaching_alert_service import coaching_alert_service

logger = logging.getLogger(__name__)


class TwilioAlertIntegration:
    """
    Service for sending racing alerts via Twilio SMS, WhatsApp, or Voice calls.
    
    This service integrates with:
    - Strategy alerts (tire wear, pit stops, gap analysis)
    - Coaching alerts (driver performance feedback)
    - System alerts (anomalies, critical events)
    """
    
    def __init__(self):
        self.twilio_service = get_twilio_service()
        self.enabled = self.twilio_service is not None
        
        if not self.enabled:
            logger.warning("Twilio service not available - alert notifications disabled")
    
    async def send_strategy_alert(
        self,
        phone_number: str,
        alert_type: str,
        alert_message: str,
        severity: str = "medium",
        use_whatsapp: bool = False
    ) -> Optional[Dict]:
        """
        Send a strategy alert (tire wear, pit stop, gap analysis, etc.) via SMS or WhatsApp.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            alert_type: Type of alert (e.g., "tire_wear", "pit_stop", "overtaking")
            alert_message: Alert message
            severity: Alert severity ("low", "medium", "high")
            use_whatsapp: Whether to use WhatsApp instead of SMS
        
        Returns:
            Dictionary with send result, or None if Twilio is not configured
        """
        if not self.enabled:
            logger.debug("Twilio not configured - skipping alert notification")
            return None
        
        try:
            if use_whatsapp:
                result = await self.twilio_service.send_whatsapp(
                    to=phone_number,
                    message=self._format_strategy_alert(alert_type, alert_message, severity)
                )
            else:
                result = await self.twilio_service.send_alert_sms(
                    to=phone_number,
                    alert_type=alert_type,
                    alert_message=alert_message,
                    severity=severity
                )
            
            logger.info(f"Strategy alert sent via {'WhatsApp' if use_whatsapp else 'SMS'}: {result.get('sid')}")
            return result
            
        except Exception as e:
            logger.error(f"Error sending strategy alert: {e}")
            return None
    
    async def send_coaching_alert(
        self,
        phone_number: str,
        alert: Dict,
        use_whatsapp: bool = False
    ) -> Optional[Dict]:
        """
        Send a coaching alert (driver performance feedback) via SMS or WhatsApp.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            alert: Coaching alert dictionary from CoachingAlertService
            use_whatsapp: Whether to use WhatsApp instead of SMS
        
        Returns:
            Dictionary with send result, or None if Twilio is not configured
        """
        if not self.enabled:
            logger.debug("Twilio not configured - skipping coaching alert notification")
            return None
        
        try:
            message = self._format_coaching_alert(alert)
            
            if use_whatsapp:
                result = await self.twilio_service.send_whatsapp(
                    to=phone_number,
                    message=message
                )
            else:
                result = await self.twilio_service.send_sms(
                    to=phone_number,
                    message=message
                )
            
            logger.info(f"Coaching alert sent via {'WhatsApp' if use_whatsapp else 'SMS'}: {result.get('sid')}")
            return result
            
        except Exception as e:
            logger.error(f"Error sending coaching alert: {e}")
            return None
    
    async def send_critical_alert(
        self,
        phone_number: str,
        alert_message: str,
        use_voice: bool = False,
        use_whatsapp: bool = False
    ) -> Optional[Dict]:
        """
        Send a critical alert (system anomaly, safety issue, etc.) via SMS, WhatsApp, or Voice call.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            alert_message: Alert message
            use_voice: Whether to make a voice call (requires TwiML URL)
            use_whatsapp: Whether to use WhatsApp instead of SMS
        
        Returns:
            Dictionary with send result, or None if Twilio is not configured
        """
        if not self.enabled:
            logger.debug("Twilio not configured - skipping critical alert notification")
            return None
        
        try:
            formatted_message = f"🚨 CRITICAL ALERT: {alert_message}"
            
            if use_voice:
                # Note: Voice calls require a TwiML URL
                # In production, you'd host a TwiML endpoint or use Twilio Functions
                logger.warning("Voice calls require TwiML URL - falling back to SMS")
                use_voice = False
            
            if use_whatsapp:
                result = await self.twilio_service.send_whatsapp(
                    to=phone_number,
                    message=formatted_message
                )
            else:
                result = await self.twilio_service.send_sms(
                    to=phone_number,
                    message=formatted_message
                )
            
            logger.info(f"Critical alert sent via {'WhatsApp' if use_whatsapp else 'SMS'}: {result.get('sid')}")
            return result
            
        except Exception as e:
            logger.error(f"Error sending critical alert: {e}")
            return None
    
    async def send_batch_alerts(
        self,
        phone_number: str,
        alerts: List[Dict],
        alert_category: str = "strategy",
        use_whatsapp: bool = False
    ) -> Optional[Dict]:
        """
        Send multiple alerts in a single message.
        
        Args:
            phone_number: Recipient phone number (E.164 format)
            alerts: List of alert dictionaries
            alert_category: Category of alerts ("strategy", "coaching", "system")
            use_whatsapp: Whether to use WhatsApp instead of SMS
        
        Returns:
            Dictionary with send result, or None if Twilio is not configured
        """
        if not self.enabled:
            logger.debug("Twilio not configured - skipping batch alert notification")
            return None
        
        if not alerts:
            return None
        
        try:
            message = self._format_batch_alerts(alerts, alert_category)
            
            if use_whatsapp:
                result = await self.twilio_service.send_whatsapp(
                    to=phone_number,
                    message=message
                )
            else:
                result = await self.twilio_service.send_sms(
                    to=phone_number,
                    message=message
                )
            
            logger.info(f"Batch alerts sent via {'WhatsApp' if use_whatsapp else 'SMS'}: {result.get('sid')}")
            return result
            
        except Exception as e:
            logger.error(f"Error sending batch alerts: {e}")
            return None
    
    def _format_strategy_alert(self, alert_type: str, message: str, severity: str) -> str:
        """Format a strategy alert message"""
        emoji_map = {
            "high": "🔴",
            "medium": "🟡",
            "low": "🟢"
        }
        emoji = emoji_map.get(severity, "⚪")
        
        type_labels = {
            "tire_wear": "Tire Wear",
            "pit_stop": "Pit Stop",
            "overtaking": "Overtaking",
            "gap_analysis": "Gap Analysis",
            "fuel": "Fuel Strategy",
            "weather": "Weather Alert"
        }
        
        type_label = type_labels.get(alert_type, alert_type.replace("_", " ").title())
        
        return f"{emoji} PitWall Strategy Alert\n\n{type_label}: {message}\n\nSeverity: {severity.upper()}\nTime: {datetime.utcnow().strftime('%H:%M:%S UTC')}"
    
    def _format_coaching_alert(self, alert: Dict) -> str:
        """Format a coaching alert message"""
        priority_emoji = {
            "high": "🔴",
            "medium": "🟡",
            "low": "🟢"
        }
        
        priority = alert.get("priority", "medium")
        emoji = priority_emoji.get(priority, "⚪")
        
        category = alert.get("category", "general").replace("_", " ").title()
        message = alert.get("message", "")
        improvement_area = alert.get("improvement_area", "")
        
        formatted = f"{emoji} PitWall Coaching Alert\n\n"
        formatted += f"Category: {category}\n"
        formatted += f"Message: {message}\n"
        
        if improvement_area:
            formatted += f"Focus Area: {improvement_area.replace('_', ' ').title()}\n"
        
        formatted += f"\nPriority: {priority.upper()}\n"
        formatted += f"Time: {datetime.utcnow().strftime('%H:%M:%S UTC')}"
        
        return formatted
    
    def _format_batch_alerts(self, alerts: List[Dict], category: str) -> str:
        """Format multiple alerts into a single message"""
        category_labels = {
            "strategy": "Strategy Alerts",
            "coaching": "Coaching Alerts",
            "system": "System Alerts"
        }
        
        header = f"📊 PitWall {category_labels.get(category, category.title())}\n\n"
        header += f"Total Alerts: {len(alerts)}\n"
        header += f"Time: {datetime.utcnow().strftime('%H:%M:%S UTC')}\n\n"
        header += "=" * 30 + "\n\n"
        
        messages = []
        for i, alert in enumerate(alerts, 1):
            if category == "strategy":
                alert_type = alert.get("type", "unknown")
                message = alert.get("message", "")
                severity = alert.get("severity", "medium")
                messages.append(f"{i}. [{alert_type.upper()}] {message} (Severity: {severity})")
            elif category == "coaching":
                message = alert.get("message", "")
                priority = alert.get("priority", "medium")
                messages.append(f"{i}. {message} (Priority: {priority})")
            else:
                message = alert.get("message", str(alert))
                messages.append(f"{i}. {message}")
        
        return header + "\n".join(messages)
    
    def is_available(self) -> bool:
        """Check if Twilio service is available"""
        return self.enabled


# Global instance
twilio_alert_integration = TwilioAlertIntegration()


