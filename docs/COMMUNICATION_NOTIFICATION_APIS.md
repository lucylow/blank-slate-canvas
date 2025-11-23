# Communication & Notification APIs

This document describes the communication and notification APIs integrated into the Pit Wall AI system.

## Overview

The notification system provides multi-channel alert delivery for:
- **SMS/Voice** (Twilio) - Critical alerts for pit wall and driver radio
- **Email** (SendGrid) - Race reports and post-race summaries
- **Slack** - Real-time team notifications and race updates

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│         Notification Orchestrator                       │
│  (Routes alerts based on priority and type)              │
└──────────────┬──────────────────────────────────────────┘
               │
       ┌───────┼───────┐
       │       │       │
       ▼       ▼       ▼
   ┌──────┐ ┌──────┐ ┌──────┐
   │Twilio│ │Email │ │Slack│
   │(SMS) │ │(PDF) │ │(Team)│
   └──────┘ └──────┘ └──────┘
```

### Services

1. **Slack Service** (`app/services/slack_service.py`)
   - Real-time team notifications
   - Rich message formatting with blocks
   - Priority-based routing

2. **Email Service** (`app/services/email_service.py`)
   - SendGrid integration
   - PDF report attachments
   - HTML email templates

3. **Notification Orchestrator** (`app/services/notification_orchestrator.py`)
   - Unified routing logic
   - Priority-based channel selection
   - Multi-channel delivery

4. **Notification Integration** (`app/services/notification_integration.py`)
   - Easy integration hooks
   - Default recipient configuration
   - Convenience functions

## Installation

### Dependencies

Install required packages:

```bash
pip install slack-sdk>=3.23.0 sendgrid>=6.10.0
```

Or install from requirements.txt:

```bash
pip install -r requirements.txt
```

### Twilio (Optional)

If using Twilio for SMS/Voice (already integrated in `app/services/twilio_service.py`):

```bash
pip install twilio>=8.0.0
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

#### Slack Configuration

```bash
# Slack Bot Token (required for Slack notifications)
SLACK_BOT_TOKEN=xoxb-your-bot-token-here

# Default Slack channel (optional, defaults to #pit-wall)
SLACK_DEFAULT_CHANNEL=#pit-wall
```

#### SendGrid Configuration

```bash
# SendGrid API Key (required for email notifications)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# From email address (required)
SENDGRID_FROM_EMAIL=pitwall@yourdomain.com

# From name (optional, defaults to "Pit Wall AI")
SENDGRID_FROM_NAME=Pit Wall AI
```

#### Twilio Configuration (Optional)

```bash
# Twilio Account SID
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Auth Token
TWILIO_AUTH_TOKEN=your_auth_token

# Twilio Phone Number
TWILIO_PHONE_NUMBER=+1234567890
```

#### Notification Recipients

```bash
# Enable/disable notifications (default: true)
NOTIFICATIONS_ENABLED=true

# SMS recipients (comma-separated phone numbers)
NOTIFICATION_SMS_RECIPIENTS=+1234567890,+0987654321

# Email recipients (comma-separated email addresses)
NOTIFICATION_EMAIL_RECIPIENTS=team@example.com,driver@example.com

# Slack channels (comma-separated channel names)
NOTIFICATION_SLACK_CHANNELS=#pit-wall,#race-updates
```

## Setup Instructions

### Slack Setup

1. **Create a Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App"
   - Choose "From scratch"
   - Name your app (e.g., "Pit Wall AI")
   - Select your workspace

2. **Configure Bot Token Scopes**
   - Go to "OAuth & Permissions" in the sidebar
   - Scroll to "Scopes"
   - Add the following Bot Token Scopes:
     - `chat:write` - Send messages
     - `chat:write.public` - Send messages to channels the app isn't in

3. **Install App to Workspace**
   - Click "Install to Workspace"
   - Authorize the app
   - Copy the "Bot User OAuth Token" (starts with `xoxb-`)
   - Set as `SLACK_BOT_TOKEN` environment variable

4. **Invite Bot to Channels**
   - Go to your Slack channels
   - Type `/invite @Pit Wall AI` (or your app name)
   - The bot can now post to those channels

### SendGrid Setup

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up for a free account (100 emails/day for 60 days)

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name it (e.g., "Pit Wall AI")
   - Select "Full Access" or "Restricted Access" with Mail Send permissions
   - Copy the API key (starts with `SG.`)
   - Set as `SENDGRID_API_KEY` environment variable

3. **Verify Sender Identity**
   - Go to Settings → Sender Authentication
   - Verify a Single Sender or Domain
   - Use verified email as `SENDGRID_FROM_EMAIL`

### Twilio Setup (Optional)

1. **Create Twilio Account**
   - Go to https://www.twilio.com
   - Sign up (free trial with $15.50 credit)

2. **Get Phone Number**
   - Go to Phone Numbers → Manage → Buy a number
   - Select a number with SMS/Voice capabilities
   - Copy the phone number
   - Set as `TWILIO_PHONE_NUMBER` environment variable

3. **Get Credentials**
   - Go to Account → API Keys & Tokens
   - Copy Account SID and Auth Token
   - Set as `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`

## Usage

### Basic Usage

```python
from app.services.notification_integration import (
    notify_tire_wear,
    notify_coaching_alerts,
    notify_anomaly,
    notify_strategy_recommendation
)

# Send tire wear alert
await notify_tire_wear(
    vehicle_id="GR86-01",
    tire_wear=25.5,  # 25.5% remaining
    track_name="COTA"
)

# Send coaching alerts
alerts = [
    {
        "id": "alert_1",
        "priority": "high",
        "message": "Braking too late in Turn 3",
        "category": "braking",
        "improvement_area": "Brake timing"
    }
]
await notify_coaching_alerts(
    alerts=alerts,
    driver_name="Driver 1"
)

# Send anomaly alert
anomaly = {
    "type": "telemetry_anomaly",
    "severity": "high",
    "description": "Unusual throttle pattern detected",
    "vehicle_id": "GR86-01"
}
await notify_anomaly(anomaly)

# Send strategy recommendation
await notify_strategy_recommendation(
    recommendation="Pit window: Laps 15-17 for optimal tire strategy",
    confidence=0.85,
    track_name="COTA",
    context={"current_lap": 12, "tire_wear": 45}
)
```

### Advanced Usage

```python
from app.services.notification_orchestrator import notification_orchestrator

# Custom alert with specific channels
alert = {
    "type": "custom",
    "priority": "critical",
    "message": "Critical system alert",
    "timestamp": "2024-01-01T12:00:00Z"
}

# Override default recipients
recipients = {
    "sms": ["+1234567890"],
    "email": ["team@example.com"],
    "slack": ["#pit-wall-critical"]
}

result = await notification_orchestrator.send_notification(
    alert=alert,
    channels=["sms", "slack", "email"],
    recipients=recipients
)

# Send race report PDF
await notification_orchestrator.send_race_report(
    to_email="team@example.com",
    pdf_path="/path/to/report.pdf",
    race_name="GR Cup - COTA",
    track_name="Circuit of the Americas"
)
```

### Integration with Existing Services

#### Coaching Alert Service

```python
from app.services.coaching_alert_service import coaching_alert_service
from app.services.notification_integration import notify_coaching_alerts

# Generate alerts
alerts = coaching_alert_service.generate_coaching_alerts(
    fingerprint=driver_fingerprint,
    comparison=comparison_data
)

# Send notifications
await notify_coaching_alerts(
    alerts=alerts,
    driver_name="Driver 1"
)
```

#### Anomaly Engine

```python
from app.services.anomaly_engine import get_anomaly_engine
from app.services.notification_integration import notify_anomaly

anomaly_engine = get_anomaly_engine()
anomaly = anomaly_engine.detect_anomaly(telemetry_data)

if anomaly:
    await notify_anomaly(anomaly)
```

#### Tire Wear Predictor

```python
from app.services.notification_integration import notify_tire_wear

# After predicting tire wear
if predicted_wear < 30:  # Critical threshold
    await notify_tire_wear(
        vehicle_id=vehicle_id,
        tire_wear=predicted_wear,
        track_name=track_name
    )
```

## Channel Routing Logic

The notification orchestrator automatically routes alerts based on priority:

| Priority | Channels | Use Case |
|----------|----------|----------|
| Critical | SMS + Slack + Email | Immediate action required (tire wear < 20%, safety issues) |
| High | Slack + Email | Important alerts (tire wear < 40%, strategy changes) |
| Medium | Slack | Standard notifications (coaching tips, strategy recommendations) |
| Low | Slack (optional) | Informational updates (race progress, lap times) |

## Alert Types

### Tire Wear Alerts
- **Trigger**: Tire wear below thresholds (20% critical, 40% high)
- **Channels**: SMS (critical), Slack, Email
- **Format**: Rich Slack blocks with vehicle info, recommended action

### Coaching Alerts
- **Trigger**: Driver performance deviations
- **Channels**: Slack, Email (high priority)
- **Format**: Formatted coaching messages with improvement areas

### Anomaly Alerts
- **Trigger**: Anomaly detection in telemetry
- **Channels**: Based on severity (critical → SMS + Slack + Email)
- **Format**: Anomaly type, description, vehicle info

### Strategy Recommendations
- **Trigger**: Strategy optimizer recommendations
- **Channels**: Slack
- **Format**: Recommendation text with confidence score and context

### Race Reports
- **Trigger**: Post-race analysis
- **Channels**: Email
- **Format**: PDF attachment with HTML email body

## Cost Estimation

For a racing team with 5 members, 10 races/year:

- **Twilio**:
  - Phone number: $1/month × 12 = $12/year
  - SMS (50 critical alerts/year): 50 × $0.0083 = $0.42
  - Voice calls (10 urgent calls/year): 10 × 2min × $0.014 = $0.28
  - **Total: ~$13/year**

- **SendGrid**:
  - Free tier: 100 emails/day (sufficient for reports)
  - Or Essentials: $19.95/month × 12 = $239.40/year

- **Slack**:
  - Free tier sufficient for small teams
  - Or Pro: $6.67/user × 5 × 12 = $400/year

**Total estimated cost: $13–652/year** depending on scale

## Testing

### Test Slack Notifications

```python
from app.services.slack_service import slack_notification_service

# Test basic alert
result = await slack_notification_service.send_alert(
    message="Test alert from Pit Wall AI",
    priority="medium"
)
print(result)
```

### Test Email Notifications

```python
from app.services.email_service import email_notification_service

# Test alert email
result = await email_notification_service.send_alert_email(
    to_email="test@example.com",
    alert={
        "priority": "medium",
        "message": "Test alert",
        "type": "test"
    }
)
print(result)
```

### Test SMS Notifications

```python
from app.services.twilio_service import TwilioService

twilio = TwilioService()
result = await twilio.send_alert_sms(
    to_number="+1234567890",
    alert_type="test",
    alert_message="Test SMS alert",
    severity="medium"
)
print(result)
```

## Troubleshooting

### Slack Notifications Not Working

1. **Check Bot Token**
   - Verify `SLACK_BOT_TOKEN` is set correctly
   - Token should start with `xoxb-`

2. **Check Bot Permissions**
   - Ensure bot has `chat:write` and `chat:write.public` scopes
   - Reinstall app if permissions changed

3. **Check Channel Access**
   - Bot must be invited to channels
   - Use `#channel-name` format (with #)

4. **Check Logs**
   - Look for "Slack API error" in logs
   - Common errors: `not_in_channel`, `invalid_auth`

### Email Notifications Not Working

1. **Check API Key**
   - Verify `SENDGRID_API_KEY` is set correctly
   - Key should start with `SG.`

2. **Check Sender Verification**
   - Verify sender email/domain in SendGrid
   - Unverified senders will fail

3. **Check Rate Limits**
   - Free tier: 100 emails/day
   - Check SendGrid dashboard for usage

4. **Check Logs**
   - Look for "SendGrid error" in logs
   - Common errors: `403 Forbidden` (invalid key), `400 Bad Request` (invalid email)

### SMS Notifications Not Working

1. **Check Twilio Credentials**
   - Verify Account SID, Auth Token, and Phone Number
   - Test credentials in Twilio console

2. **Check Phone Number Format**
   - Use E.164 format: `+1234567890`
   - Include country code

3. **Check Trial Limits**
   - Free trial has restrictions
   - Verify recipient numbers in Twilio console

## API Reference

See individual service files for detailed API documentation:

- `app/services/slack_service.py` - Slack notification service
- `app/services/email_service.py` - Email notification service
- `app/services/notification_orchestrator.py` - Unified orchestrator
- `app/services/notification_integration.py` - Integration hooks

## Next Steps

1. **Configure Environment Variables**
   - Set up Slack, SendGrid, and Twilio credentials
   - Configure default recipients

2. **Test Notifications**
   - Send test alerts to verify setup
   - Check all channels are working

3. **Integrate with Existing Services**
   - Add notification calls to coaching alert service
   - Hook into anomaly engine
   - Connect tire wear predictor

4. **Customize Templates**
   - Modify email HTML templates
   - Customize Slack message blocks
   - Add team branding

5. **Set Up Monitoring**
   - Track notification delivery rates
   - Monitor API usage and costs
   - Set up alerts for notification failures

