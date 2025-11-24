// src/api/slack.ts
// Slack Webhook integration for notifications with mock data fallback

import axios, { AxiosError } from "axios";

// Get Slack webhook URL from environment variables
const SLACK_WEBHOOK_URL = 
  import.meta.env.VITE_SLACK_WEBHOOK_URL || 
  import.meta.env.SLACK_WEBHOOK_URL || 
  'https://hooks.slack.com/triggers/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';

// Check if we're in demo/mock mode
const isMockMode = () => {
  return (
    !SLACK_WEBHOOK_URL ||
    import.meta.env.VITE_SLACK_MOCK_MODE === 'true' ||
    import.meta.env.DEV && import.meta.env.VITE_SLACK_ENABLE_MOCK !== 'false'
  );
};

// Mock messages storage (for demo/dev mode)
const MOCK_STORAGE_KEY = 'slack_mock_messages';
const MAX_MOCK_MESSAGES = 100;

export interface SlackMessage {
  text?: string;
  blocks?: SlackBlock[];
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
  icon_url?: string;
  channel?: string;
  thread_ts?: string;
  // For Slack Workflow webhooks, you can pass custom variables
  variables?: Record<string, string | number | boolean>;
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  accessory?: any;
  [key: string]: any;
}

export interface SlackAttachment {
  color?: string;
  title?: string;
  text?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  ts?: number;
}

export interface SlackWebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  timestamp?: number;
  mock?: boolean;
  messageId?: string;
}

export interface MockSlackMessage {
  id: string;
  timestamp: number;
  payload: SlackMessage;
  response: SlackWebhookResponse;
}

/**
 * Store mock message in localStorage
 */
function storeMockMessage(payload: SlackMessage, response: SlackWebhookResponse): string {
  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    const messages: MockSlackMessage[] = stored ? JSON.parse(stored) : [];
    
    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mockMessage: MockSlackMessage = {
      id: messageId,
      timestamp: Date.now(),
      payload,
      response: {
        ...response,
        mock: true,
        messageId,
      },
    };
    
    messages.unshift(mockMessage); // Add to beginning
    if (messages.length > MAX_MOCK_MESSAGES) {
      messages.pop(); // Remove oldest
    }
    
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(messages));
    return messageId;
  } catch (error) {
    console.warn('[Slack] Failed to store mock message:', error);
    return `mock_${Date.now()}`;
  }
}

/**
 * Get stored mock messages
 */
export function getMockMessages(limit: number = 50): MockSlackMessage[] {
  try {
    const stored = localStorage.getItem(MOCK_STORAGE_KEY);
    if (!stored) return [];
    
    const messages: MockSlackMessage[] = JSON.parse(stored);
    return messages.slice(0, limit);
  } catch (error) {
    console.warn('[Slack] Failed to get mock messages:', error);
    return [];
  }
}

/**
 * Clear stored mock messages
 */
export function clearMockMessages(): void {
  try {
    localStorage.removeItem(MOCK_STORAGE_KEY);
  } catch (error) {
    console.warn('[Slack] Failed to clear mock messages:', error);
  }
}

/**
 * Simulate sending a message (mock mode)
 */
function simulateSlackMessage(payload: SlackMessage): SlackWebhookResponse {
  // Simulate network delay
  const delay = Math.random() * 300 + 100; // 100-400ms
  
  const messageText = payload.text || 
    payload.blocks?.[0]?.text?.text || 
    payload.attachments?.[0]?.text || 
    'No message content';
  
  console.log('[Slack Mock] Simulating message:', {
    text: messageText.substring(0, 100),
    timestamp: new Date().toISOString(),
  });
  
  const response: SlackWebhookResponse = {
    success: true,
    message: 'Message sent successfully (MOCK MODE)',
    timestamp: Date.now(),
    mock: true,
  };
  
  const messageId = storeMockMessage(payload, response);
  response.messageId = messageId;
  
  return response;
}

/**
 * Send a message to Slack via webhook
 */
export async function sendSlackMessage(
  message: string | SlackMessage
): Promise<SlackWebhookResponse> {
  // Normalize message format
  const payload: SlackMessage = typeof message === 'string' 
    ? { text: message }
    : message;

  // Add default username if not provided
  if (!payload.username) {
    payload.username = 'PitWall AI';
  }

  // Add default icon if not provided
  if (!payload.icon_emoji && !payload.icon_url) {
    payload.icon_emoji = ':race_car:';
  }

  // Use mock mode if webhook URL is not configured or in demo mode
  if (isMockMode()) {
    return simulateSlackMessage(payload);
  }

  try {
    // For Slack Workflow webhooks, the payload structure may vary
    // This format works for workflow triggers
    const workflowPayload = {
      ...payload,
      // Include variables if provided
      ...(payload.variables && { variables: payload.variables }),
    };

    const response = await axios.post(SLACK_WEBHOOK_URL, workflowPayload, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Slack webhook returns "ok" on success or 200 status
    if (response.status === 200) {
      return {
        success: true,
        message: 'Message sent successfully',
        timestamp: Date.now(),
        mock: false,
      };
    }

    return {
      success: false,
      error: `Unexpected response: ${response.status}`,
      timestamp: Date.now(),
      mock: false,
    };
  } catch (error) {
    const axiosError = error as AxiosError;
    const errorMessage = axiosError.response?.data 
      ? JSON.stringify(axiosError.response.data)
      : axiosError.message || 'Unknown error';

    console.error('[Slack] Failed to send message:', errorMessage);
    
    // Fallback to mock mode on error if in dev mode
    if (import.meta.env.DEV) {
      console.warn('[Slack] Falling back to mock mode due to error');
      return simulateSlackMessage(payload);
    }
    
    return {
      success: false,
      error: errorMessage,
      timestamp: Date.now(),
      mock: false,
    };
  }
}

/**
 * Send a formatted notification with blocks
 */
export async function sendSlackNotification(
  title: string,
  message: string,
  color: 'good' | 'warning' | 'danger' | string = 'good',
  fields?: Array<{ title: string; value: string; short?: boolean }>
): Promise<SlackWebhookResponse> {
  const attachment: SlackAttachment = {
    color,
    title,
    text: message,
    fields: fields || [],
    footer: 'PitWall AI',
    ts: Math.floor(Date.now() / 1000),
  };

  return sendSlackMessage({
    attachments: [attachment],
  });
}

/**
 * Send a simple text message
 */
export async function sendSlackText(message: string): Promise<SlackWebhookResponse> {
  return sendSlackMessage(message);
}

/**
 * Send a rich formatted message with multiple blocks
 */
export async function sendSlackBlocks(blocks: SlackBlock[]): Promise<SlackWebhookResponse> {
  return sendSlackMessage({
    blocks,
  });
}

/**
 * Send a race alert notification
 */
export async function sendRaceAlert(
  raceName: string,
  event: string,
  details?: Record<string, string>
): Promise<SlackWebhookResponse> {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🏁 ${raceName}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${event}*`,
      },
    },
  ];

  if (details && Object.keys(details).length > 0) {
    blocks.push({
      type: 'section',
      fields: Object.entries(details).map(([title, value]) => ({
        type: 'mrkdwn',
        text: `*${title}:*\n${value}`,
      })),
    });
  }

  return sendSlackBlocks(blocks);
}

/**
 * Send a telemetry alert
 */
export async function sendTelemetryAlert(
  vehicle: string,
  metric: string,
  value: string | number,
  status: 'info' | 'warning' | 'critical' = 'info'
): Promise<SlackWebhookResponse> {
  const colors: Record<string, string> = {
    info: '#36a64f',
    warning: '#ff9900',
    critical: '#ff0000',
  };

  const icons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  };

  return sendSlackNotification(
    `${icons[status]} Telemetry Alert: ${metric}`,
    `Vehicle: *${vehicle}*\n${metric}: *${value}*`,
    colors[status],
    [
      { title: 'Vehicle', value: vehicle, short: true },
      { title: 'Metric', value: metric, short: true },
      { title: 'Value', value: String(value), short: false },
    ]
  );
}

/**
 * Send a lap time notification
 */
export async function sendLapTimeNotification(
  vehicle: string,
  lap: number,
  lapTime: string,
  position: number,
  gap?: string
): Promise<SlackWebhookResponse> {
  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `⏱️ Lap ${lap} Completed`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Vehicle:*\n${vehicle}`,
        },
        {
          type: 'mrkdwn',
          text: `*Lap Time:*\n${lapTime}`,
        },
        {
          type: 'mrkdwn',
          text: `*Position:*\nP${position}`,
        },
        ...(gap ? [{
          type: 'mrkdwn',
          text: `*Gap to Leader:*\n${gap}`,
        }] : []),
      ],
    },
  ];

  return sendSlackBlocks(blocks);
}

/**
 * Send a pit stop notification
 */
export async function sendPitStopNotification(
  vehicle: string,
  lap: number,
  reason: string,
  estimatedTime?: string
): Promise<SlackWebhookResponse> {
  return sendSlackNotification(
    '🔧 Pit Stop Alert',
    `Vehicle *${vehicle}* entering pit lane on Lap ${lap}\n*Reason:* ${reason}${estimatedTime ? `\n*Estimated Duration:* ${estimatedTime}` : ''}`,
    'warning',
    [
      { title: 'Vehicle', value: vehicle, short: true },
      { title: 'Lap', value: String(lap), short: true },
      { title: 'Reason', value: reason, short: false },
    ]
  );
}

/**
 * Send a tire wear alert
 */
export async function sendTireWearAlert(
  vehicle: string,
  frontLeft: number,
  frontRight: number,
  rearLeft: number,
  rearRight: number,
  recommendedLap?: number
): Promise<SlackWebhookResponse> {
  const avgWear = (frontLeft + frontRight + rearLeft + rearRight) / 4;
  const status = avgWear > 80 ? 'critical' : avgWear > 60 ? 'warning' : 'info';

  return sendSlackNotification(
    `${status === 'critical' ? '🚨' : '⚠️'} Tire Wear Alert`,
    `Vehicle *${vehicle}* tire wear levels:`,
    status === 'critical' ? 'danger' : status === 'warning' ? 'warning' : 'good',
    [
      { title: 'Front Left', value: `${frontLeft.toFixed(1)}%`, short: true },
      { title: 'Front Right', value: `${frontRight.toFixed(1)}%`, short: true },
      { title: 'Rear Left', value: `${rearLeft.toFixed(1)}%`, short: true },
      { title: 'Rear Right', value: `${rearRight.toFixed(1)}%`, short: true },
      ...(recommendedLap ? [{ title: 'Recommended Pit Lap', value: String(recommendedLap), short: false }] : []),
    ]
  );
}

/**
 * Get mock mode status
 */
export function isSlackMockMode(): boolean {
  return isMockMode();
}


