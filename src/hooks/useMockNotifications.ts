// src/hooks/useMockNotifications.ts
// Hook to automatically trigger mock notifications throughout the app

import { useEffect, useRef } from 'react';
import {
  startMockNotificationSimulation,
  triggerRandomNotification,
  generateRaceAlert,
  generatePitAlert,
  generateTireAlert,
  generatePitDecisionAlert,
  generateHumanLoop,
  showRaceAlert,
  showPitAlert,
  showTireAlert,
  showPitDecisionAlert,
  showHumanLoop,
} from '@/mocks/notificationMockData';

interface UseMockNotificationsOptions {
  enabled?: boolean;
  intervalMs?: number;
  autoStart?: boolean;
}

/**
 * Hook to enable mock notifications throughout the app
 * Automatically triggers race alerts, pit alerts, tire alerts, and human-in-the-loop popups
 */
export function useMockNotifications(options: UseMockNotificationsOptions = {}) {
  const {
    enabled = true,
    intervalMs = 30000, // 30 seconds default
    autoStart = true,
  } = options;

  const stopSimulationRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !autoStart) {
      return;
    }

    // Trigger pit decision alert in first 10 seconds for dashboard (at 8 seconds)
    const earlyPitAlertTimeout = setTimeout(() => {
      const pitDecision = generatePitDecisionAlert();
      showPitDecisionAlert(pitDecision);
    }, 8000); // 8 seconds (within first 10 seconds)

    // Start the simulation
    const stopSimulation = startMockNotificationSimulation(intervalMs);
    stopSimulationRef.current = stopSimulation;

    // Also trigger an initial notification after a short delay
    const initialTimeout = setTimeout(() => {
      triggerRandomNotification();
    }, 3000);

    return () => {
      clearTimeout(earlyPitAlertTimeout);
      clearTimeout(initialTimeout);
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
      }
    };
  }, [enabled, intervalMs, autoStart]);

  // Manual trigger functions
  const triggerRaceAlert = () => {
    showRaceAlert(generateRaceAlert());
  };

  const triggerPitAlert = () => {
    showPitAlert(generatePitAlert());
  };

  const triggerTireAlert = () => {
    showTireAlert(generateTireAlert());
  };

  const triggerHumanLoop = async () => {
    return showHumanLoop(generateHumanLoop());
  };

  const triggerPitDecision = () => {
    showPitDecisionAlert(generatePitDecisionAlert());
  };

  const triggerRandom = () => {
    triggerRandomNotification();
  };

  return {
    triggerRaceAlert,
    triggerPitAlert,
    triggerTireAlert,
    triggerPitDecision,
    triggerHumanLoop,
    triggerRandom,
    stopSimulation: () => {
      if (stopSimulationRef.current) {
        stopSimulationRef.current();
        stopSimulationRef.current = null;
      }
    },
  };
}


