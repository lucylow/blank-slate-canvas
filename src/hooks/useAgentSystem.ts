import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import { getWsUrl } from '@/utils/wsUrl';
import { useDemoMode } from './useDemoMode';
import { 
  generateAgentSystemMockData, 
  generateMockInsights,
  generateMockQueueStats,
  type MockAgent,
  type MockInsight,
  type MockQueueStats
} from '@/lib/mockDemoData';

interface Agent {
  id: string;
  status: 'active' | 'idle' | 'error';
  type?: string; // Single type from backend
  types?: string[]; // Array of types for compatibility
  tracks?: string[];
  capacity?: number;
  registered_at?: string;
}

export interface Insight {
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
    evidence?: Array<{
      lap: number;
      sector: number;
      meta_time: string;
      mini_trace?: unknown;
    }>;
  };
  recommendations?: Array<{
    priority: string;
    message: string;
    action?: string;
  }>;
  model_version?: string;
}

interface QueueStats {
  tasksLength?: number;
  resultsLength?: number;
  inboxLengths?: Array<{
    agentId: string;
    length: number;
  }>;
}

export const useAgentSystem = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [queueStats, setQueueStats] = useState<QueueStats>({});
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const insightsRef = useRef<Insight[]>([]);
  const { isDemoMode } = useDemoMode();
  
  // Connect to agent decisions WebSocket endpoint
  const agentDecisionsWsUrl = getWsUrl('/api/agents/decisions/ws');
  const ws = useWebSocket(agentDecisionsWsUrl, {
    batchMs: 100,
    maxBuffer: 100,
    maxMessages: 50
  });
  
  // Send subscription message when WebSocket connects (optional track/chassis filter)
  useEffect(() => {
    if (!isDemoMode && ws.connected && ws.send) {
      // Send initial subscription message (optional - backend will work without it)
      // This allows filtering by track/chassis if needed
      try {
        ws.send({
          track: undefined, // Can be set to filter by specific track
          chassis: undefined // Can be set to filter by specific chassis
        });
      } catch (error) {
        console.warn('Failed to send WebSocket subscription:', error);
      }
    }
  }, [ws, isDemoMode]);

  // Convert MockAgent to Agent
  const convertMockAgent = (mock: MockAgent): Agent => ({
    id: mock.id,
    status: mock.status,
    types: mock.types,
    tracks: mock.tracks,
    capacity: mock.capacity,
  });

  // Convert MockInsight to Insight
  const convertMockInsight = (mock: MockInsight): Insight => ({
    insight_id: mock.insight_id,
    decision_id: mock.decision_id,
    track: mock.track,
    chassis: mock.chassis,
    created_at: mock.created_at,
    priority: mock.priority,
    type: mock.type,
    decision_type: mock.decision_type,
    agent_id: mock.agent_id,
    agent_type: mock.agent_type,
    action: mock.action,
    confidence: mock.confidence,
    risk_level: mock.risk_level,
    reasoning: mock.reasoning,
    evidence: mock.evidence,
    alternatives: mock.alternatives,
    predictions: mock.predictions ? {
      predicted_loss_per_lap_seconds: mock.predictions.predicted_loss_per_lap_seconds,
      laps_until_0_5s_loss: mock.predictions.laps_until_0_5s_loss,
    } : undefined,
    explanation: mock.explanation,
  });

  // Convert MockQueueStats to QueueStats
  const convertMockQueueStats = (mock: MockQueueStats): QueueStats => ({
    tasksLength: mock.tasksLength,
    resultsLength: mock.resultsLength,
    inboxLengths: mock.inboxLengths,
  });

  // Initialize mock data in demo mode
  useEffect(() => {
    if (isDemoMode) {
      const mockData = generateAgentSystemMockData();
      setAgents(mockData.agents.map(convertMockAgent));
      setInsights(mockData.insights.map(convertMockInsight));
      insightsRef.current = mockData.insights.map(convertMockInsight);
      setQueueStats(convertMockQueueStats(mockData.queueStats));

      // Simulate periodic updates in demo mode
      const interval = setInterval(() => {
        // Occasionally add new insights
        if (Math.random() > 0.7) {
          const newInsights = generateMockInsights(1);
          const convertedInsights = newInsights.map(convertMockInsight);
          setInsights(prev => {
            const updated = [...convertedInsights, ...prev].slice(0, 50);
            insightsRef.current = updated;
            return updated;
          });
        }
        
        // Update queue stats occasionally
        if (Math.random() > 0.8) {
          const currentAgents = mockData.agents.map(convertMockAgent);
          const newStats = generateMockQueueStats(mockData.agents);
          setQueueStats(convertMockQueueStats(newStats));
        }
      }, 5000);

      return () => clearInterval(interval);
    } else {
      // Clear mock data when switching to live mode
      setInsights([]);
      insightsRef.current = [];
    }
  }, [isDemoMode]);

  // Fetch agent status periodically (live mode only)
  useEffect(() => {
    if (isDemoMode) return;

    const fetchAgentStatus = async () => {
      try {
        // Use the API client from pitwall.ts
        const { getAgentStatus } = await import('@/api/pitwall');
        const data = await getAgentStatus();
        
        // Normalize agents to ensure types array exists and status has default
        const normalizedAgents: Agent[] = (data.agents || []).map(agent => ({
          id: agent.id,
          status: (agent.status || 'idle') as 'active' | 'idle' | 'error', // Default to 'idle' if not specified
          type: agent.type,
          types: agent.types || (agent.type ? [agent.type] : []), // Ensure types array exists
          tracks: agent.tracks || [],
          registered_at: agent.registered_at
        }));
        
        setAgents(normalizedAgents);
        setQueueStats(data.queues || {});
      } catch (error) {
        console.error('Failed to fetch agent status:', error);
        // Set empty agents on error to prevent UI errors
        setAgents([]);
        setQueueStats({});
      }
    };

    fetchAgentStatus();
    const interval = setInterval(fetchAgentStatus, 5000);
    return () => clearInterval(interval);
  }, [isDemoMode]);

  // Handle WebSocket messages (live mode only)
  useEffect(() => {
    if (isDemoMode || !ws.connected) return;

    // Process messages from useWebSocket hook
    const messages = ws.messages || [];
    
    if (messages.length > 0) {
      messages.forEach((msg: unknown) => {
        try {
          // Handle both direct message objects and parsed JSON strings
          let data: any;
          if (typeof msg === 'string') {
            data = JSON.parse(msg);
          } else if (typeof msg === 'object' && msg !== null) {
            data = msg;
          } else {
            return;
          }
          
          switch (data.type) {
            case 'insight_update': {
              const newInsight: Insight = {
                ...data.data,
                insight_id: data.data.insight_id || data.data.id || data.data.decision_id || `insight-${Date.now()}`,
                track: data.data.track || '',
                chassis: data.data.chassis || '',
                created_at: data.data.created_at || new Date().toISOString()
              };
              
              setInsights(prev => {
                // Deduplicate by insight_id
                const existing = prev.find(i => i.insight_id === newInsight.insight_id);
                if (existing) return prev;
                
                const updated = [newInsight, ...prev].slice(0, 50);
                insightsRef.current = updated;
                return updated;
              });
              break;
            }

            case 'eda_result':
              console.log('EDA Result:', data.data);
              break;

            case 'agent_status_update':
              setAgents(prev => 
                prev.map(agent => 
                  agent.id === data.data.agentId 
                    ? { ...agent, ...data.data }
                    : agent
                )
              );
              break;

            case 'ping':
              // Keep-alive ping, no action needed
              break;
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });
    }
  }, [ws.messages, ws.connected, isDemoMode]);

  const fetchInsightDetails = useCallback(async (insightId: string) => {
    try {
      if (isDemoMode) {
        // In demo mode, find the insight from existing insights
        const existingInsight = insightsRef.current.find(i => i.insight_id === insightId);
        if (existingInsight) {
          setSelectedInsight(existingInsight);
          setIsModalOpen(true);
        }
        return;
      }

      const { getInsightDetails } = await import('@/api/pitwall');
      const response = await getInsightDetails(insightId);
      const detail = response.insight;
      
      // Convert InsightDetail to Insight format
      const insight: Insight = {
        insight_id: detail.decision_id || insightId,
        decision_id: detail.decision_id,
        track: (detail.evidence?.track as string) || (detail.evidence?.chassis as string)?.split('-')[0] || '',
        chassis: (detail.evidence?.chassis as string) || '',
        created_at: new Date().toISOString(),
        type: detail.decision_type,
        decision_type: detail.decision_type,
        agent_id: detail.agent_id,
        agent_type: detail.agent_type,
        action: detail.action,
        confidence: detail.confidence,
        risk_level: detail.risk_level,
        reasoning: detail.reasoning,
        evidence: detail.evidence,
        alternatives: detail.alternatives,
        // Map reasoning to explanation if needed
        explanation: detail.reasoning ? {
          top_features: detail.reasoning.map((r: string, idx: number) => ({
            name: `Reason ${idx + 1}`,
            value: r
          }))
        } : undefined,
      };
      
      setSelectedInsight(insight);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch insight details:', error);
    }
  }, [isDemoMode]);

  const submitTelemetry = useCallback(async (telemetryData: Record<string, unknown>) => {
    try {
      const { submitTelemetryToAgents } = await import('@/api/pitwall');
      return await submitTelemetryToAgents(telemetryData);
    } catch (error) {
      console.error('Failed to submit telemetry:', error);
      throw error;
    }
  }, []);

  const clearInsights = useCallback(() => {
    setInsights([]);
    insightsRef.current = [];
  }, []);

  return {
    agents,
    insights: insights, // Use state instead of ref for proper reactivity
    queueStats,
    selectedInsight,
    isModalOpen,
    setIsModalOpen,
    setSelectedInsight,
    fetchInsightDetails,
    submitTelemetry,
    clearInsights
  };
};

