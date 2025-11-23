// src/hooks/useMockDemoData.ts
// Hook to provide comprehensive mock demo data when demo mode is active

import { useState, useEffect, useMemo } from "react";
import { useDemoMode } from "./useDemoMode";
import {
  generateAllTracksMockData,
  getTrackMockData,
  type MockTelemetryPoint,
  type MockTimeSeriesData,
  type MockTirePrediction,
} from "@/lib/mockDemoData";
import type { AgentDecision } from "@/components/pitwall/AIAgentDecisions";

export interface MockDemoData {
  agentDecisions: AgentDecision[];
  timeSeries: MockTimeSeriesData[];
  tirePredictions: MockTirePrediction[];
  telemetry: MockTelemetryPoint[];
}

let cachedMockData: ReturnType<typeof generateAllTracksMockData> | null = null;

export function useMockDemoData(trackId?: string): MockDemoData | null {
  const { isDemoMode } = useDemoMode();
  const [data, setData] = useState<MockDemoData | null>(null);

  useEffect(() => {
    if (!isDemoMode) {
      setData(null);
      return;
    }

    // Generate or use cached mock data
    if (!cachedMockData) {
      console.log("Generating comprehensive mock demo data for all tracks...");
      cachedMockData = generateAllTracksMockData();
      console.log("✓ Mock data generated:", {
        tracks: Object.keys(cachedMockData.agentDecisions).length,
        totalDecisions: Object.values(cachedMockData.agentDecisions).reduce(
          (sum, arr) => sum + arr.length,
          0
        ),
      });
    }

    // Get data for specific track or all tracks
    if (trackId) {
      const trackData = getTrackMockData(trackId);
      setData(trackData);
    } else {
      // Return first track's data as default
      const firstTrack = Object.keys(cachedMockData.agentDecisions)[0];
      if (firstTrack) {
        const trackData = getTrackMockData(firstTrack);
        setData(trackData);
      }
    }
  }, [isDemoMode, trackId]);

  return data;
}

// Hook to get real-time streaming mock telemetry
export function useMockTelemetryStream(
  trackId: string,
  vehicleNumber: number,
  intervalMs: number = 500
): MockTelemetryPoint[] {
  const { isDemoMode } = useDemoMode();
  const [points, setPoints] = useState<MockTelemetryPoint[]>([]);

  useEffect(() => {
    if (!isDemoMode) {
      setPoints([]);
      return;
    }

    const trackData = getTrackMockData(trackId);
    const vehicleTelemetry = trackData.telemetry.filter(
      (t) => t.vehicle_number === vehicleNumber
    );

    if (vehicleTelemetry.length === 0) {
      return;
    }

    let currentIndex = 0;
    const streamInterval = setInterval(() => {
      if (currentIndex < vehicleTelemetry.length) {
        setPoints((prev) => [...prev.slice(-499), vehicleTelemetry[currentIndex]]);
        currentIndex++;
      } else {
        // Loop back to start
        currentIndex = 0;
      }
    }, intervalMs);

    return () => clearInterval(streamInterval);
  }, [isDemoMode, trackId, vehicleNumber, intervalMs]);

  return points;
}

// Hook to get agent decisions for a track
export function useMockAgentDecisions(trackId: string): AgentDecision[] {
  const { isDemoMode } = useDemoMode();
  const data = useMockDemoData(trackId);

  return useMemo(() => {
    if (!isDemoMode || !data) {
      return [];
    }
    return data.agentDecisions;
  }, [isDemoMode, data]);
}

// Hook to get tire predictions for a track
export function useMockTirePredictions(
  trackId: string,
  vehicleNumber?: number
): MockTirePrediction[] {
  const { isDemoMode } = useDemoMode();
  const data = useMockDemoData(trackId);

  return useMemo(() => {
    if (!isDemoMode || !data) {
      return [];
    }
    if (vehicleNumber) {
      return data.tirePredictions.filter(
        (p) => p.vehicle_number === vehicleNumber
      );
    }
    return data.tirePredictions;
  }, [isDemoMode, data, vehicleNumber]);
}

// Hook to get time series data for a track
export function useMockTimeSeries(
  trackId: string,
  vehicleNumber?: number
): MockTimeSeriesData[] {
  const { isDemoMode } = useDemoMode();
  const data = useMockDemoData(trackId);

  return useMemo(() => {
    if (!isDemoMode || !data) {
      return [];
    }
    if (vehicleNumber) {
      return data.timeSeries.filter((t) => t.vehicle_number === vehicleNumber);
    }
    return data.timeSeries;
  }, [isDemoMode, data, vehicleNumber]);
}


