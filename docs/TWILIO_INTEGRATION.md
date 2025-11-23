# Twilio API Integration

This document describes the Twilio API integration for sending SMS, WhatsApp messages, and voice calls for racing alerts and notifications.

## Overview

The Twilio integration provides:
- **SMS Messaging**: Send text alerts for strategy, coaching, and system notifications
- **WhatsApp Messaging**: Send WhatsApp messages for alerts (requires WhatsApp Business API)
- **Voice Calls**: Make voice calls for critical alerts (requires TwiML URL)
- **Alert Integration**: Seamless integration with the existing alert system

## Setup

### 1. Twilio Account Setup

1. Sign up for a Twilio account at https://www.twilio.com/
2. Get your Account SID and Auth Token from the Twilio Console
3. Purchase a phone number for SMS/Voice (or use trial number for testing)
4. (Optional) Set up WhatsApp Business API for WhatsApp messaging

### 2. Configure Secrets in Lovable Cloud

Set the following secrets in your Lovable Cloud environment:

- `Twilio_SID`: Your Twilio Account SID
- `Twilio_Secret`: Your Twilio Auth Token
- `Twilio_Phone_Number`: Your Twilio phone number (E.164 format, e.g., "+1234567890")
- `Twilio_WhatsApp_Number`: (Optional) Your Twilio WhatsApp number (format: "whatsapp:+14155238886")

### 3. Phone Number Format

All phone numbers must be in E.164 format:
- US: `+1234567890`
- UK: `+441234567890`
- International: `+[country code][number]`

## API Endpoints

### Send SMS

```http
POST /api/twilio/sms/send
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Hello from PitWall AI!",
  "from_number": "+1234567890",  // Optional
  "status_callback": "https://your-server.com/twilio/status",  // Optional
  "status_callback_method": "POST"  // Optional
}
```

### Send WhatsApp Message

```http
POST /api/twilio/whatsapp/send
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Hello from PitWall AI!",
  "from_number": "whatsapp:+14155238886",  // Optional
  "status_callback": "https://your-server.com/twilio/status"  // Optional
}
```

### Send Alert SMS

```http
POST /api/twilio/alerts/sms
Content-Type: application/json

{
  "to": "+1234567890",
  "alert_type": "tire_wear",
  "alert_message": "Critical tire wear: 15% remaining. Pit window: Laps 15-17",
  "severity": "high"  // "low", "medium", or "high"
}
```

### Make Voice Call

```http
POST /api/twilio/voice/call
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "This is a test call",
  "url": "https://your-server.com/twiml/voice",  // Required: TwiML URL
  "from_number": "+1234567890",  // Optional
  "status_callback": "https://your-server.com/twilio/status",  // Optional
  "record": false  // Optional
}
```

**Note**: Voice calls require a TwiML URL. You can:
1. Host a TwiML endpoint on your server
2. Use Twilio TwiML Bins
3. Use Twilio Functions

### Get Message Status

```http
GET /api/twilio/messages/{message_sid}/status
```

### Health Check

```http
GET /api/twilio/health
```

## Integration with Alert System

### Using TwilioAlertIntegration Service

The `TwilioAlertIntegration` service provides high-level methods for sending alerts:

```python
from app.services.twilio_alert_integration import twilio_alert_integration

# Send strategy alert
await twilio_alert_integration.send_strategy_alert(
    phone_number="+1234567890",
    alert_type="tire_wear",
    alert_message="Critical tire wear: 15% remaining",
    severity="high",
    use_whatsapp=False
)

# Send coaching alert
await twilio_alert_integration.send_coaching_alert(
    phone_number="+1234567890",
    alert={
        "type": "braking_technique",
        "message": "Consider releasing brakes 0.1s later",
        "priority": "medium",
        "category": "braking"
    },
    use_whatsapp=False
)

# Send critical alert
await twilio_alert_integration.send_critical_alert(
    phone_number="+1234567890",
    alert_message="System anomaly detected",
    use_voice=False,
    use_whatsapp=False
)
```

### Example: Integrating with Strategy Alerts

```python
from app.services.twilio_alert_integration import twilio_alert_integration

# In your strategy service
async def handle_tire_wear_alert(tire_wear: float, phone_number: str):
    if tire_wear < 20:  # Critical threshold
        await twilio_alert_integration.send_strategy_alert(
            phone_number=phone_number,
            alert_type="tire_wear",
            alert_message=f"Critical tire wear: {tire_wear:.1f}% remaining. Pit window: Laps 15-17",
            severity="high"
        )
```

### Example: Integrating with Coaching Alerts

```python
from app.services.twilio_alert_integration import twilio_alert_integration
from app.services.coaching_alert_service import coaching_alert_service

# Generate coaching alerts
alerts = coaching_alert_service.generate_coaching_alerts(fingerprint, comparison)

# Send high-priority alerts via SMS
for alert in alerts:
    if alert.get("priority") == "high":
        await twilio_alert_integration.send_coaching_alert(
            phone_number="+1234567890",
            alert=alert
        )
```

## Alert Types

### Strategy Alerts

- `tire_wear`: Tire wear warnings and pit stop recommendations
- `pit_stop`: Pit stop timing and strategy
- `overtaking`: Overtaking opportunities
- `gap_analysis`: Gap to competitors
- `fuel`: Fuel strategy alerts
- `weather`: Weather-related alerts

### Coaching Alerts

- `braking_technique`: Braking performance feedback
- `throttle_control`: Throttle application feedback
- `cornering`: Cornering technique feedback
- `consistency`: Consistency and pace feedback
- `tires`: Tire management feedback

### Severity Levels

- `high`: Critical alerts requiring immediate attention (🔴)
- `medium`: Important alerts (🟡)
- `low`: Informational alerts (🟢)

## Status Callbacks

You can receive delivery status updates by providing a `status_callback` URL. Twilio will POST status updates to this URL with the following parameters:

- `MessageSid`: The message SID
- `MessageStatus`: Status (queued, sent, delivered, failed, etc.)
- `To`: Recipient number
- `From`: Sender number

Example callback handler:

```python
@router.post("/twilio/status")
async def twilio_status_callback(request: Request):
    data = await request.form()
    message_sid = data.get("MessageSid")
    status = data.get("MessageStatus")
    # Handle status update
    return {"status": "ok"}
```

## Error Handling

The Twilio service handles errors gracefully:

- If Twilio is not configured, methods return `None` without raising exceptions
- API errors are logged and re-raised as HTTP exceptions
- Invalid phone numbers are validated and formatted automatically

## Testing

### Using Twilio Trial Account

Twilio trial accounts have limitations:
- Can only send SMS to verified numbers
- Cannot make outbound calls
- Limited message volume

To test:
1. Verify your phone number in Twilio Console
2. Use verified numbers for testing
3. Upgrade to paid account for production use

### Testing Endpoints

```bash
# Test SMS
curl -X POST http://localhost:8000/api/twilio/sms/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "message": "Test message"
  }'

# Test alert SMS
curl -X POST http://localhost:8000/api/twilio/alerts/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1234567890",
    "alert_type": "tire_wear",
    "alert_message": "Test alert",
    "severity": "high"
  }'

# Check health
curl http://localhost:8000/api/twilio/health
```

## Best Practices

1. **Rate Limiting**: Implement rate limiting to avoid sending too many messages
2. **Error Handling**: Always check if Twilio is available before sending
3. **Phone Number Validation**: Validate phone numbers before sending
4. **Message Length**: Keep SMS messages under 160 characters for single SMS
5. **Status Callbacks**: Use status callbacks to track delivery
6. **Cost Management**: Monitor Twilio usage to control costs
7. **Security**: Never expose Twilio credentials in client-side code

## Troubleshooting

### Service Not Available

If `/api/twilio/health` returns `available: false`:
- Check that all required secrets are set in Lovable Cloud
- Verify secret names match exactly (case-sensitive)
- Check application logs for initialization errors

### Message Not Delivered

- Verify phone number is in E.164 format
- Check Twilio Console for error messages
- Verify phone number is not blocked
- Check account balance (if using paid account)

### Voice Calls Not Working

- Voice calls require a TwiML URL
- Set up a TwiML endpoint or use Twilio Functions
- Verify TwiML URL is accessible from Twilio's servers

## Additional Resources

- [Twilio API Documentation](https://www.twilio.com/docs)
- [Twilio Python SDK](https://www.twilio.com/docs/libraries/python)
- [TwiML Reference](https://www.twilio.com/docs/voice/twiml)
- [WhatsApp Business API](https://www.twilio.com/docs/whatsapp)

