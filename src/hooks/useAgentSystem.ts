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

interface Insight {
  insight_id: string;
  track: string;
  chassis: string;
  created_at: string;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  type?: string;
  predictions?: {
    predicted_loss_per_lap_seconds?: number;
    laps_until_0_5s_loss?: number;
    [key: string]: unknown;
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
        const response = await fetch('/api/agents/status');
        if (!response.ok) {
          throw new Error('Failed to fetch agent status');
        }
        const data = await response.json();
        setAgents(data.agents || []);
        setQueueStats(data.queues || {});
      } catch (error) {
        console.error('Failed to fetch agent status:', error);
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
          case 'insight_update':
            const newInsight: Insight = {
              ...data.data,
              insight_id: data.data.insight_id || data.data.id,
              receivedAt: new Date().toISOString()
            };
            
            setInsights(prev => {
              const updated = [newInsight, ...prev].slice(0, 50);
              insightsRef.current = updated;
              return updated;
            });
            break;

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
      const response = await fetch(`/api/insights/${insightId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch insight details');
      }
      const data = await response.json();
      setSelectedInsight(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch insight details:', error);
    }
  }, []);

  const submitTelemetry = useCallback(async (telemetryData: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telemetryData)
      });
      if (!response.ok) {
        throw new Error('Failed to submit telemetry');
      }
      return await response.json();
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

