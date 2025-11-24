# Slack Webhook Integration Guide

This guide explains how to set up and use Slack webhook notifications in PitWall AI.

## Configuration

### Environment Variables

Add the following to your `.env.local` file (for development) or set in your deployment platform:

```env
# Slack Webhook Configuration
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/triggers/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

# Optional: Force mock mode (for testing)
# VITE_SLACK_MOCK_MODE=true

# Optional: Disable mock mode in dev (default: enabled if webhook URL missing)
# VITE_SLACK_ENABLE_MOCK=false
```

### Slack Workflow Variables

Your Slack Workflow webhook accepts the following variable keys and data types:

| Key | Data Type | Required | Description |
|-----|-----------|----------|-------------|
| `text` | `string` | Optional* | Main message text |
| `username` | `string` | Optional | Bot username (defaults to "PitWall AI") |
| `icon_emoji` | `string` | Optional | Emoji icon (defaults to ":race_car:") |
| `blocks` | `array` | Optional | Array of block objects for rich formatting |
| `attachments` | `array` | Optional | Array of attachment objects |
| `variables` | `object` | Optional | Custom variables for workflow |

**Note:** If no webhook URL is configured or in development mode, the system will automatically use mock mode, storing messages in localStorage for testing.

## Usage Examples

### Basic Usage with Hook

```typescript
import { useSlack } from '@/hooks/useSlack';

function MyComponent() {
  const slack = useSlack();

  const handleRaceStart = async () => {
    const result = await slack.sendText('Race started at Sebring!');
    if (result.success) {
      console.log('Notification sent!');
    }
  };

  return <button onClick={handleRaceStart}>Send Notification</button>;
}
```

### Direct API Usage

```typescript
import { 
  sendSlackText, 
  sendSlackNotification,
  sendRaceAlert,
  sendTelemetryAlert 
} from '@/api/slack';

// Simple text message
await sendSlackText('Lap 15 completed');

// Formatted notification
await sendSlackNotification(
  'Race Alert',
  'Vehicle #42 completed lap 15 in 1:45.32',
  'good',
  [
    { title: 'Lap Time', value: '1:45.32', short: true },
    { title: 'Position', value: '3rd', short: true },
  ]
);

// Race alert with details
await sendRaceAlert(
  'Sebring Race 1',
  'Pit Stop Window Open',
  {
    'Best Lap': '1:44.89',
    'Leader': 'Vehicle #1',
    'Gap': '+2.34s',
  }
);

// Telemetry alert
await sendTelemetryAlert(
  'GR86-002',
  'Tire Wear',
  '85%',
  'warning'
);
```

### Specialized Notification Types

```typescript
import { 
  sendLapTimeNotification,
  sendPitStopNotification,
  sendTireWearAlert 
} from '@/api/slack';

// Lap time notification
await sendLapTimeNotification(
  'GR86-007',
  15,
  '1:45.32',
  3,
  '+2.34s'
);

// Pit stop notification
await sendPitStopNotification(
  'GR86-007',
  18,
  'Tire change and fuel',
  '25 seconds'
);

// Tire wear alert
await sendTireWearAlert(
  'GR86-007',
  82.5,  // front left
  81.2,  // front right
  78.9,  // rear left
  79.3,  // rear right
  20     // recommended pit lap
);
```

### Mock Mode (Development/Testing)

The Slack integration automatically falls back to mock mode when:
- No webhook URL is configured
- `VITE_SLACK_MOCK_MODE=true` is set
- Running in development mode without a webhook URL

In mock mode:
- Messages are logged to console
- Messages are stored in localStorage
- No actual Slack messages are sent

```typescript
import { getMockMessages, clearMockMessages, isSlackMockMode } from '@/api/slack';

// Check if in mock mode
if (isSlackMockMode()) {
  console.log('Slack is in mock mode');
}

// Get stored mock messages
const mockMessages = getMockMessages(50); // Get last 50 messages
console.log(mockMessages);

// Clear mock messages
clearMockMessages();
```

## Integration Examples

### Race Event Integration

```typescript
import { useSlack } from '@/hooks/useSlack';
import { useEffect } from 'react';

function RaceMonitor({ raceData }) {
  const slack = useSlack();

  useEffect(() => {
    if (raceData.lapCompleted) {
      slack.sendLapTimeNotification(
        raceData.vehicle,
        raceData.currentLap,
        raceData.lapTime,
        raceData.position,
        raceData.gapToLeader
      );
    }
  }, [raceData.lapCompleted]);

  return <div>Race Monitor</div>;
}
```

### Telemetry Alert Integration

```typescript
import { useSlack } from '@/hooks/useSlack';

function TelemetryMonitor({ telemetry }) {
  const slack = useSlack();

  const checkTireWear = () => {
    const avgWear = (
      telemetry.frontLeft +
      telemetry.frontRight +
      telemetry.rearLeft +
      telemetry.rearRight
    ) / 4;

    if (avgWear > 80) {
      slack.sendTireWearAlert(
        telemetry.vehicle,
        telemetry.frontLeft,
        telemetry.frontRight,
        telemetry.rearLeft,
        telemetry.rearRight,
        telemetry.recommendedPitLap
      );
    }
  };

  return <button onClick={checkTireWear}>Check Tire Wear</button>;
}
```

## Message Types and Formatting

### Text Messages
Simple text-only messages for quick notifications.

### Rich Notifications
Formatted messages with:
- Color-coded status (good/warning/danger)
- Title and description
- Optional fields with key-value pairs
- Footer with timestamp

### Block-based Messages
Rich formatting using Slack Block Kit:
- Headers
- Sections with markdown
- Fields for structured data
- Dividers

### Attachments (Legacy)
Backwards-compatible attachment format with colors and fields.

## Troubleshooting

### Messages Not Sending

1. **Check webhook URL**: Verify `VITE_SLACK_WEBHOOK_URL` is set correctly
2. **Check network**: Ensure the URL is accessible
3. **Check mock mode**: If in mock mode, messages won't actually send
4. **Check console**: Look for error messages in browser console

### Mock Mode Active When It Shouldn't Be

1. Set `VITE_SLACK_ENABLE_MOCK=false` to disable mock mode
2. Ensure `VITE_SLACK_WEBHOOK_URL` is set
3. Check that you're not in development mode (mock is default in dev)

### Messages Stored in Mock Storage

Use `getMockMessages()` to view stored messages during development. This helps debug message formatting before enabling real webhooks.

## Slack Workflow Setup

If you're using a Slack Workflow webhook, ensure your workflow is configured to accept:

- **Variables**: The workflow can accept custom variables in the payload
- **Text**: Plain text messages
- **JSON**: Structured data in blocks or attachments format

The webhook URL format for workflows is:
```
https://hooks.slack.com/triggers/{WORKFLOW_ID}/{TRIGGER_ID}/{SECRET}
```

## Best Practices

1. **Use appropriate notification types**: Use specialized functions for race events, telemetry, etc.
2. **Include relevant context**: Always include vehicle, lap, and relevant metrics
3. **Set appropriate urgency**: Use color codes to indicate severity (info/warning/critical)
4. **Test in mock mode first**: Verify message formatting before enabling real webhooks
5. **Handle errors gracefully**: Check the response object for success/error status

## API Reference

See `/src/api/slack.ts` for the complete API documentation with all available functions and types.


