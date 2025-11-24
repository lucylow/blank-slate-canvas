"""
Slack Notification Service
Real-time team notifications and race updates via Slack API
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    from slack_sdk import WebClient
    from slack_sdk.errors import SlackApiError
    SLACK_AVAILABLE = True
except ImportError:
    SLACK_AVAILABLE = False
    logger.warning("slack-sdk not installed. Slack notifications disabled.")


class SlackNotificationService:
    """
    Service for sending racing alerts and notifications to Slack channels.
    
    Features:
    - Post messages to Slack channels
    - Rich message formatting with blocks
    - Interactive buttons and menus
    - Thread replies for context
    - User mentions (@channel, @here)
    - Priority-based routing
    """
    
    def __init__(self):
        """Initialize Slack service with API token"""
        self.token = os.getenv("SLACK_BOT_TOKEN")
        self.default_channel = os.getenv("SLACK_DEFAULT_CHANNEL", "#pit-wall")
        self.client = None
        
        if SLACK_AVAILABLE and self.token:
            try:
                self.client = WebClient(token=self.token)
                logger.info("Slack notification service initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Slack client: {e}")
                self.client = None
        else:
            if not SLACK_AVAILABLE:
                logger.warning("slack-sdk package not installed")
            if not self.token:
                logger.warning("SLACK_BOT_TOKEN not configured - Slack notifications disabled")
    
    async def send_alert(
        self,
        message: str,
        channel: Optional[str] = None,
        priority: str = "medium",
        blocks: Optional[List[Dict]] = None,
        thread_ts: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Send alert to Slack channel
        
        Args:
            message: Alert message text
            channel: Slack channel (defaults to SLACK_DEFAULT_CHANNEL)
            priority: Alert priority ("critical", "high", "medium", "low")
            blocks: Rich formatting blocks (optional)
            thread_ts: Thread timestamp to reply in thread (optional)
        
        Returns:
            Dict with status and timestamp, or None if failed
        """
        if not self.client:
            logger.debug("Slack not configured - skipping alert notification")
            return None
        
        channel = channel or self.default_channel
        
        # Priority-based formatting
        emoji_map = {
            "critical": "🚨",
            "high": "⚠️",
            "medium": "📊",
            "low": "ℹ️"
        }
        
        emoji = emoji_map.get(priority, "📊")
        formatted_message = f"{emoji} *PIT WALL ALERT* ({priority.upper()})\n{message}"
        
        try:
            response = self.client.chat_postMessage(
                channel=channel,
                text=formatted_message,
                blocks=blocks,
                thread_ts=thread_ts
            )
            
            logger.info(f"Slack alert sent to {channel}: {response['ts']}")
            return {"status": "sent", "ts": response["ts"], "channel": channel}
        except SlackApiError as e:
            logger.error(f"Slack API error: {e.response['error']}")
            return None
        except Exception as e:
            logger.error(f"Error sending Slack alert: {e}")
            return None
    
    async def send_tire_wear_alert(
        self,
        vehicle_id: str,
        tire_wear: float,
        track_name: str,
        recommended_action: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Send tire wear alert with rich formatting
        
        Args:
            vehicle_id: Vehicle identifier
            tire_wear: Tire wear percentage remaining
            track_name: Track name
            recommended_action: Recommended action (optional)
        
        Returns:
            Dict with status, or None if failed
        """
        priority = "critical" if tire_wear < 20 else "high" if tire_wear < 40 else "medium"
        
        if not recommended_action:
            if tire_wear < 20:
                recommended_action = "Immediate pit stop required"
            elif tire_wear < 40:
                recommended_action = "Consider pit stop in next 2-3 laps"
            else:
                recommended_action = "Monitor tire wear closely"
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Tire Wear Alert"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Vehicle:* {vehicle_id}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Track:* {track_name}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Tire Wear:* {tire_wear:.1f}% remaining"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Priority:* {priority.upper()}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Recommended Action:* {recommended_action}"
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Generated at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}"
                    }
                ]
            }
        ]
        
        return await self.send_alert(
            f"Critical tire wear detected: {vehicle_id} - {tire_wear:.1f}% remaining",
            priority=priority,
            blocks=blocks
        )
    
    async def send_strategy_recommendation(
        self,
        recommendation: str,
        confidence: float,
        track_name: str,
        context: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Send strategy recommendation to team channel
        
        Args:
            recommendation: Strategy recommendation text
            confidence: Confidence score (0.0-1.0)
            track_name: Track name
            context: Additional context dict (optional)
        
        Returns:
            Dict with status, or None if failed
        """
        confidence_pct = confidence * 100
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "📊 Strategy Recommendation"
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Recommendation:*\n{recommendation}\n\n*Confidence:* {confidence_pct:.0f}%"
                }
            }
        ]
        
        if context:
            context_fields = []
            for key, value in context.items():
                context_fields.append({
                    "type": "mrkdwn",
                    "text": f"*{key.replace('_', ' ').title()}:* {value}"
                })
            
            if context_fields:
                blocks.append({
                    "type": "section",
                    "fields": context_fields
                })
        
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Track: {track_name} | Generated by Pit Wall AI"
                }
            ]
        })
        
        return await self.send_alert(
            recommendation,
            priority="medium",
            blocks=blocks
        )
    
    async def send_coaching_alert(
        self,
        alert: Dict,
        driver_name: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Send coaching alert from coaching alert service
        
        Args:
            alert: Coaching alert dictionary
            driver_name: Driver name (optional)
        
        Returns:
            Dict with status, or None if failed
        """
        priority = alert.get("priority", "medium")
        category = alert.get("category", "general").replace("_", " ").title()
        message = alert.get("message", "")
        improvement_area = alert.get("improvement_area", "")
        confidence = alert.get("confidence", 0.0)
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🎯 Coaching Alert"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Category:* {category}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Priority:* {priority.upper()}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Message:*\n{message}"
                }
            }
        ]
        
        if driver_name:
            blocks[1]["fields"].insert(0, {
                "type": "mrkdwn",
                "text": f"*Driver:* {driver_name}"
            })
        
        if improvement_area:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Improvement Area:* {improvement_area}"
                }
            })
        
        if confidence > 0:
            blocks.append({
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Confidence: {confidence*100:.0f}%"
                    }
                ]
            })
        
        return await self.send_alert(
            message,
            priority=priority,
            blocks=blocks
        )
    
    async def send_anomaly_alert(
        self,
        anomaly: Dict,
        vehicle_id: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Send anomaly detection alert
        
        Args:
            anomaly: Anomaly dictionary from anomaly engine
            vehicle_id: Vehicle identifier (optional)
        
        Returns:
            Dict with status, or None if failed
        """
        anomaly_type = anomaly.get("type", "unknown")
        severity = anomaly.get("severity", "medium")
        description = anomaly.get("description", "")
        timestamp = anomaly.get("timestamp", datetime.utcnow().isoformat())
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "⚠️ Anomaly Detected"
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Type:* {anomaly_type}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Severity:* {severity.upper()}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Description:*\n{description}"
                }
            }
        ]
        
        if vehicle_id:
            blocks[1]["fields"].insert(0, {
                "type": "mrkdwn",
                "text": f"*Vehicle:* {vehicle_id}"
            })
        
        blocks.append({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Detected at: {timestamp}"
                }
            ]
        })
        
        return await self.send_alert(
            f"Anomaly detected: {anomaly_type} - {description}",
            priority=severity,
            blocks=blocks
        )
    
    async def send_race_update(
        self,
        update_type: str,
        message: str,
        race_data: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Send general race update
        
        Args:
            update_type: Type of update ("start", "lap", "finish", "incident", etc.)
            message: Update message
            race_data: Additional race data (optional)
        
        Returns:
            Dict with status, or None if failed
        """
        type_emojis = {
            "start": "🏁",
            "lap": "⏱️",
            "finish": "🏆",
            "incident": "🚨",
            "weather": "🌦️",
            "pit": "🔧"
        }
        
        emoji = type_emojis.get(update_type, "📢")
        
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"{emoji} *{update_type.replace('_', ' ').title()}*\n{message}"
                }
            }
        ]
        
        if race_data:
            data_fields = []
            for key, value in race_data.items():
                if value is not None:
                    data_fields.append({
                        "type": "mrkdwn",
                        "text": f"*{key.replace('_', ' ').title()}:* {value}"
                    })
            
            if data_fields:
                blocks.append({
                    "type": "section",
                    "fields": data_fields
                })
        
        return await self.send_alert(
            message,
            priority="low",
            blocks=blocks
        )


# Global instance
slack_notification_service = SlackNotificationService()


