// src/lib/mockDemoData.ts
// Comprehensive demo data generator for demo mode
// Generates data for all 7 AI agents, time series, and tire predictions for all tracks
//
// NOTE: For comprehensive demo data with all API integrations (Weather, AI Analytics,
// Google Maps, Hugging Face, Twilio, Slack, F1, Computer Vision, Driver Fingerprinting,
// Anomaly Detection), see src/lib/comprehensiveMockData.ts

import type { AgentDecision } from "@/components/pitwall/AIAgentDecisions";

// Configuration interface for demo data generation
export interface DemoDataConfig {
  seed?: number; // Seed for deterministic random generation
  enableCache?: boolean; // Enable caching of generated data
  cacheExpiryMs?: number; // Cache expiry time in milliseconds
  tireDegradationRate?: number; // Base tire degradation rate per lap
  lapTimeBase?: number; // Base lap time in seconds
  lapTimeVariation?: number; // Lap time variation range
  enableRealisticPatterns?: boolean; // Use realistic racing patterns
}

// Default configuration
const DEFAULT_CONFIG: Required<DemoDataConfig> = {
  seed: 12345,
  enableCache: true,
  cacheExpiryMs: 5 * 60 * 1000, // 5 minutes
  tireDegradationRate: 2.5,
  lapTimeBase: 90,
  lapTimeVariation: 2,
  enableRealisticPatterns: true,
};

// Seeded random number generator for consistent data
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  nextInRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  choice<T>(array: T[]): T {
    return array[this.nextInt(array.length)];
  }
}

// Cache for generated demo data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DemoDataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private expiryMs: number;

  constructor(expiryMs: number) {
    this.expiryMs = expiryMs;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > this.expiryMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  generateKey(prefix: string, ...args: any[]): string {
    return `${prefix}:${args.join(':')}`;
  }
}

// Global cache instance
let globalCache: DemoDataCache | null = null;

function getCache(config: DemoDataConfig): DemoDataCache | null {
  if (!config.enableCache) return null;
  if (!globalCache) {
    globalCache = new DemoDataCache(config.cacheExpiryMs ?? DEFAULT_CONFIG.cacheExpiryMs);
  }
  return globalCache;
}

export interface DemoTelemetryPoint {
  timestamp: string;
  vehicle_id: string;
  vehicle_number: number;
  lap: number;
  lapdist_m: number;
  track_total_m: number;
  Speed: number;
  gear: number;
  nmot: number;
  aps: number;
  pbrake_f: number;
  pbrake_r: number;
  accx_can: number;
  accy_can: number;
  Steering_Angle: number;
  VBOX_Long_Minutes: number;
  VBOX_Lat_Min: number;
  AIR_TEMP: number;
  TRACK_TEMP: number;
  HUMIDITY: number;
  WIND_SPEED: number;
  RAIN: number;
}

export interface DemoTirePrediction {
  chassis: string;
  track: string;
  vehicle_number: number;
  lap: number;
  front_left: number;
  front_right: number;
  rear_left: number;
  rear_right: number;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap: number;
  confidence: number;
  feature_scores: Array<{ name: string; score: number }>;
  explanation: string[];
}

export interface DemoTimeSeriesData {
  timestamp: string;
  track: string;
  vehicle_number: number;
  lap: number;
  speed: number;
  tire_wear_front_left: number;
  tire_wear_front_right: number;
  tire_wear_rear_left: number;
  tire_wear_rear_right: number;
  gap_to_leader: number;
  position: number;
  predicted_finish: string;
}

const TRACKS = [
  { id: "cota", name: "Circuit of the Americas", length: 5513, turns: 20 },
  { id: "sebring", name: "Sebring International", length: 6019, turns: 17 },
  { id: "sonoma", name: "Sonoma Raceway", length: 4054, turns: 12 },
  { id: "barber", name: "Barber Motorsports Park", length: 3830, turns: 17 },
  { id: "vir", name: "Virginia International", length: 5263, turns: 17 },
  { id: "indianapolis", name: "Indianapolis Motor Speedway", length: 3924, turns: 14 },
  { id: "road-america", name: "Road America", length: 6515, turns: 14 },
];

const VEHICLES = [7, 13, 21, 22, 46, 47, 78, 88];

const AGENT_TYPES = [
  "strategy",
  "coach",
  "anomaly_detective",
  "predictor",
  "simulator",
  "explainer",
  "eda",
];

// Generate realistic timestamps
function generateTimestamp(baseTime: Date, offsetSeconds: number): string {
  const time = new Date(baseTime.getTime() + offsetSeconds * 1000);
  return time.toISOString();
}

// Realistic tire degradation curve (exponential decay with acceleration)
function calculateTireWear(
  lap: number,
  baseWear: number,
  degradationRate: number,
  rng: SeededRandom,
  config: Required<DemoDataConfig>
): number {
  if (!config.enableRealisticPatterns) {
    return baseWear + (lap * degradationRate) + rng.next() * 5;
  }

  // Exponential degradation: wear increases faster as tires get older
  const exponentialFactor = 1 + (lap / 30) * 0.3; // 30% faster degradation by lap 30
  const baseDegradation = lap * degradationRate * exponentialFactor;
  const variation = rng.next() * 3 - 1.5; // ±1.5% variation
  return Math.min(100, Math.max(0, baseWear + baseDegradation + variation));
}

// Realistic lap time calculation with tire degradation impact
function calculateLapTime(
  baseLapTime: number,
  tireWear: number,
  lap: number,
  rng: SeededRandom,
  config: Required<DemoDataConfig>
): number {
  if (!config.enableRealisticPatterns) {
    return baseLapTime + rng.next() * config.lapTimeVariation;
  }

  // Tire wear impact: 0.01s per 1% wear above 50%
  const tirePenalty = Math.max(0, (tireWear - 50) * 0.01);
  
  // Driver consistency: slight improvement over first few laps, then degradation
  const consistencyFactor = lap < 5 ? -0.1 : (lap - 5) * 0.02;
  
  // Random variation
  const variation = (rng.next() - 0.5) * config.lapTimeVariation;
  
  return baseLapTime + tirePenalty + consistencyFactor + variation;
}

// Generate AI Agent Decisions for all 7 agents
export function generateAgentDecisions(
  trackId: string,
  vehicleNumber: number,
  baseTime: Date = new Date(),
  config: DemoDataConfig = {}
): AgentDecision[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const cache = getCache(fullConfig);
  const cacheKey = cache?.generateKey('agentDecisions', trackId, vehicleNumber, baseTime.getTime());
  
  if (cache && cacheKey) {
    const cached = cache.get<AgentDecision[]>(cacheKey);
    if (cached) return cached;
  }

  const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
  const rng = new SeededRandom(fullConfig.seed + trackId.charCodeAt(0) + vehicleNumber);
  const decisions: AgentDecision[] = [];
  let decisionId = 1;

  // Strategy Agent - Pit recommendations
  for (let lap = 5; lap <= 25; lap += 5) {
    const tireWear = calculateTireWear(lap, 50, fullConfig.tireDegradationRate, rng, fullConfig);
    if (tireWear > 70) {
      decisions.push({
        decision_id: `strategy-${trackId}-${vehicleNumber}-${decisionId++}`,
        agent_id: "strategy-01",
        agent_type: "strategist",
        track: trackId,
        chassis: `GR86-${vehicleNumber}`,
        vehicle_number: vehicleNumber,
        timestamp: generateTimestamp(baseTime, lap * fullConfig.lapTimeBase),
        decision_type: "pit",
        action: `Recommend pit stop on lap ${lap + 2} for tire change`,
        confidence: 0.85 + rng.next() * 0.1,
        risk_level: tireWear > 80 ? "critical" : "moderate",
        reasoning: [
          `Tire wear at ${Math.round(tireWear)}% on lap ${lap}`,
          `Optimal pit window: Laps ${lap + 1} to ${lap + 3}`,
          `Predicted time loss: ${((tireWear - 70) * 0.1).toFixed(2)}s per lap`,
          `Competitor analysis: ${rng.next() > 0.5 ? "Undercut opportunity" : "Maintain position"}`,
        ],
        evidence: {
          tire_wear_front_left: tireWear,
          tire_wear_rear_right: tireWear - 5,
          laps_remaining: 30 - lap,
          gap_to_leader: 2.5 + rng.next() * 5,
        },
        alternatives: [
          {
            action: `Stay out until lap ${lap + 5}`,
            risk: "aggressive",
            rationale: "Higher tire degradation but track position advantage",
          },
        ],
      });
    }
  }

  // Coach Agent - Driver feedback
  for (let lap = 3; lap <= 20; lap += 4) {
    const issues = [
      "Early braking in Turn 3",
      "Late apex in Turn 7",
      "Aggressive throttle application",
      "Smooth cornering improvement needed",
    ];
    const issue = rng.choice(issues);
    
    const sector1 = 25 + rng.next() * 2;
    const sector2 = 40 + rng.next() * 3;
    const sector3 = 28 + rng.next() * 2;
    const consistency = 85 + rng.next() * 10;
    
    decisions.push({
      decision_id: `coach-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "coach-01",
      agent_type: "coach",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * fullConfig.lapTimeBase),
      decision_type: "coach",
      action: `Driver coaching: ${issue}`,
      confidence: 0.75 + rng.next() * 0.15,
      risk_level: "safe",
      reasoning: [
        `Lap ${lap} analysis: ${issue}`,
        `Potential time gain: ${(0.1 + rng.next() * 0.3).toFixed(2)}s per lap`,
        `Consistency score: ${consistency.toFixed(1)}%`,
        `Sector breakdown: S1 ${sector1.toFixed(2)}s, S2 ${sector2.toFixed(2)}s, S3 ${sector3.toFixed(2)}s`,
      ],
      evidence: {
        sector_times: {
          s1: sector1,
          s2: sector2,
          s3: sector3,
        },
        consistency: consistency,
      },
    });
  }

  // Anomaly Detective - Safety alerts
  if (rng.next() > 0.7) {
    const anomalies = [
      "Brake lockup detected in Turn 5",
      "Unusual steering input pattern",
      "Temperature spike in rear tires",
      "GPS signal anomaly detected",
    ];
    const anomaly = rng.choice(anomalies);
    
    decisions.push({
      decision_id: `anomaly-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "anomaly-01",
      agent_type: "anomaly_detective",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 10 * fullConfig.lapTimeBase),
      decision_type: "anomaly",
      action: `Safety alert: ${anomaly}`,
      confidence: 0.9 + rng.next() * 0.1,
      risk_level: "critical",
      reasoning: [
        anomaly,
        `Detected at lap 10, sector 2`,
        `Recommend immediate driver communication`,
        `Monitor for next 3 laps`,
      ],
      evidence: {
        anomaly_type: anomaly.split(" ")[0].toLowerCase(),
        severity: "high",
        lap: 10,
      },
    });
  }

  // Predictor Agent - Tire predictions
  for (let lap = 8; lap <= 22; lap += 3) {
    const tireWear = calculateTireWear(lap, 40, fullConfig.tireDegradationRate, rng, fullConfig);
    const predictedLoss = 0.05 + ((tireWear - 50) * 0.01);
    const lapsUntilLoss = Math.max(1, Math.round((75 - tireWear) / fullConfig.tireDegradationRate));
    const modelConfidence = 88 + rng.next() * 10;
    
    decisions.push({
      decision_id: `predictor-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "predictor-01",
      agent_type: "predictor",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * fullConfig.lapTimeBase),
      decision_type: "prediction",
      action: `Tire wear prediction: ${Math.round(tireWear)}% at lap ${lap}`,
      confidence: 0.88 + rng.next() * 0.1,
      risk_level: tireWear > 75 ? "moderate" : "safe",
      reasoning: [
        `Current tire wear: ${Math.round(tireWear)}%`,
        `Predicted loss per lap: ${predictedLoss.toFixed(3)}s`,
        `Laps until 0.5s loss: ${lapsUntilLoss}`,
        `Model confidence: ${modelConfidence.toFixed(1)}%`,
      ],
      evidence: {
        tire_wear: tireWear,
        predicted_laps_remaining: lapsUntilLoss,
        model_version: "v2.1",
      },
    });
  }

  // Simulator Agent - Strategy scenarios
  if (rng.next() > 0.5) {
    const winProb = 0.1 + rng.next() * 0.1;
    decisions.push({
      decision_id: `simulator-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "simulator-01",
      agent_type: "simulator",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 12 * fullConfig.lapTimeBase),
      decision_type: "strategy",
      action: "Strategy simulation: 2-stop vs 1-stop analysis",
      confidence: 0.82 + rng.next() * 0.1,
      risk_level: "moderate",
      reasoning: [
        "Simulated 1000 race scenarios",
        "2-stop strategy: P3 finish (avg), 15% win probability",
        "1-stop strategy: P5 finish (avg), 5% win probability",
        "Recommendation: 2-stop for optimal position",
      ],
      evidence: {
        scenarios_tested: 1000,
        optimal_strategy: "2-stop",
        win_probability: winProb,
      },
    });
  }

  // Explainer Agent - AI explanations
  for (let lap = 6; lap <= 18; lap += 6) {
    const tireStress = 0.3 + rng.next() * 0.1;
    const trackTemp = 0.25 + rng.next() * 0.1;
    const driverConsistency = 0.2 + rng.next() * 0.1;
    const sectorTimes = 0.15 + rng.next() * 0.1;
    const confidenceInterval = 0.05 + rng.next() * 0.1;
    
    decisions.push({
      decision_id: `explainer-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "explainer-01",
      agent_type: "explainer",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * fullConfig.lapTimeBase),
      decision_type: "strategy",
      action: "AI decision explanation and confidence intervals",
      confidence: 0.92 + rng.next() * 0.08,
      risk_level: "safe",
      reasoning: [
        `Feature attribution for lap ${lap} prediction:`,
        `- Tire stress: ${(tireStress * 100).toFixed(0)}% contribution`,
        `- Track temperature: ${(trackTemp * 100).toFixed(0)}% contribution`,
        `- Driver consistency: ${(driverConsistency * 100).toFixed(0)}% contribution`,
        `- Sector times: ${(sectorTimes * 100).toFixed(0)}% contribution`,
        `Confidence interval: ±${confidenceInterval.toFixed(3)}s`,
      ],
      evidence: {
        feature_attribution: {
          tire_stress: tireStress,
          track_temp: trackTemp,
          driver_consistency: driverConsistency,
          sector_times: sectorTimes,
        },
        confidence_interval: confidenceInterval,
      },
    });
  }

  // EDA Agent - Data insights
  if (rng.next() > 0.6) {
    const cluster = 1 + rng.nextInt(3);
    decisions.push({
      decision_id: `eda-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "eda-01",
      agent_type: "eda",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 15 * fullConfig.lapTimeBase),
      decision_type: "strategy",
      action: "EDA insights: Performance clustering and patterns",
      confidence: 0.78 + rng.next() * 0.15,
      risk_level: "safe",
      reasoning: [
        "Clustered 5000 telemetry points into 3 performance groups",
        `Vehicle in Cluster ${cluster}: ${cluster === 1 ? 'Elite' : cluster === 2 ? 'Consistent mid-pack' : 'Developing'} performance`,
        "Pattern detected: Strong sector 1, weak sector 3",
        "Recommendation: Focus on sector 3 optimization",
      ],
      evidence: {
        clusters_identified: 3,
        current_cluster: cluster,
        data_points_analyzed: 5000,
      },
    });
  }

  if (cache && cacheKey) {
    cache.set(cacheKey, decisions);
  }

  return decisions;
}

// Generate time series telemetry data
export function generateTimeSeriesData(
  trackId: string,
  vehicleNumber: number,
  numPoints: number = 100,
  baseTime: Date = new Date(),
  config: DemoDataConfig = {}
): DemoTimeSeriesData[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const cache = getCache(fullConfig);
  const cacheKey = cache?.generateKey('timeSeries', trackId, vehicleNumber, numPoints, baseTime.getTime());
  
  if (cache && cacheKey) {
    const cached = cache.get<DemoTimeSeriesData[]>(cacheKey);
    if (cached) return cached;
  }

  const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
  const rng = new SeededRandom(fullConfig.seed + trackId.charCodeAt(0) + vehicleNumber + numPoints);
  const data: DemoTimeSeriesData[] = [];
  
  let currentLap = 1;
  let lapProgress = 0;
  let tireWearFL = 45;
  let tireWearFR = 47;
  let tireWearRL = 43;
  let tireWearRR = 45;
  let gapToLeader = 2.5 + rng.next() * 3;
  const position = 3 + rng.nextInt(5);
  const baseSpeed = 120 + rng.next() * 20; // Vehicle-specific base speed

  for (let i = 0; i < numPoints; i++) {
    const timestamp = generateTimestamp(baseTime, i * 0.5);
    
    // Update lap progress
    lapProgress += (track.length / numPoints); // Progress through lap
    if (lapProgress >= track.length) {
      lapProgress = 0;
      currentLap++;
      // Tire wear increases per lap using realistic degradation
      tireWearFL = calculateTireWear(currentLap, 45, fullConfig.tireDegradationRate, rng, fullConfig);
      tireWearFR = calculateTireWear(currentLap, 47, fullConfig.tireDegradationRate, rng, fullConfig);
      tireWearRL = calculateTireWear(currentLap, 43, fullConfig.tireDegradationRate * 0.92, rng, fullConfig);
      tireWearRR = calculateTireWear(currentLap, 45, fullConfig.tireDegradationRate * 0.92, rng, fullConfig);
    }

    // Simulate gap changes with realistic patterns
    if (fullConfig.enableRealisticPatterns) {
      // Gap tends to increase slightly over time due to tire degradation
      const degradationImpact = (tireWearFL - 45) * 0.01;
      gapToLeader += (rng.next() - 0.5) * 0.2 + degradationImpact;
    } else {
      gapToLeader += (rng.next() - 0.5) * 0.2;
    }
    gapToLeader = Math.max(0, gapToLeader);

    // Speed varies based on track position and tire wear
    const speedVariation = fullConfig.enableRealisticPatterns
      ? baseSpeed - (tireWearFL - 45) * 0.2 + (rng.next() - 0.5) * 10
      : baseSpeed + (rng.next() - 0.5) * 20;

    data.push({
      timestamp,
      track: trackId,
      vehicle_number: vehicleNumber,
      lap: currentLap,
      speed: Math.max(80, Math.min(180, speedVariation)),
      tire_wear_front_left: Math.min(100, Math.max(0, tireWearFL + (rng.next() - 0.5) * 2)),
      tire_wear_front_right: Math.min(100, Math.max(0, tireWearFR + (rng.next() - 0.5) * 2)),
      tire_wear_rear_left: Math.min(100, Math.max(0, tireWearRL + (rng.next() - 0.5) * 2)),
      tire_wear_rear_right: Math.min(100, Math.max(0, tireWearRR + (rng.next() - 0.5) * 2)),
      gap_to_leader: Math.max(0, gapToLeader),
      position: position,
      predicted_finish: `P${position}`,
    });
  }

  if (cache && cacheKey) {
    cache.set(cacheKey, data);
  }

  return data;
}

// Generate tire prediction data
export function generateTirePredictions(
  trackId: string,
  vehicleNumber: number,
  baseTime: Date = new Date(),
  config: DemoDataConfig = {}
): DemoTirePrediction[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const cache = getCache(fullConfig);
  const cacheKey = cache?.generateKey('tirePredictions', trackId, vehicleNumber, baseTime.getTime());
  
  if (cache && cacheKey) {
    const cached = cache.get<DemoTirePrediction[]>(cacheKey);
    if (cached) return cached;
  }

  const rng = new SeededRandom(fullConfig.seed + trackId.charCodeAt(0) + vehicleNumber);
  const predictions: DemoTirePrediction[] = [];
  
  for (let lap = 5; lap <= 25; lap += 2) {
    const baseWear = 40 + (lap * fullConfig.tireDegradationRate);
    const frontLeft = calculateTireWear(lap, 40, fullConfig.tireDegradationRate, rng, fullConfig);
    const frontRight = calculateTireWear(lap, 41, fullConfig.tireDegradationRate, rng, fullConfig);
    const rearLeft = calculateTireWear(lap, 38, fullConfig.tireDegradationRate * 0.92, rng, fullConfig);
    const rearRight = calculateTireWear(lap, 39, fullConfig.tireDegradationRate * 0.92, rng, fullConfig);
    const avgWear = (frontLeft + frontRight + rearLeft + rearRight) / 4;
    
    const predictedLoss = 0.05 + ((avgWear - 50) * 0.01);
    const lapsUntilLoss = Math.max(1, Math.round((75 - avgWear) / fullConfig.tireDegradationRate));
    const recommendedPit = avgWear > 70 ? lap + 2 : lap + 5;

    const tireStress = 0.3 + rng.next() * 0.1;
    const trackTemp = 0.25 + rng.next() * 0.1;
    const driverConsistency = 0.2 + rng.next() * 0.1;
    const sectorTimes = 0.15 + rng.next() * 0.1;

    predictions.push({
      chassis: `GR86-${vehicleNumber}`,
      track: trackId,
      vehicle_number: vehicleNumber,
      lap: lap,
      front_left: Math.min(100, Math.max(0, frontLeft)),
      front_right: Math.min(100, Math.max(0, frontRight)),
      rear_left: Math.min(100, Math.max(0, rearLeft)),
      rear_right: Math.min(100, Math.max(0, rearRight)),
      predicted_loss_per_lap_s: Math.max(0, predictedLoss),
      laps_until_0_5s_loss: lapsUntilLoss,
      recommended_pit_lap: recommendedPit,
      confidence: 0.85 + rng.next() * 0.1,
      feature_scores: [
        { name: "tire_stress", score: tireStress },
        { name: "track_temp", score: trackTemp },
        { name: "driver_consistency", score: driverConsistency },
        { name: "sector_times", score: sectorTimes },
      ],
      explanation: [
        `Tire wear analysis for lap ${lap}`,
        `Average wear: ${avgWear.toFixed(1)}%`,
        `Predicted time loss: ${predictedLoss.toFixed(3)}s per lap`,
        `Optimal pit window: Laps ${recommendedPit - 1} to ${recommendedPit + 1}`,
      ],
    });
  }

  if (cache && cacheKey) {
    cache.set(cacheKey, predictions);
  }

  return predictions;
}

// Generate comprehensive demo data for all tracks
export function generateAllTracksDemoData(config: DemoDataConfig = {}): {
  agentDecisions: Record<string, AgentDecision[]>;
  timeSeries: Record<string, DemoTimeSeriesData[]>;
  tirePredictions: Record<string, DemoTirePrediction[]>;
  telemetry: Record<string, DemoTelemetryPoint[]>;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const cache = getCache(fullConfig);
  const cacheKey = cache?.generateKey('allTracksData', JSON.stringify(config));
  
  if (cache && cacheKey) {
    const cached = cache.get<ReturnType<typeof generateAllTracksDemoData>>(cacheKey);
    if (cached) return cached;
  }

  const agentDecisions: Record<string, AgentDecision[]> = {};
  const timeSeries: Record<string, DemoTimeSeriesData[]> = {};
  const tirePredictions: Record<string, DemoTirePrediction[]> = {};
  const telemetry: Record<string, DemoTelemetryPoint[]> = {};

  const baseTime = new Date();
  const rng = new SeededRandom(fullConfig.seed);

  for (const track of TRACKS) {
    const trackKey = track.id;
    agentDecisions[trackKey] = [];
    timeSeries[trackKey] = [];
    tirePredictions[trackKey] = [];
    telemetry[trackKey] = [];

    for (const vehicle of VEHICLES) {
      // Generate agent decisions
      const decisions = generateAgentDecisions(track.id, vehicle, baseTime, fullConfig);
      agentDecisions[trackKey].push(...decisions);

      // Generate time series
      const series = generateTimeSeriesData(track.id, vehicle, 200, baseTime, fullConfig);
      timeSeries[trackKey].push(...series);

      // Generate tire predictions
      const predictions = generateTirePredictions(track.id, vehicle, baseTime, fullConfig);
      tirePredictions[trackKey].push(...predictions);

      // Generate telemetry points with realistic patterns
      const vehicleRng = new SeededRandom(fullConfig.seed + track.id.charCodeAt(0) + vehicle);
      const baseSpeed = 120 + vehicleRng.next() * 20;
      const baseRPM = 5000 + vehicleRng.next() * 2000;
      
      for (let i = 0; i < 100; i++) {
        const lap = Math.floor(i / 10) + 1;
        const lapdist = ((i % 10) / 10) * track.length;
        const isBraking = vehicleRng.next() > 0.7;
        const isCornering = vehicleRng.next() > 0.6;
        
        telemetry[trackKey].push({
          timestamp: generateTimestamp(baseTime, i * 0.5),
          vehicle_id: `GR86-${vehicle}`,
          vehicle_number: vehicle,
          lap: lap,
          lapdist_m: lapdist,
          track_total_m: track.length,
          Speed: Math.max(80, Math.min(180, baseSpeed + (vehicleRng.next() - 0.5) * 20)),
          gear: isCornering ? 3 + vehicleRng.nextInt(2) : 4 + vehicleRng.nextInt(2),
          nmot: Math.max(3000, Math.min(7000, baseRPM + (vehicleRng.next() - 0.5) * 1000)),
          aps: isBraking ? 0 : 50 + vehicleRng.next() * 50,
          pbrake_f: isBraking ? 20 + vehicleRng.next() * 30 : 0,
          pbrake_r: isBraking ? 15 + vehicleRng.next() * 25 : 0,
          accx_can: isBraking ? -2 - vehicleRng.next() * 2 : -1 + vehicleRng.next() * 2,
          accy_can: isCornering ? -1.5 + vehicleRng.next() * 3 : -0.5 + vehicleRng.next() * 1,
          Steering_Angle: isCornering ? -30 + vehicleRng.next() * 60 : -5 + vehicleRng.next() * 10,
          VBOX_Long_Minutes: vehicleRng.next(),
          VBOX_Lat_Min: vehicleRng.next(),
          AIR_TEMP: 25 + vehicleRng.next() * 5,
          TRACK_TEMP: 35 + vehicleRng.next() * 10,
          HUMIDITY: 50 + vehicleRng.next() * 20,
          WIND_SPEED: 5 + vehicleRng.next() * 10,
          RAIN: 0,
        });
      }
    }
  }

  const result = {
    agentDecisions,
    timeSeries,
    tirePredictions,
    telemetry,
  };

  if (cache && cacheKey) {
    cache.set(cacheKey, result);
  }

  return result;
}

// Get demo data for a specific track
export function getTrackDemoData(trackId: string, config: DemoDataConfig = {}) {
  const allData = generateAllTracksDemoData(config);
  
  return {
    agentDecisions: allData.agentDecisions[trackId] || [],
    timeSeries: allData.timeSeries[trackId] || [],
    tirePredictions: allData.tirePredictions[trackId] || [],
    telemetry: allData.telemetry[trackId] || [],
  };
}

// Utility function to clear demo data cache
export function clearDemoDataCache(): void {
  if (globalCache) {
    globalCache.clear();
  }
}

// Export default configuration for external use
export { DEFAULT_CONFIG };

// Agent System Demo Data
export interface DemoAgent {
  id: string;
  status: 'active' | 'idle' | 'error';
  types?: string[];
  tracks?: string[];
  capacity?: number;
}

export interface DemoInsight {
  insight_id: string;
  decision_id?: string;
  track: string;
  chassis: string;
  created_at: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  type?: string;
  decision_type?: string;
  agent_id?: string;
  agent_type?: string;
  action?: string;
  confidence?: number;
  risk_level?: string;
  reasoning?: string[];
  evidence?: Record<string, unknown>;
  alternatives?: Array<{
    action: string;
    risk: string;
    rationale: string;
  }>;
  predictions?: {
    predicted_loss_per_lap_seconds?: number;
    laps_until_0_5s_loss?: number;
    [key: string]: string | number | undefined;
  };
  explanation?: {
    top_features?: Array<{
      name: string;
      value: number | string;
    }>;
  };
}

export interface DemoQueueStats {
  tasksLength?: number;
  resultsLength?: number;
  inboxLengths?: Array<{
    agentId: string;
    length: number;
  }>;
}

// Generate demo agents
export function generateDemoAgents(config: DemoDataConfig = {}): DemoAgent[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new SeededRandom(fullConfig.seed);
  const agents: DemoAgent[] = [];
  
  for (let i = 0; i < AGENT_TYPES.length; i++) {
    const agentType = AGENT_TYPES[i];
    const statuses: ('active' | 'idle' | 'error')[] = ['active', 'active', 'idle', 'idle'];
    const status = statuses[i % statuses.length] || 'active';
    const numTracks = 2 + rng.nextInt(3);
    
    agents.push({
      id: `${agentType}-${String(i + 1).padStart(2, '0')}`,
      status,
      types: [agentType],
      tracks: TRACKS.slice(0, numTracks).map(t => t.id),
      capacity: 1 + rng.nextInt(3),
    });
  }
  
  return agents;
}

// Generate demo insights from agent decisions
export function generateDemoInsights(
  numInsights: number = 15,
  baseTime: Date = new Date(),
  config: DemoDataConfig = {}
): DemoInsight[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new SeededRandom(fullConfig.seed + numInsights);
  const insights: DemoInsight[] = [];
  const track = rng.choice(TRACKS);
  const vehicle = rng.choice(VEHICLES);
  
  const priorities: Array<'critical' | 'high' | 'normal' | 'low'> = ['critical', 'high', 'normal', 'normal', 'low'];
  const agentTypes = [...AGENT_TYPES];
  
  for (let i = 0; i < numInsights; i++) {
    const agentType = agentTypes[i % agentTypes.length];
    const priority = rng.choice(priorities);
    const lap = 5 + rng.nextInt(20);
    const timestamp = generateTimestamp(baseTime, -(numInsights - i) * 30);
    
    const tireWear = calculateTireWear(lap, 45, fullConfig.tireDegradationRate, rng, fullConfig);
    const predictedLoss = 0.05 + ((tireWear - 50) * 0.01);
    const lapsUntilLoss = Math.max(1, Math.round((75 - tireWear) / fullConfig.tireDegradationRate));
    
    let action = '';
    let decisionType = '';
    
    switch (agentType) {
      case 'strategy':
        action = `Recommend pit stop on lap ${lap + 2} for tire change`;
        decisionType = 'pit';
        break;
      case 'coach':
        action = `Driver coaching: ${rng.choice(['Early braking', 'Late apex', 'Smooth cornering'])}`;
        decisionType = 'coach';
        break;
      case 'anomaly_detective':
        action = `Safety alert: ${rng.choice(['Brake lockup detected', 'Unusual steering pattern', 'Temperature spike'])}`;
        decisionType = 'anomaly';
        break;
      case 'predictor':
        action = `Tire wear prediction: ${Math.round(tireWear)}% at lap ${lap}`;
        decisionType = 'prediction';
        break;
      case 'simulator':
        action = 'Strategy simulation: 2-stop vs 1-stop analysis';
        decisionType = 'strategy';
        break;
      case 'explainer':
        action = 'AI decision explanation and confidence intervals';
        decisionType = 'strategy';
        break;
      case 'eda':
        action = 'EDA insights: Performance clustering and patterns';
        decisionType = 'strategy';
        break;
    }
    
    const tireStress = 0.3 + rng.next() * 0.1;
    const trackTemp = 0.25 + rng.next() * 0.1;
    const driverConsistency = 0.2 + rng.next() * 0.1;
    const modelConfidence = 85 + rng.next() * 10;
    
    insights.push({
      insight_id: `${agentType}-${track.id}-${vehicle}-${i + 1}`,
      decision_id: `${agentType}-${track.id}-${vehicle}-${i + 1}`,
      track: track.id,
      chassis: `GR86-${vehicle}`,
      created_at: timestamp,
      priority,
      type: agentType,
      decision_type: decisionType,
      agent_id: `${agentType}-01`,
      agent_type: agentType,
      action,
      confidence: 0.75 + rng.next() * 0.2,
      risk_level: priority === 'critical' ? 'critical' : priority === 'high' ? 'moderate' : 'safe',
      reasoning: [
        `Lap ${lap} analysis: ${action}`,
        `Current tire wear: ${Math.round(tireWear)}%`,
        `Predicted time loss: ${predictedLoss.toFixed(3)}s per lap`,
        `Model confidence: ${modelConfidence.toFixed(1)}%`,
      ],
      predictions: {
        predicted_loss_per_lap_seconds: predictedLoss,
        laps_until_0_5s_loss: lapsUntilLoss,
      },
      explanation: {
        top_features: [
          { name: 'tire_stress', value: tireStress.toFixed(3) },
          { name: 'track_temp', value: trackTemp.toFixed(3) },
          { name: 'driver_consistency', value: driverConsistency.toFixed(3) },
        ],
      },
      evidence: {
        tire_wear: tireWear,
        lap: lap,
        vehicle_number: vehicle,
      },
    });
  }
  
  // Sort by created_at descending (newest first)
  return insights.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// Generate demo queue stats
export function generateDemoQueueStats(agents: DemoAgent[], config: DemoDataConfig = {}): DemoQueueStats {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new SeededRandom(fullConfig.seed);
  const tasksLength = 10 + rng.nextInt(50);
  const resultsLength = 5 + rng.nextInt(30);
  
  const inboxLengths = agents.map(agent => ({
    agentId: agent.id,
    length: rng.nextInt(20),
  }));
  
  return {
    tasksLength,
    resultsLength,
    inboxLengths,
  };
}

// Generate all agent system demo data
export function generateAgentSystemDemoData(config: DemoDataConfig = {}) {
  const agents = generateDemoAgents(config);
  const insights = generateDemoInsights(20, new Date(), config);
  const queueStats = generateDemoQueueStats(agents, config);
  
  return {
    agents,
    insights,
    queueStats,
  };
}

// Generate demo AgentStatusResponse for API fallback
export function generateDemoAgentStatusResponse(config: DemoDataConfig = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new SeededRandom(fullConfig.seed);
  const agents = generateDemoAgents(fullConfig);
  const queueStats = generateDemoQueueStats(agents, fullConfig);
  
  // Convert DemoAgent[] to Agent[] format matching AgentStatusResponse
  const convertedAgents = agents.map((agent, index) => ({
    id: agent.id,
    type: agent.types?.[0] || 'strategy',
    status: agent.status,
    registered_at: new Date(Date.now() - rng.next() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    tracks: agent.tracks || [],
  }));
  
  return {
    success: true,
    agents: convertedAgents,
    queues: {
      tasksLength: queueStats.tasksLength,
      resultsLength: queueStats.resultsLength,
      inboxLengths: queueStats.inboxLengths,
    },
    redis_available: true,
    timestamp: new Date().toISOString(),
  };
}

// Generate demo DashboardData for demo mode
export function generateDemoDashboardData(
  track: string,
  race: number,
  vehicle: number,
  lap: number,
  config: DemoDataConfig = {}
): import("@/api/pitwall").DashboardData {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const rng = new SeededRandom(fullConfig.seed + track.charCodeAt(0) + vehicle + lap);
  const trackInfo = TRACKS.find((t) => t.id === track) || TRACKS[0];
  
  const baseTireWear = calculateTireWear(lap, 45, fullConfig.tireDegradationRate, rng, fullConfig);
  const tireWearVariation = 3;
  const position = 1 + rng.nextInt(10);
  
  const frontLeft = Math.min(100, Math.max(0, baseTireWear + (rng.next() - 0.5) * tireWearVariation));
  const frontRight = Math.min(100, Math.max(0, baseTireWear + (rng.next() - 0.5) * tireWearVariation));
  const rearLeft = Math.min(100, Math.max(0, baseTireWear - 2 + (rng.next() - 0.5) * tireWearVariation));
  const rearRight = Math.min(100, Math.max(0, baseTireWear - 2 + (rng.next() - 0.5) * tireWearVariation));
  
  const currentLapTime = calculateLapTime(fullConfig.lapTimeBase, baseTireWear, lap, rng, fullConfig);
  const bestLapTime = fullConfig.lapTimeBase - 2 + rng.next() * 2;
  const gapToLeader = 1 + rng.next() * 5;
  
  return {
    track: track,
    race: race,
    vehicle_number: vehicle,
    lap: lap,
    total_laps: 30,
    tire_wear: {
      front_left: frontLeft,
      front_right: frontRight,
      rear_left: rearLeft,
      rear_right: rearRight,
      predicted_laps_remaining: Math.max(5, 30 - lap - Math.floor(baseTireWear / 10)),
      pit_window_optimal: [12, 13, 14, 15, 16],
      confidence: 0.85 + rng.next() * 0.1,
      model_version: "v2.1-demo",
    },
    performance: {
      current_lap: `${Math.floor(currentLapTime)}.${Math.floor((currentLapTime % 1) * 1000).toString().padStart(3, '0')}`,
      best_lap: `${Math.floor(bestLapTime)}.${Math.floor((bestLapTime % 1) * 1000).toString().padStart(3, '0')}`,
      gap_to_leader: `+${gapToLeader.toFixed(3)}s`,
      predicted_finish: `P${1 + rng.nextInt(5)}`,
      position: position,
      lap_number: lap,
      total_laps: 30,
    },
    gap_analysis: {
      position: position,
      gap_to_leader: `+${gapToLeader.toFixed(3)}s`,
      gap_to_ahead: rng.next() > 0.5 ? `+${(rng.next() * 2).toFixed(3)}s` : null,
      gap_to_behind: rng.next() > 0.5 ? `-${(rng.next() * 2).toFixed(3)}s` : null,
      overtaking_opportunity: rng.next() > 0.6,
      under_pressure: rng.next() > 0.7,
    },
    timestamp: new Date().toISOString(),
    live_data: false,
  };
}

// Export aliases for backward compatibility with "Demo" naming
export const generateAllTracksMockData = generateAllTracksDemoData;
export const getTrackMockData = getTrackDemoData;
export const generateAgentSystemMockData = generateAgentSystemDemoData;
export const generateMockInsights = generateDemoInsights;
export const generateMockQueueStats = generateDemoQueueStats;
export type MockTelemetryPoint = DemoTelemetryPoint;
export type MockTimeSeriesData = DemoTimeSeriesData;
export type MockTirePrediction = DemoTirePrediction;
export type MockAgent = DemoAgent;
export type MockInsight = DemoInsight;
export type MockQueueStats = DemoQueueStats;

