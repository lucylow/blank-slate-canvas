/**
 * React hook for automated driver fingerprinting
 * 
 * Automatically learns and maintains driver behavior profiles from telemetry streams.
 * Integrates with existing telemetry infrastructure for continuous learning.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  DriverFingerprintGenerator,
  ContinuousFingerprintManager,
  DriverFingerprint,
  FingerprintTelemetryPoint,
} from '@/lib/driverFingerprinting';
import type { TelemetryPoint } from '@/lib/api';

export interface UseDriverFingerprintingOptions {
  /**
   * Minimum number of telemetry samples before generating a fingerprint
   * @default 50
   */
  minSamples?: number;

  /**
   * Update frequency in milliseconds (how often to recompute fingerprints)
   * @default 5000
   */
  updateInterval?: number;

  /**
   * Enable continuous learning (fingerprints update as new data arrives)
   * @default true
   */
  continuousLearning?: boolean;

  /**
   * Track context for fingerprinting (e.g., track name)
   */
  trackContext?: string;

  /**
   * Mission/session ID for grouping fingerprints
   */
  missionId?: string;
}

export interface UseDriverFingerprintingReturn {
  /**
   * Map of driver IDs to their current fingerprints
   */
  fingerprints: Map<string, DriverFingerprint>;

  /**
   * Get fingerprint for a specific driver
   */
  getFingerprint: (driverId: string) => DriverFingerprint | undefined;

  /**
   * Compare two driver fingerprints
   */
  compareDrivers: (driverIdA: string, driverIdB: string) => {
    similarity: number;
    differences: Record<string, number>;
    styleComparison: Record<string, string>;
  } | null;

  /**
   * Add telemetry points for processing
   */
  addTelemetry: (points: TelemetryPoint[] | FingerprintTelemetryPoint[]) => void;

  /**
   * Force recomputation of all fingerprints
   */
  recompute: () => void;

  /**
   * Clear all fingerprints and telemetry buffer
   */
  clear: () => void;

  /**
   * Statistics about the fingerprinting process
   */
  stats: {
    totalDrivers: number;
    totalSamples: number;
    lastUpdate: number | null;
  };
}

/**
 * Convert TelemetryPoint to FingerprintTelemetryPoint
 */
function convertToFingerprintPoint(
  point: TelemetryPoint,
  driverId: string
): FingerprintTelemetryPoint {
  return {
    timestamp: point.timestamp ?? Date.now(),
    throttle: (point.throttle ?? 0) / 100, // Convert 0-100 to 0-1
    brake: point.brake ?? 0,
    steeringAngle: 0, // Will need to be added to TelemetryPoint or derived
    speedKmh: point.speed ?? 0,
    gear: point.gear ?? 1,
    rpm: point.rpm ?? 0,
    longitudinalG: point.g_force_long ?? 0,
    lateralG: point.g_force_lat ?? 0,
    brakePressure: point.brake ?? 0,
    sector: point.sector ?? 1,
    lap: point.lap ?? 1,
    driverId,
  };
}

/**
 * Extract driver ID from telemetry point
 * This is a placeholder - adjust based on your actual telemetry structure
 */
function extractDriverId(point: TelemetryPoint): string {
  // Try various possible fields for driver identification
  if ('driverId' in point && typeof point.driverId === 'string') {
    return point.driverId;
  }
  if ('vehicleId' in point && typeof point.vehicleId === 'string') {
    return point.vehicleId;
  }
  if ('chassisNumber' in point && typeof point.chassisNumber === 'string') {
    return point.chassisNumber;
  }
  if ('carNumber' in point && typeof point.carNumber === 'string') {
    return point.carNumber;
  }
  
  // Fallback: use a hash or default
  return 'unknown';
}

/**
 * Hook for automated driver fingerprinting
 * 
 * @example
 * ```tsx
 * const { fingerprints, getFingerprint, addTelemetry } = useDriverFingerprinting({
 *   minSamples: 100,
 *   trackContext: 'circuit_of_the_americas',
 * });
 * 
 * // Add telemetry as it arrives
 * useEffect(() => {
 *   const unsubscribe = telemetryWS.subscribe((point) => {
 *     addTelemetry([point]);
 *   });
 *   return unsubscribe;
 * }, [addTelemetry]);
 * ```
 */
export function useDriverFingerprinting(
  options: UseDriverFingerprintingOptions = {}
): UseDriverFingerprintingReturn {
  const {
    minSamples = 50,
    updateInterval = 5000,
    continuousLearning = true,
    trackContext,
    missionId,
  } = options;

  const managerRef = useRef<ContinuousFingerprintManager | null>(null);
  const [fingerprints, setFingerprints] = useState<Map<string, DriverFingerprint>>(new Map());
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalSamples: 0,
    lastUpdate: null as number | null,
  });

  // Initialize fingerprint manager
  useEffect(() => {
    managerRef.current = new ContinuousFingerprintManager({
      minSamplesForFingerprint: minSamples,
    });

    return () => {
      managerRef.current = null;
    };
  }, [minSamples]);

  // Update fingerprints periodically if continuous learning is enabled
  useEffect(() => {
    if (!continuousLearning || !managerRef.current) return;

    const interval = setInterval(() => {
      if (managerRef.current) {
        managerRef.current.recomputeAll();
        const updated = managerRef.current.getAllFingerprints();
        
        // Update metadata
        const allFingerprints = Array.from(updated.values());
        const totalSamples = allFingerprints.reduce((sum, fp) => sum + fp.sampleCount, 0);
        
        setFingerprints(new Map(updated));
        setStats({
          totalDrivers: updated.size,
          totalSamples,
          lastUpdate: Date.now(),
        });
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [continuousLearning, updateInterval]);

  // Add telemetry points
  const addTelemetry = useCallback((points: TelemetryPoint[] | FingerprintTelemetryPoint[]) => {
    if (!managerRef.current) return;

    // Convert to FingerprintTelemetryPoint format
    const fingerprintPoints: FingerprintTelemetryPoint[] = points.map((point) => {
      // If already in correct format, use as-is
      if ('driverId' in point && typeof point.driverId === 'string') {
        return point as FingerprintTelemetryPoint;
      }

      // Convert from TelemetryPoint
      const tp = point as TelemetryPoint;
      const driverId = extractDriverId(tp);
      
      return convertToFingerprintPoint(tp, driverId);
    });

    // Add to manager
    managerRef.current.addTelemetry(fingerprintPoints);

    // Update fingerprints immediately if continuous learning is disabled
    if (!continuousLearning) {
      const updated = managerRef.current.getAllFingerprints();
      const allFingerprints = Array.from(updated.values());
      const totalSamples = allFingerprints.reduce((sum, fp) => sum + fp.sampleCount, 0);
      
      setFingerprints(new Map(updated));
      setStats({
        totalDrivers: updated.size,
        totalSamples,
        lastUpdate: Date.now(),
      });
    }
  }, [continuousLearning]);

  // Get fingerprint for a specific driver
  const getFingerprint = useCallback((driverId: string): DriverFingerprint | undefined => {
    return fingerprints.get(driverId);
  }, [fingerprints]);

  // Compare two drivers
  const compareDrivers = useCallback((
    driverIdA: string,
    driverIdB: string
  ) => {
    const fpA = fingerprints.get(driverIdA);
    const fpB = fingerprints.get(driverIdB);

    if (!fpA || !fpB) {
      return null;
    }

    const comparison = DriverFingerprintGenerator.compareFingerprints(fpA, fpB);
    
    return {
      similarity: comparison.similarity,
      differences: comparison.differences,
      styleComparison: comparison.styleComparison,
    };
  }, [fingerprints]);

  // Force recomputation
  const recompute = useCallback(() => {
    if (!managerRef.current) return;

    managerRef.current.recomputeAll();
    const updated = managerRef.current.getAllFingerprints();
    const allFingerprints = Array.from(updated.values());
    const totalSamples = allFingerprints.reduce((sum, fp) => sum + fp.sampleCount, 0);
    
    setFingerprints(new Map(updated));
    setStats({
      totalDrivers: updated.size,
      totalSamples,
      lastUpdate: Date.now(),
    });
  }, []);

  // Clear all data
  const clear = useCallback(() => {
    if (managerRef.current) {
      managerRef.current = new ContinuousFingerprintManager({
        minSamplesForFingerprint: minSamples,
      });
    }
    setFingerprints(new Map());
    setStats({
      totalDrivers: 0,
      totalSamples: 0,
      lastUpdate: null,
    });
  }, [minSamples]);

  // Update track context and mission ID in fingerprints (if needed)
  useEffect(() => {
    if (trackContext || missionId) {
      const updated = new Map(fingerprints);
      for (const [driverId, fingerprint] of updated.entries()) {
        updated.set(driverId, {
          ...fingerprint,
          trackContext: trackContext ?? fingerprint.trackContext,
          missionId: missionId ?? fingerprint.missionId,
        });
      }
      setFingerprints(updated);
    }
  }, [trackContext, missionId, fingerprints]);

  return {
    fingerprints,
    getFingerprint,
    compareDrivers,
    addTelemetry,
    recompute,
    clear,
    stats,
  };
}

export default useDriverFingerprinting;

