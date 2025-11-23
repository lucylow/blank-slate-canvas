// src/hooks/useSlack.ts
// React hook for Slack webhook integration

import { useCallback } from 'react';
import {
  sendSlackMessage,
  sendSlackText,
  sendSlackNotification,
  sendRaceAlert,
  sendTelemetryAlert,
  sendLapTimeNotification,
  sendPitStopNotification,
  sendTireWearAlert,
  getMockMessages,
  clearMockMessages,
  isSlackMockMode,
  type SlackMessage,
  type SlackWebhookResponse,
  type MockSlackMessage,
} from '@/api/slack';

export interface UseSlackReturn {
  // Core functions
  sendMessage: (message: string | SlackMessage) => Promise<SlackWebhookResponse>;
  sendText: (message: string) => Promise<SlackWebhookResponse>;
  sendNotification: (
    title: string,
    message: string,
    color?: 'good' | 'warning' | 'danger' | string,
    fields?: Array<{ title: string; value: string; short?: boolean }>
  ) => Promise<SlackWebhookResponse>;
  
  // Specialized functions
  sendRaceAlert: (
    raceName: string,
    event: string,
    details?: Record<string, string>
  ) => Promise<SlackWebhookResponse>;
  sendTelemetryAlert: (
    vehicle: string,
    metric: string,
    value: string | number,
    status?: 'info' | 'warning' | 'critical'
  ) => Promise<SlackWebhookResponse>;
  sendLapTimeNotification: (
    vehicle: string,
    lap: number,
    lapTime: string,
    position: number,
    gap?: string
  ) => Promise<SlackWebhookResponse>;
  sendPitStopNotification: (
    vehicle: string,
    lap: number,
    reason: string,
    estimatedTime?: string
  ) => Promise<SlackWebhookResponse>;
  sendTireWearAlert: (
    vehicle: string,
    frontLeft: number,
    frontRight: number,
    rearLeft: number,
    rearRight: number,
    recommendedLap?: number
  ) => Promise<SlackWebhookResponse>;
  
  // Mock data functions
  getMockMessages: (limit?: number) => MockSlackMessage[];
  clearMockMessages: () => void;
  isMockMode: boolean;
}

/**
 * React hook for Slack webhook integration
 */
export function useSlack(): UseSlackReturn {
  const isMockMode = isSlackMockMode();

  const sendMessage = useCallback(
    async (message: string | SlackMessage): Promise<SlackWebhookResponse> => {
      return sendSlackMessage(message);
    },
    []
  );

  const sendText = useCallback(
    async (message: string): Promise<SlackWebhookResponse> => {
      return sendSlackText(message);
    },
    []
  );

  const sendNotification = useCallback(
    async (
      title: string,
      message: string,
      color: 'good' | 'warning' | 'danger' | string = 'good',
      fields?: Array<{ title: string; value: string; short?: boolean }>
    ): Promise<SlackWebhookResponse> => {
      return sendSlackNotification(title, message, color, fields);
    },
    []
  );

  const handleRaceAlert = useCallback(
    async (
      raceName: string,
      event: string,
      details?: Record<string, string>
    ): Promise<SlackWebhookResponse> => {
      return sendRaceAlert(raceName, event, details);
    },
    []
  );

  const handleTelemetryAlert = useCallback(
    async (
      vehicle: string,
      metric: string,
      value: string | number,
      status: 'info' | 'warning' | 'critical' = 'info'
    ): Promise<SlackWebhookResponse> => {
      return sendTelemetryAlert(vehicle, metric, value, status);
    },
    []
  );

  const handleLapTimeNotification = useCallback(
    async (
      vehicle: string,
      lap: number,
      lapTime: string,
      position: number,
      gap?: string
    ): Promise<SlackWebhookResponse> => {
      return sendLapTimeNotification(vehicle, lap, lapTime, position, gap);
    },
    []
  );

  const handlePitStopNotification = useCallback(
    async (
      vehicle: string,
      lap: number,
      reason: string,
      estimatedTime?: string
    ): Promise<SlackWebhookResponse> => {
      return sendPitStopNotification(vehicle, lap, reason, estimatedTime);
    },
    []
  );

  const handleTireWearAlert = useCallback(
    async (
      vehicle: string,
      frontLeft: number,
      frontRight: number,
      rearLeft: number,
      rearRight: number,
      recommendedLap?: number
    ): Promise<SlackWebhookResponse> => {
      return sendTireWearAlert(vehicle, frontLeft, frontRight, rearLeft, rearRight, recommendedLap);
    },
    []
  );

  return {
    sendMessage,
    sendText,
    sendNotification,
    sendRaceAlert: handleRaceAlert,
    sendTelemetryAlert: handleTelemetryAlert,
    sendLapTimeNotification: handleLapTimeNotification,
    sendPitStopNotification: handlePitStopNotification,
    sendTireWearAlert: handleTireWearAlert,
    getMockMessages,
    clearMockMessages,
    isMockMode,
  };
}

