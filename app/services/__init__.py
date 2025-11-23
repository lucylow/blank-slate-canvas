"""
Services package initialization
Exports notification services for easy import
"""

# Notification services
from app.services.slack_service import slack_notification_service
from app.services.email_service import email_notification_service
from app.services.notification_orchestrator import notification_orchestrator
from app.services.notification_integration import (
    notification_integration,
    notify_tire_wear,
    notify_coaching_alerts,
    notify_anomaly,
    notify_strategy_recommendation
)

__all__ = [
    "slack_notification_service",
    "email_notification_service",
    "notification_orchestrator",
    "notification_integration",
    "notify_tire_wear",
    "notify_coaching_alerts",
    "notify_anomaly",
    "notify_strategy_recommendation",
]

