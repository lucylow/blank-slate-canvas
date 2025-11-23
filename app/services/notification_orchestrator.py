"""
Notification Orchestrator
Unified notification service that routes alerts to appropriate channels
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime

from app.services.slack_service import slack_notification_service
from app.services.email_service import email_notification_service

logger = logging.getLogger(__name__)

# Import Twilio service if available
try:
    from app.services.twilio_service import TwilioService
    twilio_service = TwilioService()
    TWILIO_AVAILABLE = True
except (ImportError, Exception) as e:
    logger.warning(f"Twilio service not available: {e}")
    twilio_service = None
    TWILIO_AVAILABLE = False


class NotificationOrchestrator:
    """
    Unified notification service that routes alerts to appropriate channels
    based on priority, type, and user preferences.
    
    Channel routing logic:
    - Critical alerts: SMS + Slack + Email
    - High priority: Slack + Email
    - Medium priority: Slack
    - Low priority: Slack (optional)
    """
    
    def __init__(self):
        """Initialize notification orchestrator with all available services"""
        self.slack_service = slack_notification_service
        self.email_service = email_notification_service
        self.sms_service = twilio_service
        
        logger.info("Notification orchestrator initialized")
    
    async def send_notification(
        self,
        alert: Dict,
        channels: Optional[List[str]] = None,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Route notification to configured channels based on priority and type
        
        Args:
            alert: Alert dictionary with at least 'message' and 'priority' keys
            channels: List of channels to use (["sms", "email", "slack"])
                     If None, auto-routes based on priority
            recipients: Dict mapping channel to list of recipients
                       {"sms": ["+123..."], "email": ["..."], "slack": ["#channel"]}
        
        Returns:
            Dict mapping channel names to result dictionaries
        """
        priority = alert.get("priority", alert.get("severity", "medium"))
        alert_type = alert.get("type", "general")
        message = alert.get("message", str(alert))
        
        # Default channel routing based on priority
        if not channels:
            if priority == "critical":
                channels = ["sms", "slack", "email"]
            elif priority == "high":
                channels = ["slack", "email"]
            else:
                channels = ["slack"]
        
        results = {}
        
        # Send to SMS (Twilio) for critical/high priority alerts
        if "sms" in channels and priority in ["critical", "high"]:
            if recipients and "sms" in recipients:
                for phone in recipients["sms"]:
                    try:
                        if TWILIO_AVAILABLE and self.sms_service:
                            result = await self.sms_service.send_alert_sms(
                                to_number=phone,
                                alert_type=alert_type,
                                alert_message=message,
                                severity=priority
                            )
                            results["sms"] = result
                        else:
                            logger.debug("SMS service not available")
                            results["sms"] = None
                    except Exception as e:
                        logger.error(f"Error sending SMS: {e}")
                        results["sms"] = None
            else:
                logger.debug("No SMS recipients specified")
                results["sms"] = None
        
        # Send to Slack
        if "slack" in channels:
            try:
                slack_channel = None
                if recipients and "slack" in recipients and recipients["slack"]:
                    slack_channel = recipients["slack"][0]
                
                # Route to appropriate Slack method based on alert type
                if alert_type == "tire_wear":
                    results["slack"] = await self.slack_service.send_tire_wear_alert(
                        vehicle_id=alert.get("vehicle_id", "Unknown"),
                        tire_wear=alert.get("tire_wear", 0),
                        track_name=alert.get("track_name", "Unknown"),
                        recommended_action=alert.get("recommended_action")
                    )
                elif alert_type == "coaching":
                    results["slack"] = await self.slack_service.send_coaching_alert(
                        alert=alert,
                        driver_name=alert.get("driver_name")
                    )
                elif alert_type == "anomaly":
                    results["slack"] = await self.slack_service.send_anomaly_alert(
                        anomaly=alert,
                        vehicle_id=alert.get("vehicle_id")
                    )
                elif alert_type == "strategy":
                    results["slack"] = await self.slack_service.send_strategy_recommendation(
                        recommendation=message,
                        confidence=alert.get("confidence", 0.8),
                        track_name=alert.get("track_name", "Unknown"),
                        context=alert.get("context")
                    )
                else:
                    results["slack"] = await self.slack_service.send_alert(
                        message=message,
                        channel=slack_channel,
                        priority=priority
                    )
            except Exception as e:
                logger.error(f"Error sending Slack notification: {e}")
                results["slack"] = None
        
        # Send to Email
        if "email" in channels:
            if recipients and "email" in recipients:
                for email in recipients["email"]:
                    try:
                        result = await self.email_service.send_alert_email(
                            to_email=email,
                            alert=alert,
                            alert_type=alert_type
                        )
                        results["email"] = result
                    except Exception as e:
                        logger.error(f"Error sending email: {e}")
                        results["email"] = None
            else:
                logger.debug("No email recipients specified")
                results["email"] = None
        
        return results
    
    async def send_tire_wear_alert(
        self,
        vehicle_id: str,
        tire_wear: float,
        track_name: str,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send tire wear alert through appropriate channels
        
        Args:
            vehicle_id: Vehicle identifier
            tire_wear: Tire wear percentage remaining
            track_name: Track name
            recipients: Dict of recipients by channel
        
        Returns:
            Dict of results by channel
        """
        priority = "critical" if tire_wear < 20 else "high" if tire_wear < 40 else "medium"
        
        alert = {
            "type": "tire_wear",
            "priority": priority,
            "message": f"Tire wear alert: {tire_wear:.1f}% remaining for vehicle {vehicle_id}",
            "vehicle_id": vehicle_id,
            "tire_wear": tire_wear,
            "track_name": track_name,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_notification(alert, recipients=recipients)
    
    async def send_coaching_alert(
        self,
        coaching_alert: Dict,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send coaching alert through appropriate channels
        
        Args:
            coaching_alert: Coaching alert dictionary from CoachingAlertService
            recipients: Dict of recipients by channel
        
        Returns:
            Dict of results by channel
        """
        alert = {
            "type": "coaching",
            "priority": coaching_alert.get("priority", "medium"),
            "message": coaching_alert.get("message", ""),
            "category": coaching_alert.get("category", "general"),
            "improvement_area": coaching_alert.get("improvement_area", ""),
            "confidence": coaching_alert.get("confidence", 0.0),
            "driver_name": coaching_alert.get("driver_name"),
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Coaching alerts typically go to Slack only (not SMS)
        channels = ["slack", "email"] if alert["priority"] in ["high", "critical"] else ["slack"]
        
        return await self.send_notification(alert, channels=channels, recipients=recipients)
    
    async def send_anomaly_alert(
        self,
        anomaly: Dict,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send anomaly alert through appropriate channels
        
        Args:
            anomaly: Anomaly dictionary from AnomalyEngine
            recipients: Dict of recipients by channel
        
        Returns:
            Dict of results by channel
        """
        alert = {
            "type": "anomaly",
            "priority": anomaly.get("severity", "medium"),
            "message": anomaly.get("description", "Anomaly detected"),
            "anomaly_type": anomaly.get("type", "unknown"),
            "vehicle_id": anomaly.get("vehicle_id"),
            "timestamp": anomaly.get("timestamp", datetime.utcnow().isoformat())
        }
        
        return await self.send_notification(alert, recipients=recipients)
    
    async def send_strategy_recommendation(
        self,
        recommendation: str,
        confidence: float,
        track_name: str,
        context: Optional[Dict] = None,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send strategy recommendation through appropriate channels
        
        Args:
            recommendation: Strategy recommendation text
            confidence: Confidence score (0.0-1.0)
            track_name: Track name
            context: Additional context dict
            recipients: Dict of recipients by channel
        
        Returns:
            Dict of results by channel
        """
        alert = {
            "type": "strategy",
            "priority": "medium",
            "message": recommendation,
            "confidence": confidence,
            "track_name": track_name,
            "context": context or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        return await self.send_notification(alert, recipients=recipients)
    
    async def send_race_report(
        self,
        to_email: str,
        pdf_path: str,
        race_name: str,
        track_name: str,
        additional_context: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Send post-race report PDF via email
        
        Args:
            to_email: Recipient email address
            pdf_path: Path to PDF file
            race_name: Name of the race
            track_name: Track name
            additional_context: Additional context data
        
        Returns:
            Result dict from email service
        """
        return await self.email_service.send_race_report(
            to_email=to_email,
            pdf_path=pdf_path,
            race_name=race_name,
            track_name=track_name,
            additional_context=additional_context
        )
    
    async def send_race_summary(
        self,
        to_email: str,
        summary_data: Dict,
        track_name: str
    ) -> Optional[Dict]:
        """
        Send automated race summary via email
        
        Args:
            to_email: Recipient email address
            summary_data: Summary data dictionary
            track_name: Track name
        
        Returns:
            Result dict from email service
        """
        return await self.email_service.send_race_summary(
            to_email=to_email,
            summary_data=summary_data,
            track_name=track_name
        )


# Global instance
notification_orchestrator = NotificationOrchestrator()

