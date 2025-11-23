// src/hooks/useMockNotifications.ts
// Hook to automatically trigger mock notifications throughout the app

import { useEffect, useRef } from 'react';
import {
  startMockNotificationSimulation,
  triggerRandomNotification,
  generateRaceAlert,
  generatePitAlert,
  generateTireAlert,
  generateHumanLoop,
  showRaceAlert,
  showPitAlert,
  showTireAlert,
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

    // Start the simulation
    const stopSimulation = startMockNotificationSimulation(intervalMs);
    stopSimulationRef.current = stopSimulation;

    // Also trigger an initial notification after a short delay
    const initialTimeout = setTimeout(() => {
      triggerRandomNotification();
    }, 3000);

    return () => {
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

  const triggerRandom = () => {
    triggerRandomNotification();
  };

  return {
    triggerRaceAlert,
    triggerPitAlert,
    triggerTireAlert,
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

