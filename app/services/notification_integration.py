"""
Notification Integration
Integration hooks for connecting notification orchestrator with existing alert systems
"""

import logging
from typing import Dict, List, Optional
import os

from app.services.notification_orchestrator import notification_orchestrator

logger = logging.getLogger(__name__)


class NotificationIntegration:
    """
    Integration layer for connecting notification orchestrator with existing services.
    
    This module provides easy-to-use functions that can be called from:
    - Coaching alert service
    - Anomaly engine
    - Tire wear predictor
    - Strategy optimizer
    """
    
    def __init__(self):
        """Initialize notification integration"""
        self.orchestrator = notification_orchestrator
        self.enabled = os.getenv("NOTIFICATIONS_ENABLED", "true").lower() == "true"
        
        # Load default recipients from environment
        self.default_recipients = self._load_default_recipients()
    
    def _load_default_recipients(self) -> Dict[str, List[str]]:
        """Load default recipients from environment variables"""
        recipients = {}
        
        # SMS recipients
        sms_recipients = os.getenv("NOTIFICATION_SMS_RECIPIENTS", "")
        if sms_recipients:
            recipients["sms"] = [phone.strip() for phone in sms_recipients.split(",") if phone.strip()]
        
        # Email recipients
        email_recipients = os.getenv("NOTIFICATION_EMAIL_RECIPIENTS", "")
        if email_recipients:
            recipients["email"] = [email.strip() for email in email_recipients.split(",") if email.strip()]
        
        # Slack channels
        slack_channels = os.getenv("NOTIFICATION_SLACK_CHANNELS", "")
        if slack_channels:
            recipients["slack"] = [channel.strip() for channel in slack_channels.split(",") if channel.strip()]
        
        return recipients
    
    async def notify_coaching_alerts(
        self,
        alerts: List[Dict],
        driver_name: Optional[str] = None,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Dict]:
        """
        Send coaching alerts via notification orchestrator
        
        Args:
            alerts: List of coaching alert dictionaries
            driver_name: Driver name (optional)
            recipients: Override default recipients (optional)
        
        Returns:
            Dict mapping alert IDs to notification results
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping coaching alerts")
            return {}
        
        results = {}
        recipients = recipients or self.default_recipients
        
        for alert in alerts:
            # Add driver name if provided
            if driver_name:
                alert["driver_name"] = driver_name
            
            try:
                result = await self.orchestrator.send_coaching_alert(
                    coaching_alert=alert,
                    recipients=recipients
                )
                results[alert.get("id", "unknown")] = result
            except Exception as e:
                logger.error(f"Error sending coaching alert notification: {e}")
                results[alert.get("id", "unknown")] = {}
        
        return results
    
    async def notify_anomaly(
        self,
        anomaly: Dict,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send anomaly alert via notification orchestrator
        
        Args:
            anomaly: Anomaly dictionary from AnomalyEngine
            recipients: Override default recipients (optional)
        
        Returns:
            Dict of notification results by channel
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping anomaly alert")
            return {}
        
        recipients = recipients or self.default_recipients
        
        try:
            return await self.orchestrator.send_anomaly_alert(
                anomaly=anomaly,
                recipients=recipients
            )
        except Exception as e:
            logger.error(f"Error sending anomaly notification: {e}")
            return {}
    
    async def notify_tire_wear(
        self,
        vehicle_id: str,
        tire_wear: float,
        track_name: str,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send tire wear alert via notification orchestrator
        
        Args:
            vehicle_id: Vehicle identifier
            tire_wear: Tire wear percentage remaining
            track_name: Track name
            recipients: Override default recipients (optional)
        
        Returns:
            Dict of notification results by channel
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping tire wear alert")
            return {}
        
        recipients = recipients or self.default_recipients
        
        try:
            return await self.orchestrator.send_tire_wear_alert(
                vehicle_id=vehicle_id,
                tire_wear=tire_wear,
                track_name=track_name,
                recipients=recipients
            )
        except Exception as e:
            logger.error(f"Error sending tire wear notification: {e}")
            return {}
    
    async def notify_strategy_recommendation(
        self,
        recommendation: str,
        confidence: float,
        track_name: str,
        context: Optional[Dict] = None,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send strategy recommendation via notification orchestrator
        
        Args:
            recommendation: Strategy recommendation text
            confidence: Confidence score (0.0-1.0)
            track_name: Track name
            context: Additional context dict (optional)
            recipients: Override default recipients (optional)
        
        Returns:
            Dict of notification results by channel
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping strategy recommendation")
            return {}
        
        recipients = recipients or self.default_recipients
        
        try:
            return await self.orchestrator.send_strategy_recommendation(
                recommendation=recommendation,
                confidence=confidence,
                track_name=track_name,
                context=context,
                recipients=recipients
            )
        except Exception as e:
            logger.error(f"Error sending strategy recommendation: {e}")
            return {}
    
    async def notify_custom_alert(
        self,
        alert: Dict,
        channels: Optional[List[str]] = None,
        recipients: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, Optional[Dict]]:
        """
        Send custom alert via notification orchestrator
        
        Args:
            alert: Alert dictionary with at least 'message' and 'priority'
            channels: List of channels to use (optional)
            recipients: Override default recipients (optional)
        
        Returns:
            Dict of notification results by channel
        """
        if not self.enabled:
            logger.debug("Notifications disabled - skipping custom alert")
            return {}
        
        recipients = recipients or self.default_recipients
        
        try:
            return await self.orchestrator.send_notification(
                alert=alert,
                channels=channels,
                recipients=recipients
            )
        except Exception as e:
            logger.error(f"Error sending custom alert: {e}")
            return {}


# Global instance
notification_integration = NotificationIntegration()


# Convenience functions for easy import
async def notify_coaching_alerts(
    alerts: List[Dict],
    driver_name: Optional[str] = None,
    recipients: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Dict]:
    """Convenience function for sending coaching alerts"""
    return await notification_integration.notify_coaching_alerts(
        alerts=alerts,
        driver_name=driver_name,
        recipients=recipients
    )


async def notify_anomaly(
    anomaly: Dict,
    recipients: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Optional[Dict]]:
    """Convenience function for sending anomaly alerts"""
    return await notification_integration.notify_anomaly(
        anomaly=anomaly,
        recipients=recipients
    )


async def notify_tire_wear(
    vehicle_id: str,
    tire_wear: float,
    track_name: str,
    recipients: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Optional[Dict]]:
    """Convenience function for sending tire wear alerts"""
    return await notification_integration.notify_tire_wear(
        vehicle_id=vehicle_id,
        tire_wear=tire_wear,
        track_name=track_name,
        recipients=recipients
    )


async def notify_strategy_recommendation(
    recommendation: str,
    confidence: float,
    track_name: str,
    context: Optional[Dict] = None,
    recipients: Optional[Dict[str, List[str]]] = None
) -> Dict[str, Optional[Dict]]:
    """Convenience function for sending strategy recommendations"""
    return await notification_integration.notify_strategy_recommendation(
        recommendation=recommendation,
        confidence=confidence,
        track_name=track_name,
        context=context,
        recipients=recipients
    )


