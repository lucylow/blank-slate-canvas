import { useState, useEffect, useCallback, useRef } from 'react';
import { getAgentDecisions, submitTelemetryToAgents, type AgentDecision } from '@/api/pitwall';

export interface AgentMessage {
  type: 'telemetry_update' | 'insight' | 'prediction' | 'status';
  track?: string;
  lap?: number;
  prediction?: string;
  confidence?: number;
  priority?: 'critical' | 'high' | 'normal' | 'low';
  timestamp: string;
  data?: Record<string, unknown>;
}

interface UseAgentStreamOptions {
  agentId?: string;
  track?: string;
  vehicle?: string;
  enabled?: boolean;
  pollInterval?: number;
}

export function useAgentStream(options: UseAgentStreamOptions = {}) {
  const { agentId, track, vehicle, enabled = true, pollInterval = 2000 } = options;
  
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [status, setStatus] = useState<'active' | 'idle' | 'error'>('idle');
  const [isConnected, setIsConnected] = useState(false);
  const messagesRef = useRef<AgentMessage[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for new agent decisions/insights
  useEffect(() => {
    if (!enabled) return;

    const fetchMessages = async () => {
      try {
        const response = await getAgentDecisions(track, vehicle, 10);
        const decisions = response.decisions || [];
        
        // Convert decisions to messages
        const newMessages: AgentMessage[] = decisions.map((decision: AgentDecision) => ({
          type: 'insight',
          track: decision.track,
          lap: decision.created_at ? new Date(decision.created_at).getTime() : undefined,
          prediction: decision.action,
          confidence: decision.confidence,
          priority: decision.risk_level === 'high' ? 'high' : decision.risk_level === 'critical' ? 'critical' : 'normal',
          timestamp: decision.created_at || new Date().toISOString(),
          data: {
            agent_id: decision.agent_id,
            decision_type: decision.decision_type,
            reasoning: decision.reasoning,
            evidence: decision.evidence
          }
        }));

        // Only add new messages (not duplicates)
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.timestamp));
          const unique = newMessages.filter(m => !existingIds.has(m.timestamp));
          if (unique.length > 0) {
            const updated = [...unique, ...prev].slice(0, 50);
            messagesRef.current = updated;
            return updated;
          }
          return prev;
        });

        setStatus('active');
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch agent messages:', error);
        setStatus('error');
        setIsConnected(false);
      }
    };

    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, track, vehicle, pollInterval]);

  const sendMessage = useCallback(async (message: {
    type: string;
    data?: Record<string, unknown>;
    channel?: string;
  }) => {
    try {
      if (message.type === 'telemetry_update' && message.data) {
        await submitTelemetryToAgents({
          ...message.data,
          channel: message.channel,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to send message to agent:', error);
    }
  }, []);

  return {
    messages: messagesRef.current,
    status,
    isConnected,
    sendMessage
  };
}

