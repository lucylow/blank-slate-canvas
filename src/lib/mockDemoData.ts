// src/lib/mockDemoData.ts
// Comprehensive mock data generator for demo mode
// Generates data for all 7 AI agents, time series, and tire predictions for all tracks

import type { AgentDecision } from "@/components/pitwall/AIAgentDecisions";

export interface MockTelemetryPoint {
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

export interface MockTirePrediction {
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

export interface MockTimeSeriesData {
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

// Generate AI Agent Decisions for all 7 agents
export function generateAgentDecisions(
  trackId: string,
  vehicleNumber: number,
  baseTime: Date = new Date()
): AgentDecision[] {
  const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
  const decisions: AgentDecision[] = [];
  let decisionId = 1;

  // Strategy Agent - Pit recommendations
  for (let lap = 5; lap <= 25; lap += 5) {
    const tireWear = 50 + (lap * 2) + Math.random() * 10;
    if (tireWear > 70) {
      decisions.push({
        decision_id: `strategy-${trackId}-${vehicleNumber}-${decisionId++}`,
        agent_id: "strategy-01",
        agent_type: "strategist",
        track: trackId,
        chassis: `GR86-${vehicleNumber}`,
        vehicle_number: vehicleNumber,
        timestamp: generateTimestamp(baseTime, lap * 90),
        decision_type: "pit",
        action: `Recommend pit stop on lap ${lap + 2} for tire change`,
        confidence: 0.85 + Math.random() * 0.1,
        risk_level: tireWear > 80 ? "critical" : "moderate",
        reasoning: [
          `Tire wear at ${Math.round(tireWear)}% on lap ${lap}`,
          `Optimal pit window: Laps ${lap + 1} to ${lap + 3}`,
          `Predicted time loss: ${(tireWear - 70) * 0.1}s per lap`,
          `Competitor analysis: ${Math.random() > 0.5 ? "Undercut opportunity" : "Maintain position"}`,
        ],
        evidence: {
          tire_wear_front_left: tireWear,
          tire_wear_rear_right: tireWear - 5,
          laps_remaining: 30 - lap,
          gap_to_leader: 2.5 + Math.random() * 5,
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
    const issue = issues[Math.floor(Math.random() * issues.length)];
    
    decisions.push({
      decision_id: `coach-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "coach-01",
      agent_type: "coach",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * 90),
      decision_type: "coach",
      action: `Driver coaching: ${issue}`,
      confidence: 0.75 + Math.random() * 0.15,
      risk_level: "safe",
      reasoning: [
        `Lap ${lap} analysis: ${issue}`,
        `Potential time gain: ${(0.1 + Math.random() * 0.3).toFixed(2)}s per lap`,
        `Consistency score: ${(85 + Math.random() * 10).toFixed(1)}%`,
        `Sector breakdown: S1 ${(25 + Math.random() * 2).toFixed(2)}s, S2 ${(40 + Math.random() * 3).toFixed(2)}s, S3 ${(28 + Math.random() * 2).toFixed(2)}s`,
      ],
      evidence: {
        sector_times: {
          s1: 25 + Math.random() * 2,
          s2: 40 + Math.random() * 3,
          s3: 28 + Math.random() * 2,
        },
        consistency: 85 + Math.random() * 10,
      },
    });
  }

  // Anomaly Detective - Safety alerts
  if (Math.random() > 0.7) {
    const anomalies = [
      "Brake lockup detected in Turn 5",
      "Unusual steering input pattern",
      "Temperature spike in rear tires",
      "GPS signal anomaly detected",
    ];
    const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
    
    decisions.push({
      decision_id: `anomaly-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "anomaly-01",
      agent_type: "anomaly_detective",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 10 * 90),
      decision_type: "anomaly",
      action: `Safety alert: ${anomaly}`,
      confidence: 0.9 + Math.random() * 0.1,
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
    const tireWear = 40 + (lap * 2.5) + Math.random() * 8;
    decisions.push({
      decision_id: `predictor-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "predictor-01",
      agent_type: "predictor",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * 90),
      decision_type: "prediction",
      action: `Tire wear prediction: ${Math.round(tireWear)}% at lap ${lap}`,
      confidence: 0.88 + Math.random() * 0.1,
      risk_level: tireWear > 75 ? "moderate" : "safe",
      reasoning: [
        `Current tire wear: ${Math.round(tireWear)}%`,
        `Predicted loss per lap: ${(0.05 + (tireWear - 50) * 0.01).toFixed(3)}s`,
        `Laps until 0.5s loss: ${Math.max(1, Math.round((75 - tireWear) / 2.5))}`,
        `Model confidence: ${(88 + Math.random() * 10).toFixed(1)}%`,
      ],
      evidence: {
        tire_wear: tireWear,
        predicted_laps_remaining: Math.max(1, Math.round((75 - tireWear) / 2.5)),
        model_version: "v2.1",
      },
    });
  }

  // Simulator Agent - Strategy scenarios
  if (Math.random() > 0.5) {
    decisions.push({
      decision_id: `simulator-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "simulator-01",
      agent_type: "simulator",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 12 * 90),
      decision_type: "strategy",
      action: "Strategy simulation: 2-stop vs 1-stop analysis",
      confidence: 0.82 + Math.random() * 0.1,
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
        win_probability: 0.15,
      },
    });
  }

  // Explainer Agent - AI explanations
  for (let lap = 6; lap <= 18; lap += 6) {
    decisions.push({
      decision_id: `explainer-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "explainer-01",
      agent_type: "explainer",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, lap * 90),
      decision_type: "strategy",
      action: "AI decision explanation and confidence intervals",
      confidence: 0.92 + Math.random() * 0.08,
      risk_level: "safe",
      reasoning: [
        `Feature attribution for lap ${lap} prediction:`,
        `- Tire stress: 35% contribution`,
        `- Track temperature: 28% contribution`,
        `- Driver consistency: 22% contribution`,
        `- Sector times: 15% contribution`,
        `Confidence interval: ±${(0.05 + Math.random() * 0.1).toFixed(3)}s`,
      ],
      evidence: {
        feature_attribution: {
          tire_stress: 0.35,
          track_temp: 0.28,
          driver_consistency: 0.22,
          sector_times: 0.15,
        },
        confidence_interval: 0.05 + Math.random() * 0.1,
      },
    });
  }

  // EDA Agent - Data insights
  if (Math.random() > 0.6) {
    decisions.push({
      decision_id: `eda-${trackId}-${vehicleNumber}-${decisionId++}`,
      agent_id: "eda-01",
      agent_type: "eda",
      track: trackId,
      chassis: `GR86-${vehicleNumber}`,
      vehicle_number: vehicleNumber,
      timestamp: generateTimestamp(baseTime, 15 * 90),
      decision_type: "strategy",
      action: "EDA insights: Performance clustering and patterns",
      confidence: 0.78 + Math.random() * 0.15,
      risk_level: "safe",
      reasoning: [
        "Clustered 5000 telemetry points into 3 performance groups",
        "Vehicle in Cluster 2: Consistent mid-pack performance",
        "Pattern detected: Strong sector 1, weak sector 3",
        "Recommendation: Focus on sector 3 optimization",
      ],
      evidence: {
        clusters_identified: 3,
        current_cluster: 2,
        data_points_analyzed: 5000,
      },
    });
  }

  return decisions;
}

// Generate time series telemetry data
export function generateTimeSeriesData(
  trackId: string,
  vehicleNumber: number,
  numPoints: number = 100,
  baseTime: Date = new Date()
): MockTimeSeriesData[] {
  const track = TRACKS.find((t) => t.id === trackId) || TRACKS[0];
  const data: MockTimeSeriesData[] = [];
  
  let currentLap = 1;
  let lapProgress = 0;
  let tireWearFL = 45;
  let tireWearFR = 47;
  let tireWearRL = 43;
  let tireWearRR = 45;
  let gapToLeader = 2.5 + Math.random() * 3;
  const position = 3 + Math.floor(Math.random() * 5);

  for (let i = 0; i < numPoints; i++) {
    const timestamp = generateTimestamp(baseTime, i * 0.5);
    
    // Update lap progress
    lapProgress += (track.length / 100); // Progress through lap
    if (lapProgress >= track.length) {
      lapProgress = 0;
      currentLap++;
      // Tire wear increases per lap
      tireWearFL += 2.5 + Math.random() * 1;
      tireWearFR += 2.5 + Math.random() * 1;
      tireWearRL += 2.3 + Math.random() * 1;
      tireWearRR += 2.3 + Math.random() * 1;
    }

    // Simulate gap changes
    gapToLeader += (Math.random() - 0.5) * 0.2;
    gapToLeader = Math.max(0, gapToLeader);

    data.push({
      timestamp,
      track: trackId,
      vehicle_number: vehicleNumber,
      lap: currentLap,
      speed: 120 + Math.random() * 40,
      tire_wear_front_left: Math.min(100, tireWearFL + Math.random() * 2),
      tire_wear_front_right: Math.min(100, tireWearFR + Math.random() * 2),
      tire_wear_rear_left: Math.min(100, tireWearRL + Math.random() * 2),
      tire_wear_rear_right: Math.min(100, tireWearRR + Math.random() * 2),
      gap_to_leader: gapToLeader,
      position: position,
      predicted_finish: `P${position}`,
    });
  }

  return data;
}

// Generate tire prediction data
export function generateTirePredictions(
  trackId: string,
  vehicleNumber: number,
  baseTime: Date = new Date()
): MockTirePrediction[] {
  const predictions: MockTirePrediction[] = [];
  
  for (let lap = 5; lap <= 25; lap += 2) {
    const baseWear = 40 + (lap * 2.5);
    const frontLeft = baseWear + Math.random() * 5;
    const frontRight = baseWear + 1 + Math.random() * 5;
    const rearLeft = baseWear - 2 + Math.random() * 5;
    const rearRight = baseWear - 1 + Math.random() * 5;
    const avgWear = (frontLeft + frontRight + rearLeft + rearRight) / 4;
    
    const predictedLoss = 0.05 + ((avgWear - 50) * 0.01);
    const lapsUntilLoss = Math.max(1, Math.round((75 - avgWear) / 2.5));
    const recommendedPit = avgWear > 70 ? lap + 2 : lap + 5;

    predictions.push({
      chassis: `GR86-${vehicleNumber}`,
      track: trackId,
      vehicle_number: vehicleNumber,
      lap: lap,
      front_left: Math.min(100, frontLeft),
      front_right: Math.min(100, frontRight),
      rear_left: Math.min(100, rearLeft),
      rear_right: Math.min(100, rearRight),
      predicted_loss_per_lap_s: predictedLoss,
      laps_until_0_5s_loss: lapsUntilLoss,
      recommended_pit_lap: recommendedPit,
      confidence: 0.85 + Math.random() * 0.1,
      feature_scores: [
        { name: "tire_stress", score: 0.35 },
        { name: "track_temp", score: 0.28 },
        { name: "driver_consistency", score: 0.22 },
        { name: "sector_times", score: 0.15 },
      ],
      explanation: [
        `Tire wear analysis for lap ${lap}`,
        `Average wear: ${avgWear.toFixed(1)}%`,
        `Predicted time loss: ${predictedLoss.toFixed(3)}s per lap`,
        `Optimal pit window: Laps ${recommendedPit - 1} to ${recommendedPit + 1}`,
      ],
    });
  }

  return predictions;
}

// Generate comprehensive mock data for all tracks
export function generateAllTracksMockData(): {
  agentDecisions: Record<string, AgentDecision[]>;
  timeSeries: Record<string, MockTimeSeriesData[]>;
  tirePredictions: Record<string, MockTirePrediction[]>;
  telemetry: Record<string, MockTelemetryPoint[]>;
} {
  const agentDecisions: Record<string, AgentDecision[]> = {};
  const timeSeries: Record<string, MockTimeSeriesData[]> = {};
  const tirePredictions: Record<string, MockTirePrediction[]> = {};
  const telemetry: Record<string, MockTelemetryPoint[]> = {};

  const baseTime = new Date();

  for (const track of TRACKS) {
    const trackKey = track.id;
    agentDecisions[trackKey] = [];
    timeSeries[trackKey] = [];
    tirePredictions[trackKey] = [];
    telemetry[trackKey] = [];

    for (const vehicle of VEHICLES) {
      // Generate agent decisions
      const decisions = generateAgentDecisions(track.id, vehicle, baseTime);
      agentDecisions[trackKey].push(...decisions);

      // Generate time series
      const series = generateTimeSeriesData(track.id, vehicle, 200, baseTime);
      timeSeries[trackKey].push(...series);

      // Generate tire predictions
      const predictions = generateTirePredictions(track.id, vehicle, baseTime);
      tirePredictions[trackKey].push(...predictions);

      // Generate telemetry points
      for (let i = 0; i < 100; i++) {
        const lap = Math.floor(i / 10) + 1;
        const lapdist = ((i % 10) / 10) * track.length;
        
        telemetry[trackKey].push({
          timestamp: generateTimestamp(baseTime, i * 0.5),
          vehicle_id: `GR86-${vehicle}`,
          vehicle_number: vehicle,
          lap: lap,
          lapdist_m: lapdist,
          track_total_m: track.length,
          Speed: 120 + Math.random() * 40,
          gear: 3 + Math.floor(Math.random() * 3),
          nmot: 5000 + Math.random() * 2000,
          aps: 50 + Math.random() * 50,
          pbrake_f: Math.random() > 0.7 ? 20 + Math.random() * 30 : 0,
          pbrake_r: Math.random() > 0.7 ? 15 + Math.random() * 25 : 0,
          accx_can: -2 + Math.random() * 4,
          accy_can: -1.5 + Math.random() * 3,
          Steering_Angle: -30 + Math.random() * 60,
          VBOX_Long_Minutes: Math.random(),
          VBOX_Lat_Min: Math.random(),
          AIR_TEMP: 25 + Math.random() * 5,
          TRACK_TEMP: 35 + Math.random() * 10,
          HUMIDITY: 50 + Math.random() * 20,
          WIND_SPEED: 5 + Math.random() * 10,
          RAIN: 0,
        });
      }
    }
  }

  return {
    agentDecisions,
    timeSeries,
    tirePredictions,
    telemetry,
  };
}

// Get mock data for a specific track
export function getTrackMockData(trackId: string) {
  const allData = generateAllTracksMockData();
  
  return {
    agentDecisions: allData.agentDecisions[trackId] || [],
    timeSeries: allData.timeSeries[trackId] || [],
    tirePredictions: allData.tirePredictions[trackId] || [],
    telemetry: allData.telemetry[trackId] || [],
  };
}

// Agent System Mock Data
export interface MockAgent {
  id: string;
  status: 'active' | 'idle' | 'error';
  types?: string[];
  tracks?: string[];
  capacity?: number;
}

export interface MockInsight {
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

export interface MockQueueStats {
  tasksLength?: number;
  resultsLength?: number;
  inboxLengths?: Array<{
    agentId: string;
    length: number;
  }>;
}

// Generate mock agents
export function generateMockAgents(): MockAgent[] {
  const agents: MockAgent[] = [];
  
  for (let i = 0; i < AGENT_TYPES.length; i++) {
    const agentType = AGENT_TYPES[i];
    const statuses: ('active' | 'idle' | 'error')[] = ['active', 'active', 'idle', 'idle'];
    const status = statuses[i % statuses.length] || 'active';
    
    agents.push({
      id: `${agentType}-${String(i + 1).padStart(2, '0')}`,
      status,
      types: [agentType],
      tracks: TRACKS.slice(0, Math.floor(Math.random() * 3) + 2).map(t => t.id),
      capacity: Math.floor(Math.random() * 3) + 1,
    });
  }
  
  return agents;
}

// Generate mock insights from agent decisions
export function generateMockInsights(
  numInsights: number = 15,
  baseTime: Date = new Date()
): MockInsight[] {
  const insights: MockInsight[] = [];
  const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const vehicle = VEHICLES[Math.floor(Math.random() * VEHICLES.length)];
  
  const priorities: Array<'critical' | 'high' | 'normal' | 'low'> = ['critical', 'high', 'normal', 'normal', 'low'];
  const agentTypes = [...AGENT_TYPES];
  
  for (let i = 0; i < numInsights; i++) {
    const agentType = agentTypes[i % agentTypes.length];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const lap = 5 + Math.floor(Math.random() * 20);
    const timestamp = generateTimestamp(baseTime, -(numInsights - i) * 30);
    
    const tireWear = 45 + (lap * 2.5) + Math.random() * 15;
    const predictedLoss = 0.05 + ((tireWear - 50) * 0.01);
    const lapsUntilLoss = Math.max(1, Math.round((75 - tireWear) / 2.5));
    
    let action = '';
    let decisionType = '';
    
    switch (agentType) {
      case 'strategy':
        action = `Recommend pit stop on lap ${lap + 2} for tire change`;
        decisionType = 'pit';
        break;
      case 'coach':
        action = `Driver coaching: ${['Early braking', 'Late apex', 'Smooth cornering'][Math.floor(Math.random() * 3)]}`;
        decisionType = 'coach';
        break;
      case 'anomaly_detective':
        action = `Safety alert: ${['Brake lockup detected', 'Unusual steering pattern', 'Temperature spike'][Math.floor(Math.random() * 3)]}`;
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
      confidence: 0.75 + Math.random() * 0.2,
      risk_level: priority === 'critical' ? 'critical' : priority === 'high' ? 'moderate' : 'safe',
      reasoning: [
        `Lap ${lap} analysis: ${action}`,
        `Current tire wear: ${Math.round(tireWear)}%`,
        `Predicted time loss: ${predictedLoss.toFixed(3)}s per lap`,
        `Model confidence: ${(85 + Math.random() * 10).toFixed(1)}%`,
      ],
      predictions: {
        predicted_loss_per_lap_seconds: predictedLoss,
        laps_until_0_5s_loss: lapsUntilLoss,
      },
      explanation: {
        top_features: [
          { name: 'tire_stress', value: (0.3 + Math.random() * 0.1).toFixed(3) },
          { name: 'track_temp', value: (0.25 + Math.random() * 0.1).toFixed(3) },
          { name: 'driver_consistency', value: (0.2 + Math.random() * 0.1).toFixed(3) },
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

// Generate mock queue stats
export function generateMockQueueStats(agents: MockAgent[]): MockQueueStats {
  const tasksLength = Math.floor(Math.random() * 50) + 10;
  const resultsLength = Math.floor(Math.random() * 30) + 5;
  
  const inboxLengths = agents.map(agent => ({
    agentId: agent.id,
    length: Math.floor(Math.random() * 20),
  }));
  
  return {
    tasksLength,
    resultsLength,
    inboxLengths,
  };
}

// Generate all agent system mock data
export function generateAgentSystemMockData() {
  const agents = generateMockAgents();
  const insights = generateMockInsights(20);
  const queueStats = generateMockQueueStats(agents);
  
  return {
    agents,
    insights,
    queueStats,
  };
}

// Generate mock AgentStatusResponse for API fallback
export function generateMockAgentStatusResponse() {
  const agents = generateMockAgents();
  const queueStats = generateMockQueueStats(agents);
  
  // Convert MockAgent[] to Agent[] format matching AgentStatusResponse
  const convertedAgents = agents.map(agent => ({
    id: agent.id,
    type: agent.types?.[0] || 'strategy',
    status: agent.status,
    registered_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
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

