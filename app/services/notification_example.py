"""
Notification Services Usage Examples
Example code showing how to integrate notification services with existing systems
"""

import asyncio
from typing import Dict, List

# Import notification services
from app.services.notification_integration import (
    notify_tire_wear,
    notify_coaching_alerts,
    notify_anomaly,
    notify_strategy_recommendation
)

# Import existing services
from app.services.coaching_alert_service import coaching_alert_service
from app.services.anomaly_engine import get_anomaly_engine
from app.services.notification_orchestrator import notification_orchestrator


async def example_tire_wear_notification():
    """Example: Send tire wear alert when threshold is reached"""
    
    # Simulate tire wear prediction
    vehicle_id = "GR86-01"
    tire_wear = 18.5  # 18.5% remaining - critical!
    track_name = "Circuit of the Americas"
    
    # Send notification (automatically routes to SMS + Slack + Email for critical)
    result = await notify_tire_wear(
        vehicle_id=vehicle_id,
        tire_wear=tire_wear,
        track_name=track_name
    )
    
    print(f"Tire wear notification sent: {result}")
    # Result: {"sms": {...}, "slack": {...}, "email": {...}}


async def example_coaching_alerts_integration():
    """Example: Integrate coaching alerts with notification system"""
    
    # Generate coaching alerts (existing service)
    driver_fingerprint = {
        "braking_style": 0.75,
        "cornering_aggressiveness": 0.60,
        "throttle_control": 0.80
    }
    
    comparison_data = {
        "braking_style": 0.50,  # Driver is braking too late
        "cornering_aggressiveness": 0.55,
        "throttle_control": 0.75
    }
    
    alerts = coaching_alert_service.generate_coaching_alerts(
        fingerprint=driver_fingerprint,
        comparison=comparison_data
    )
    
    # Send notifications for high-priority alerts
    high_priority_alerts = [a for a in alerts if a.get("priority") in ["high", "critical"]]
    
    if high_priority_alerts:
        result = await notify_coaching_alerts(
            alerts=high_priority_alerts,
            driver_name="Driver 1"
        )
        print(f"Coaching alerts sent: {result}")


async def example_anomaly_detection_integration():
    """Example: Integrate anomaly detection with notification system"""
    
    # Get anomaly engine
    anomaly_engine = get_anomaly_engine()
    
    # Simulate telemetry data
    telemetry_data = {
        "throttle": 0.95,  # Unusually high
        "brake": 0.0,
        "speed": 150,
        "lap_time": 95.5
    }
    
    # Detect anomaly
    anomaly = anomaly_engine.detect_anomaly(telemetry_data)
    
    if anomaly:
        # Send notification
        result = await notify_anomaly(anomaly)
        print(f"Anomaly alert sent: {result}")


async def example_strategy_recommendation():
    """Example: Send strategy recommendation"""
    
    recommendation = "Optimal pit window: Laps 15-17. Current tire wear: 45%. Expected track position improvement: +2 positions."
    confidence = 0.87
    track_name = "Sebring International Raceway"
    
    context = {
        "current_lap": 12,
        "tire_wear": 45.0,
        "position": 5,
        "expected_improvement": "+2 positions"
    }
    
    result = await notify_strategy_recommendation(
        recommendation=recommendation,
        confidence=confidence,
        track_name=track_name,
        context=context
    )
    
    print(f"Strategy recommendation sent: {result}")


async def example_custom_alert():
    """Example: Send custom alert with specific channels"""
    
    alert = {
        "type": "weather",
        "priority": "high",
        "message": "Rain expected in 5 minutes. Consider pit stop for wet tires.",
        "timestamp": "2024-01-01T12:00:00Z",
        "track_name": "COTA"
    }
    
    # Override default recipients
    recipients = {
        "slack": ["#pit-wall", "#race-strategy"],
        "email": ["team@example.com", "driver@example.com"]
    }
    
    result = await notification_orchestrator.send_notification(
        alert=alert,
        channels=["slack", "email"],  # No SMS for weather alerts
        recipients=recipients
    )
    
    print(f"Custom alert sent: {result}")


async def example_race_report_email():
    """Example: Send post-race report PDF via email"""
    
    result = await notification_orchestrator.send_race_report(
        to_email="team@example.com",
        pdf_path="/path/to/race_report.pdf",
        race_name="GR Cup - Circuit of the Americas",
        track_name="Circuit of the Americas",
        additional_context={
            "winner": "Driver 1",
            "fastest_lap": "1:45.234",
            "total_laps": 28,
            "race_date": "2024-01-15"
        }
    )
    
    print(f"Race report email sent: {result}")


async def example_batch_notifications():
    """Example: Send multiple notifications efficiently"""
    
    # Collect multiple alerts
    alerts_to_send = []
    
    # Tire wear alert
    alerts_to_send.append({
        "type": "tire_wear",
        "priority": "critical",
        "message": "Tire wear critical: 15% remaining",
        "vehicle_id": "GR86-01",
        "tire_wear": 15.0,
        "track_name": "COTA"
    })
    
    # Strategy recommendation
    alerts_to_send.append({
        "type": "strategy",
        "priority": "medium",
        "message": "Pit window opening: Laps 18-20",
        "track_name": "COTA"
    })
    
    # Send all notifications
    results = []
    for alert in alerts_to_send:
        if alert["type"] == "tire_wear":
            result = await notify_tire_wear(
                vehicle_id=alert["vehicle_id"],
                tire_wear=alert["tire_wear"],
                track_name=alert["track_name"]
            )
        elif alert["type"] == "strategy":
            result = await notify_strategy_recommendation(
                recommendation=alert["message"],
                confidence=0.8,
                track_name=alert["track_name"]
            )
        results.append(result)
    
    print(f"Batch notifications sent: {len(results)} alerts")


# Main example runner
async def main():
    """Run all examples"""
    print("=== Notification Services Examples ===\n")
    
    print("1. Tire Wear Notification")
    await example_tire_wear_notification()
    print()
    
    print("2. Coaching Alerts Integration")
    await example_coaching_alerts_integration()
    print()
    
    print("3. Anomaly Detection Integration")
    await example_anomaly_detection_integration()
    print()
    
    print("4. Strategy Recommendation")
    await example_strategy_recommendation()
    print()
    
    print("5. Custom Alert")
    await example_custom_alert()
    print()
    
    print("6. Race Report Email")
    # await example_race_report_email()  # Uncomment when PDF path is available
    print()
    
    print("7. Batch Notifications")
    await example_batch_notifications()
    print()


if __name__ == "__main__":
    asyncio.run(main())


