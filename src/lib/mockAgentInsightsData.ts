// src/lib/mockAgentInsightsData.ts
// Mock data generator for Agent Insights Dashboard
// Populates the agentStore with realistic insights, agents, and tasks

import type { InsightSummary, InsightFull } from '@/stores/agentStore';
import { useAgentStore } from '@/stores/agentStore';

const TRACKS = ['sebring', 'cota', 'barber', 'sonoma', 'road-america', 'vir', 'indianapolis'];
const CHASSIS = ['GR86-016-7', 'GR86-014-21', 'GR86-006-13', 'GR86-008-22', 'GR86-004-78', 'GR86-010-46'];
const AGENT_TYPES = ['predictor', 'explainer', 'eda', 'strategy', 'coach', 'anomaly_detective', 'simulator'];
const INSIGHT_SUMMARIES = [
  'Tire degradation accelerating faster than predicted',
  'Optimal pit window identified: Laps 12-15',
  'Driver consistency score improved by 15% this session',
  'Anomaly detected: Unusual brake pressure patterns in Sector 2',
  'Predicted lap time improvement of 0.8s with tire change',
  'High lateral G-forces causing increased tire wear',
  'Recommended strategy shift: Switch to 2-stop approach',
  'Driver performance peak at Laps 8-12, consider extending stint',
  'Tire temperature gradient indicates optimal pressure settings',
  'Gap to leader closing, maintain current pace for P3 finish',
  'Brake fade detected in heavy braking zones',
  'Aerodynamic drag higher than expected, investigate setup',
  'Fuel consumption within target, no strategy adjustment needed',
  'Tire wear pattern suggests understeer in Sector 3',
  'Lap time delta analysis shows 0.5s gain potential in Sector 1',
];

const TASK_TYPES = [
  'analyze_tire_wear',
  'predict_lap_times',
  'optimize_strategy',
  'detect_anomalies',
  'compare_drivers',
  'analyze_sector_performance',
  'generate_report',
  'simulate_scenarios',
];

// Generate a random date within the last 7 days
function randomRecentDate(): string {
  const now = Date.now();
  const daysAgo = Math.random() * 7;
  const timestamp = now - daysAgo * 24 * 60 * 60 * 1000;
  return new Date(timestamp).toISOString();
}

// Generate mock insight summary
function generateInsightSummary(index: number, baseTimestamp: number): InsightSummary {
  const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
  const chassis = CHASSIS[Math.floor(Math.random() * CHASSIS.length)];
  const summary = INSIGHT_SUMMARIES[index % INSIGHT_SUMMARIES.length];
  
  return {
    insight_id: `insight-${baseTimestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`,
    track,
    chassis,
    summary,
    created_at: randomRecentDate(),
    model_version: `v1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
  };
}

// Generate full insight with predictions, explanation, and evidence
export function generateFullInsight(summary: InsightSummary): InsightFull {
  const predictions = {
    predicted_lap_time: 98.5 + Math.random() * 5,
    predicted_tire_wear: 65 + Math.random() * 30,
    predicted_position: Math.floor(Math.random() * 10) + 1,
    confidence: 0.75 + Math.random() * 0.2,
  };

  const explanation = {
    top_features: [
      { name: 'tire_stress_S2', value: (0.35 + Math.random() * 0.15).toFixed(2) },
      { name: 'brake_energy_S1', value: (0.18 + Math.random() * 0.12).toFixed(2) },
      { name: 'lateral_g_S2', value: (0.25 + Math.random() * 0.15).toFixed(2) },
      { name: 'avg_speed_S3', value: (0.08 + Math.random() * 0.10).toFixed(2) },
      { name: 'surface_temp_delta', value: (1.5 + Math.random() * 2.0).toFixed(2) },
    ],
    reasoning: [
      'Elevated lateral load detected in Sector 2',
      'Repeated heavy braking observed in Sector 1',
      'Surface temperature rising +2.2°C over last 3 laps',
      'High lateral G-forces contributing to tire degradation',
    ],
  };

  const evidence = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => ({
    lap: 8 + Math.floor(Math.random() * 15),
    meta_time: randomRecentDate(),
    sector: Math.floor(Math.random() * 3) + 1,
    small_trace: Array.from({ length: 10 }, () => Math.random() * 100),
  }));

  return {
    ...summary,
    predictions,
    explanation,
    evidence,
  };
}

// Generate mock agent status
export function generateMockAgents() {
  const agents: Record<string, { id: string; types: string[]; tracks: string[]; status?: string }> = {};
  
  AGENT_TYPES.forEach((type, index) => {
    const agentId = `agent-${type}`;
    const assignedTracks = TRACKS.filter(() => Math.random() > 0.4).slice(0, 3);
    agents[agentId] = {
      id: agentId,
      types: [type],
      tracks: assignedTracks.length > 0 ? assignedTracks : [TRACKS[0]],
      status: Math.random() > 0.2 ? 'healthy' : 'degraded',
    };
  });
  
  return agents;
}

// Generate mock tasks
export function generateMockTasks(count: number = 15) {
  const tasks: Record<string, any> = {};
  const baseTimestamp = Date.now();
  
  for (let i = 0; i < count; i++) {
    const taskId = `task-${baseTimestamp}-${i}-${Math.random().toString(36).substr(2, 9)}`;
    const taskType = TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)];
    const track = TRACKS[Math.floor(Math.random() * TRACKS.length)];
    const chassis = CHASSIS[Math.floor(Math.random() * CHASSIS.length)];
    
    tasks[taskId] = {
      task_id: taskId,
      task_type: taskType,
      track,
      chassis,
      created_at: randomRecentDate(),
      status: Math.random() > 0.3 ? 'pending' : 'processing',
      priority: Math.random() > 0.7 ? 'high' : 'normal',
    };
  }
  
  return tasks;
}

// Main function to populate the agent store with mock data
export function initializeMockAgentInsights() {
  const insights: Record<string, InsightFull> = {};
  const insightOrder: string[] = [];
  const baseTimestamp = Date.now();
  
  // Generate 12-20 mock insights
  const insightCount = 12 + Math.floor(Math.random() * 9);
  
  for (let i = 0; i < insightCount; i++) {
    const summary = generateInsightSummary(i, baseTimestamp);
    const fullInsight = generateFullInsight(summary);
    insights[fullInsight.insight_id] = fullInsight;
    insightOrder.push(fullInsight.insight_id);
  }
  
  // Sort by created_at (newest first)
  insightOrder.sort((a, b) => {
    const timeA = new Date(insights[a].created_at || 0).getTime();
    const timeB = new Date(insights[b].created_at || 0).getTime();
    return timeB - timeA;
  });
  
  return {
    insights,
    insightOrder,
    agents: generateMockAgents(),
    tasks: generateMockTasks(15),
  };
}

// Helper function to add insights to the store (for use in components)
export function populateAgentStore(store: {
  addInsightSummary: (s: InsightSummary) => void;
  setInsightFull: (id: string, full: InsightFull) => void;
  setAgentStatus: (id: string, status: string) => void;
  addTask: (task: any) => void;
}) {
  const mockData = initializeMockAgentInsights();
  
  // Add insights
  Object.values(mockData.insights).forEach((insight) => {
    store.addInsightSummary(insight);
    // Set full insight data
    store.setInsightFull(insight.insight_id, insight);
  });
  
  // Add agents - set status which creates/updates the agent entry
  // Note: The store's setAgentStatus will create the agent with default empty types/tracks
  // For full agent initialization, we need to update the store state directly
  Object.values(mockData.agents).forEach((agent) => {
    if (agent.status) {
      store.setAgentStatus(agent.id, agent.status);
    }
  });
  
  // Update agents with full data (types and tracks) by directly updating store state
  const currentState = useAgentStore.getState();
  useAgentStore.setState((state) => ({
    agents: {
      ...state.agents,
      ...Object.fromEntries(
        Object.values(mockData.agents).map((agent) => [
          agent.id,
          {
            ...state.agents[agent.id],
            ...agent,
          },
        ])
      ),
    },
  }));
  
  // Add tasks
  Object.values(mockData.tasks).forEach((task) => {
    store.addTask(task);
  });
  
  return mockData;
}
