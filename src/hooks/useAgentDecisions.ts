// src/hooks/useAgentDecisions.ts
// Hook to consume AI agent decisions from Redis pub/sub via WebSocket

import { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { getWsUrl } from '@/utils/wsUrl';

export interface AgentDecision {
  type: 'agent_decision';
  agent_id: string;
  decision_id: string;
  track: string;
  chassis: string;
  action: string;
  confidence: number;
  risk_level: string;
  decision_type: 'pit' | 'coach' | 'anomaly' | 'strategy';
  reasoning?: string[];
  evidence?: Record<string, unknown>;
  created_at: string;
}

/**
 * Hook to consume AI agent decisions for a specific track
 * 
 * @param track - Track identifier (e.g., 'cota', 'road_america')
 * @param maxDecisions - Maximum number of decisions to keep in memory (default: 50)
 * @returns Array of agent decisions filtered by track
 */
export function useAgentDecisions(track: string, maxDecisions: number = 50): AgentDecision[] {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  
  // Connect to agent decisions WebSocket channel
  // Use the backend WebSocket endpoint for agent decisions
  // Convert HTTP path to WebSocket path
  const wsPath = '/api/agents/decisions/ws';
  const wsUrl = getWsUrl(wsPath);
  const ws = useWebSocket(wsUrl, {
    batchMs: 100,
    maxBuffer: 100,
    maxMessages: maxDecisions
  });
  
  useEffect(() => {
    if (!ws.connected || ws.messages.length === 0) return;
    
    // Filter and process messages
    const newDecisions = ws.messages
      .filter((msg: unknown): msg is AgentDecision => {
        if (typeof msg !== 'object' || msg === null) return false;
        const m = msg as Record<string, unknown>;
        return (
          m.type === 'agent_decision' &&
          typeof m.track === 'string' &&
          m.track === track
        );
      })
      .map((msg) => msg as AgentDecision);
    
    if (newDecisions.length > 0) {
      setDecisions(prev => {
        // Merge and deduplicate by decision_id
        const existing = new Map(prev.map(d => [d.decision_id, d]));
        newDecisions.forEach(d => {
          if (!existing.has(d.decision_id)) {
            existing.set(d.decision_id, d);
          }
        });
        
        // Convert back to array, sort by created_at (newest first), and limit
        return Array.from(existing.values())
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, maxDecisions);
      });
    }
  }, [ws.messages, ws.connected, track, maxDecisions]);
  
  return decisions;
}
