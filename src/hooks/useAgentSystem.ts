import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelemetryWebSocket } from './useTelemetryWebSocket';
import { getWsUrl } from '@/utils/wsUrl';

interface Agent {
  id: string;
  status: 'active' | 'idle' | 'error';
  types?: string[];
  tracks?: string[];
  capacity?: number;
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
  const ws = useTelemetryWebSocket({ url: getWsUrl('/telemetry') });

  // Fetch agent status periodically
  useEffect(() => {
    const fetchAgentStatus = async () => {
      try {
        // Use the API client from pitwall.ts
        const { getAgentStatus } = await import('@/api/pitwall');
        const data = await getAgentStatus();
        setAgents(data.agents || []);
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
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'insight_update': {
            const newInsight: Insight = {
              ...data.data,
              insight_id: data.data.insight_id || data.data.id || data.data.decision_id || `insight-${Date.now()}`
            };
            
            setInsights(prev => {
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
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws]);

  const fetchInsightDetails = useCallback(async (insightId: string) => {
    try {
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
  }, []);

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
    insights: insightsRef.current,
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

