/**
 * Driver Fingerprinting via Automated Behavior Profiling
 * 
 * This module learns unique driver fingerprints automatically by analyzing telemetry streams.
 * It creates a continuous behavior profile for each driver or mission, capturing signature driving patterns.
 * 
 * Based on research in:
 * - IEEE: Driver Behavior Profiling in Simulated Racing
 * - AI-enabled prediction of sim racing performance using telemetry data
 * - Formula RL: Deep reinforcement learning for autonomous racing
 */

import type { TelemetryPoint } from './api';

/**
 * Enhanced telemetry point with all required fields for fingerprinting
 */
export interface FingerprintTelemetryPoint {
  timestamp: number;
  throttle: number; // 0-1
  brake: number;    // 0-1
  steeringAngle: number; // degrees left/right (derived or direct)
  speedKmh: number;
  gear: number;
  rpm: number;
  longitudinalG: number;
  lateralG: number;
  brakePressure: number;
  sector: number;
  lap: number;
  driverId: string;
}

/**
 * Comprehensive driver fingerprint capturing unique behavioral patterns
 */
export interface DriverFingerprint {
  driverId: string;
  
  // Basic statistics
  averageThrottle: number;
  averageBrake: number;
  averageSteeringAngle: number;
  avgSpeed: number;
  
  // Distribution profiles
  rpmDistribution: number[];  // histogram buckets (0-1000, 1000-2000, ..., 9000-10000)
  longitudinalGProfile: number[];
  lateralGProfile: number[];
  
  // Behavioral classifications
  corneringStyle: 'aggressive' | 'balanced' | 'conservative';
  brakingStyle: 'late' | 'early' | 'balanced';
  throttleStyle: 'smooth' | 'aggressive' | 'erratic';
  
  // Advanced metrics
  consistency: number; // 0-1, variance in lap times
  smoothness: number; // 0-1, variance in control inputs
  aggression: number; // 0-1, combination of G-forces and control inputs
  
  // Embedding vector for similarity comparison
  fingerprintVector: number[];
  
  // Metadata
  sampleCount: number;
  lastUpdated: number;
  trackContext?: string;
  missionId?: string;
}

/**
 * Configuration for fingerprint generation
 */
export interface FingerprintConfig {
  rpmBucketCount?: number;
  gProfileSampleSize?: number;
  smoothingWindow?: number;
  minSamplesForFingerprint?: number;
}

/**
 * Driver Fingerprint Generator
 * 
 * Automatically learns and updates driver behavior profiles from telemetry streams.
 * Supports continuous learning and incremental updates.
 */
export class DriverFingerprintGenerator {
  private telemetryData: FingerprintTelemetryPoint[];
  private config: Required<FingerprintConfig>;

  constructor(
    telemetry: FingerprintTelemetryPoint[] | TelemetryPoint[],
    config: FingerprintConfig = {}
  ) {
    // Convert TelemetryPoint to FingerprintTelemetryPoint if needed
    this.telemetryData = this.normalizeTelemetry(telemetry);
    
    this.config = {
      rpmBucketCount: config.rpmBucketCount ?? 10,
      gProfileSampleSize: config.gProfileSampleSize ?? 100,
      smoothingWindow: config.smoothingWindow ?? 5,
      minSamplesForFingerprint: config.minSamplesForFingerprint ?? 50,
    };
  }

  /**
   * Normalize telemetry data to FingerprintTelemetryPoint format
   */
  private normalizeTelemetry(
    telemetry: FingerprintTelemetryPoint[] | TelemetryPoint[]
  ): FingerprintTelemetryPoint[] {
    return telemetry.map((point): FingerprintTelemetryPoint => {
      // If already in correct format, return as-is
      if ('driverId' in point && typeof point.driverId === 'string') {
        return point as FingerprintTelemetryPoint;
      }

      // Convert from TelemetryPoint format
      const tp = point as TelemetryPoint;
      return {
        timestamp: tp.timestamp ?? Date.now(),
        throttle: (tp.throttle ?? 0) / 100, // Convert 0-100 to 0-1
        brake: tp.brake ?? 0,
        steeringAngle: 0, // Will need to be derived or added to TelemetryPoint
        speedKmh: tp.speed ?? 0,
        gear: tp.gear ?? 1,
        rpm: tp.rpm ?? 0,
        longitudinalG: tp.g_force_long ?? 0,
        lateralG: tp.g_force_lat ?? 0,
        brakePressure: tp.brake ?? 0,
        sector: tp.sector ?? 1,
        lap: tp.lap ?? 1,
        driverId: '', // Will need to be provided or extracted from context
      };
    });
  }

  /**
   * Process telemetry to compute fingerprint per driver.
   * Returns computed DriverFingerprint objects keyed by driverId.
   */
  computeDriverFingerprints(): Map<string, DriverFingerprint> {
    const drivers = new Map<string, FingerprintTelemetryPoint[]>();

    // Group telemetry points by driverId
    for (const point of this.telemetryData) {
      if (!point.driverId) continue;
      
      if (!drivers.has(point.driverId)) {
        drivers.set(point.driverId, []);
      }
      drivers.get(point.driverId)!.push(point);
    }

    const fingerprints = new Map<string, DriverFingerprint>();

    for (const [driverId, points] of drivers.entries()) {
      // Skip if insufficient data
      if (points.length < this.config.minSamplesForFingerprint) {
        continue;
      }

      // Compute basic statistics
      const avgThrottle = points.reduce((sum, p) => sum + p.throttle, 0) / points.length;
      const avgBrake = points.reduce((sum, p) => sum + p.brake, 0) / points.length;
      const avgSteering = points.reduce((sum, p) => sum + Math.abs(p.steeringAngle), 0) / points.length;
      const avgSpeed = points.reduce((sum, p) => sum + p.speedKmh, 0) / points.length;

      // RPM distribution histogram
      const rpmBuckets = new Array(this.config.rpmBucketCount).fill(0);
      const maxRpm = 10000; // Assuming max RPM
      const bucketSize = maxRpm / this.config.rpmBucketCount;
      
      points.forEach(p => {
        const index = Math.min(Math.floor(p.rpm / bucketSize), this.config.rpmBucketCount - 1);
        rpmBuckets[index]++;
      });
      
      // Normalize RPM distribution
      const totalRpmSamples = rpmBuckets.reduce((a, b) => a + b, 0);
      const normalizedRpmDistribution = totalRpmSamples > 0
        ? rpmBuckets.map(count => count / totalRpmSamples)
        : rpmBuckets;

      // G-force profiles (sampled for efficiency)
      const longitudinalGProfile = this.sampleProfile(
        points.map(p => p.longitudinalG),
        this.config.gProfileSampleSize
      );
      const lateralGProfile = this.sampleProfile(
        points.map(p => p.lateralG),
        this.config.gProfileSampleSize
      );

      // Compute consistency (variance in lap times)
      const lapTimes = this.extractLapTimes(points);
      const consistency = this.computeConsistency(lapTimes);

      // Compute smoothness (variance in control inputs)
      const smoothness = this.computeSmoothness(points);

      // Compute aggression (combination of G-forces and control inputs)
      const aggression = this.computeAggression(points);

      // Determine behavioral styles
      const corneringStyle = this.classifyCorneringStyle(avgSteering, lateralGProfile);
      const brakingStyle = this.classifyBrakingStyle(avgBrake, points);
      const throttleStyle = this.classifyThrottleStyle(points);

      // Generate fingerprint vector (embedding for similarity)
      const fingerprintVector = this.generateFingerprintVector({
        avgThrottle,
        avgBrake,
        avgSteering,
        avgSpeed,
        normalizedRpmDistribution,
        longitudinalGProfile,
        lateralGProfile,
        consistency,
        smoothness,
        aggression,
        corneringStyle,
        brakingStyle,
        throttleStyle,
      });

      fingerprints.set(driverId, {
        driverId,
        averageThrottle: avgThrottle,
        averageBrake: avgBrake,
        averageSteeringAngle: avgSteering,
        avgSpeed,
        rpmDistribution: normalizedRpmDistribution,
        longitudinalGProfile,
        lateralGProfile,
        corneringStyle,
        brakingStyle,
        throttleStyle,
        consistency,
        smoothness,
        aggression,
        fingerprintVector,
        sampleCount: points.length,
        lastUpdated: Date.now(),
      });
    }

    return fingerprints;
  }

  /**
   * Sample a profile array to a fixed size for efficiency
   */
  private sampleProfile(profile: number[], targetSize: number): number[] {
    if (profile.length <= targetSize) {
      return profile;
    }

    const sampled: number[] = [];
    const step = profile.length / targetSize;
    
    for (let i = 0; i < targetSize; i++) {
      const index = Math.floor(i * step);
      sampled.push(profile[index]);
    }

    return sampled;
  }

  /**
   * Extract lap times from telemetry points
   */
  private extractLapTimes(points: FingerprintTelemetryPoint[]): number[] {
    const lapTimes = new Map<number, { start: number; end: number }>();
    
    points.forEach(p => {
      if (!lapTimes.has(p.lap)) {
        lapTimes.set(p.lap, { start: p.timestamp, end: p.timestamp });
      } else {
        const lap = lapTimes.get(p.lap)!;
        lap.end = Math.max(lap.end, p.timestamp);
        lap.start = Math.min(lap.start, p.timestamp);
      }
    });

    return Array.from(lapTimes.values())
      .map(lap => (lap.end - lap.start) / 1000) // Convert to seconds
      .filter(time => time > 0 && time < 600); // Filter invalid times
  }

  /**
   * Compute consistency score (0-1) based on lap time variance
   */
  private computeConsistency(lapTimes: number[]): number {
    if (lapTimes.length < 2) return 0.5;

    const mean = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
    const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / lapTimes.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;

    // Convert to 0-1 scale (lower CV = higher consistency)
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation));
  }

  /**
   * Compute smoothness score (0-1) based on control input variance
   */
  private computeSmoothness(points: FingerprintTelemetryPoint[]): number {
    if (points.length < 2) return 0.5;

    const throttleChanges: number[] = [];
    const brakeChanges: number[] = [];
    const steeringChanges: number[] = [];

    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      
      throttleChanges.push(Math.abs(curr.throttle - prev.throttle));
      brakeChanges.push(Math.abs(curr.brake - prev.brake));
      steeringChanges.push(Math.abs(curr.steeringAngle - prev.steeringAngle));
    }

    const avgThrottleChange = throttleChanges.reduce((a, b) => a + b, 0) / throttleChanges.length;
    const avgBrakeChange = brakeChanges.reduce((a, b) => a + b, 0) / brakeChanges.length;
    const avgSteeringChange = steeringChanges.reduce((a, b) => a + b, 0) / steeringChanges.length;

    // Normalize and combine (lower changes = higher smoothness)
    const combinedSmoothness = 1 - Math.min(1, (avgThrottleChange + avgBrakeChange + avgSteeringChange / 10) / 2);
    
    return Math.max(0, Math.min(1, combinedSmoothness));
  }

  /**
   * Compute aggression score (0-1) based on G-forces and control inputs
   */
  private computeAggression(points: FingerprintTelemetryPoint[]): number {
    if (points.length === 0) return 0;

    const avgLongitudinalG = points.reduce((sum, p) => sum + Math.abs(p.longitudinalG), 0) / points.length;
    const avgLateralG = points.reduce((sum, p) => sum + Math.abs(p.lateralG), 0) / points.length;
    const avgThrottle = points.reduce((sum, p) => sum + p.throttle, 0) / points.length;
    const avgBrake = points.reduce((sum, p) => sum + p.brake, 0) / points.length;

    // Normalize and combine factors
    const gFactor = (avgLongitudinalG + avgLateralG) / 2; // Typical max ~2G
    const controlFactor = (avgThrottle + avgBrake) / 2;
    
    const aggression = (gFactor / 2 + controlFactor) / 2;
    
    return Math.max(0, Math.min(1, aggression));
  }

  /**
   * Classify cornering style based on steering angle and lateral G-forces
   */
  private classifyCorneringStyle(
    avgSteering: number,
    lateralGProfile: number[]
  ): 'aggressive' | 'balanced' | 'conservative' {
    const avgLateralG = lateralGProfile.reduce((a, b) => a + Math.abs(b), 0) / lateralGProfile.length;
    const maxLateralG = Math.max(...lateralGProfile.map(Math.abs));

    if (avgSteering > 15 || maxLateralG > 1.5) {
      return 'aggressive';
    } else if (avgSteering > 8 || maxLateralG > 1.0) {
      return 'balanced';
    } else {
      return 'conservative';
    }
  }

  /**
   * Classify braking style based on brake usage patterns
   */
  private classifyBrakingStyle(
    avgBrake: number,
    points: FingerprintTelemetryPoint[]
  ): 'late' | 'early' | 'balanced' {
    // Analyze brake application timing relative to corners
    const brakeEvents = points.filter(p => p.brake > 0.3);
    const cornerEvents = points.filter(p => Math.abs(p.steeringAngle) > 10);

    if (brakeEvents.length === 0) return 'balanced';

    // Check if braking happens late (high brake pressure with steering)
    const lateBrakingCount = points.filter(
      p => p.brake > 0.5 && Math.abs(p.steeringAngle) > 5
    ).length;

    const lateBrakingRatio = lateBrakingCount / brakeEvents.length;

    if (avgBrake > 0.3 || lateBrakingRatio > 0.4) {
      return 'late';
    } else if (avgBrake < 0.1) {
      return 'early';
    } else {
      return 'balanced';
    }
  }

  /**
   * Classify throttle style based on throttle application patterns
   */
  private classifyThrottleStyle(
    points: FingerprintTelemetryPoint[]
  ): 'smooth' | 'aggressive' | 'erratic' {
    if (points.length < 2) return 'smooth';

    const throttleChanges: number[] = [];
    for (let i = 1; i < points.length; i++) {
      throttleChanges.push(Math.abs(points[i].throttle - points[i - 1].throttle));
    }

    const avgChange = throttleChanges.reduce((a, b) => a + b, 0) / throttleChanges.length;
    const variance = throttleChanges.reduce(
      (sum, change) => sum + Math.pow(change - avgChange, 2),
      0
    ) / throttleChanges.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev > 0.15) {
      return 'erratic';
    } else if (avgChange > 0.1) {
      return 'aggressive';
    } else {
      return 'smooth';
    }
  }

  /**
   * Generate fingerprint vector (embedding) for similarity comparison
   */
  private generateFingerprintVector(features: {
    avgThrottle: number;
    avgBrake: number;
    avgSteering: number;
    avgSpeed: number;
    normalizedRpmDistribution: number[];
    longitudinalGProfile: number[];
    lateralGProfile: number[];
    consistency: number;
    smoothness: number;
    aggression: number;
    corneringStyle: string;
    brakingStyle: string;
    throttleStyle: string;
  }): number[] {
    const vector: number[] = [];

    // Basic features (normalized)
    vector.push(features.avgThrottle);
    vector.push(features.avgBrake);
    vector.push(features.avgSteering / 30); // Normalize steering (max ~30 degrees)
    vector.push(features.avgSpeed / 300); // Normalize speed (max ~300 km/h)

    // Style encodings (one-hot like)
    vector.push(features.corneringStyle === 'aggressive' ? 1 : 0);
    vector.push(features.corneringStyle === 'balanced' ? 1 : 0);
    vector.push(features.brakingStyle === 'late' ? 1 : 0);
    vector.push(features.brakingStyle === 'balanced' ? 1 : 0);
    vector.push(features.throttleStyle === 'smooth' ? 1 : 0);
    vector.push(features.throttleStyle === 'aggressive' ? 1 : 0);

    // Advanced metrics
    vector.push(features.consistency);
    vector.push(features.smoothness);
    vector.push(features.aggression);

    // RPM distribution summary (first 5 buckets)
    vector.push(...features.normalizedRpmDistribution.slice(0, 5));

    // G-force profile summaries (mean and max)
    const longGMean = features.longitudinalGProfile.reduce((a, b) => a + b, 0) / features.longitudinalGProfile.length;
    const longGMax = Math.max(...features.longitudinalGProfile.map(Math.abs));
    const latGMean = features.lateralGProfile.reduce((a, b) => a + b, 0) / features.lateralGProfile.length;
    const latGMax = Math.max(...features.lateralGProfile.map(Math.abs));

    vector.push(longGMean);
    vector.push(longGMax);
    vector.push(latGMean);
    vector.push(latGMax);

    return vector;
  }

  /**
   * Compare two fingerprint vectors to calculate similarity score (cosine similarity).
   * Returns a value between -1 and 1, where 1 is identical and 0 is orthogonal.
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Fingerprint vectors must have the same length');
    }

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Compare two driver fingerprints and return similarity metrics
   */
  static compareFingerprints(
    fingerprintA: DriverFingerprint,
    fingerprintB: DriverFingerprint
  ): {
    similarity: number;
    differences: {
      throttle: number;
      brake: number;
      steering: number;
      speed: number;
      consistency: number;
      smoothness: number;
      aggression: number;
    };
    styleComparison: {
      cornering: string;
      braking: string;
      throttle: string;
    };
  } {
    const similarity = this.cosineSimilarity(
      fingerprintA.fingerprintVector,
      fingerprintB.fingerprintVector
    );

    const differences = {
      throttle: Math.abs(fingerprintA.averageThrottle - fingerprintB.averageThrottle),
      brake: Math.abs(fingerprintA.averageBrake - fingerprintB.averageBrake),
      steering: Math.abs(fingerprintA.averageSteeringAngle - fingerprintB.averageSteeringAngle),
      speed: Math.abs(fingerprintA.avgSpeed - fingerprintB.avgSpeed),
      consistency: Math.abs(fingerprintA.consistency - fingerprintB.consistency),
      smoothness: Math.abs(fingerprintA.smoothness - fingerprintB.smoothness),
      aggression: Math.abs(fingerprintA.aggression - fingerprintB.aggression),
    };

    const styleComparison = {
      cornering: `${fingerprintA.corneringStyle} vs ${fingerprintB.corneringStyle}`,
      braking: `${fingerprintA.brakingStyle} vs ${fingerprintB.brakingStyle}`,
      throttle: `${fingerprintA.throttleStyle} vs ${fingerprintB.throttleStyle}`,
    };

    return {
      similarity,
      differences,
      styleComparison,
    };
  }
}

/**
 * Continuous learning fingerprint manager
 * Maintains and updates fingerprints as new telemetry arrives
 */
export class ContinuousFingerprintManager {
  private fingerprints: Map<string, DriverFingerprint> = new Map();
  private telemetryBuffer: Map<string, FingerprintTelemetryPoint[]> = new Map();
  private config: FingerprintConfig;

  constructor(config: FingerprintConfig = {}) {
    this.config = config;
  }

  /**
   * Add new telemetry points and update fingerprints incrementally
   */
  addTelemetry(points: FingerprintTelemetryPoint[]): void {
    for (const point of points) {
      if (!point.driverId) continue;

      if (!this.telemetryBuffer.has(point.driverId)) {
        this.telemetryBuffer.set(point.driverId, []);
      }

      this.telemetryBuffer.get(point.driverId)!.push(point);
    }

    // Update fingerprints when buffer reaches threshold
    this.updateFingerprints();
  }

  /**
   * Update fingerprints from buffered telemetry
   */
  private updateFingerprints(): void {
    for (const [driverId, points] of this.telemetryBuffer.entries()) {
      if (points.length < (this.config.minSamplesForFingerprint ?? 50)) {
        continue;
      }

      // Get existing fingerprint or create new one
      const existingFingerprint = this.fingerprints.get(driverId);
      const allPoints = existingFingerprint
        ? [...this.getStoredPoints(driverId), ...points]
        : points;

      // Recompute fingerprint with all data
      const generator = new DriverFingerprintGenerator(allPoints, this.config);
      const newFingerprints = generator.computeDriverFingerprints();

      if (newFingerprints.has(driverId)) {
        this.fingerprints.set(driverId, newFingerprints.get(driverId)!);
        // Clear buffer for this driver
        this.telemetryBuffer.set(driverId, []);
      }
    }
  }

  /**
   * Get stored points for a driver (would be from persistent storage in production)
   */
  private getStoredPoints(driverId: string): FingerprintTelemetryPoint[] {
    // In production, this would fetch from database
    // For now, return empty array (fresh start each session)
    return [];
  }

  /**
   * Get current fingerprint for a driver
   */
  getFingerprint(driverId: string): DriverFingerprint | undefined {
    return this.fingerprints.get(driverId);
  }

  /**
   * Get all fingerprints
   */
  getAllFingerprints(): Map<string, DriverFingerprint> {
    return new Map(this.fingerprints);
  }

  /**
   * Force recomputation of all fingerprints
   */
  recomputeAll(): void {
    const allPoints: FingerprintTelemetryPoint[] = [];
    for (const points of this.telemetryBuffer.values()) {
      allPoints.push(...points);
    }

    const generator = new DriverFingerprintGenerator(allPoints, this.config);
    this.fingerprints = generator.computeDriverFingerprints();
  }
}

// Example usage and exports
export default DriverFingerprintGenerator;

