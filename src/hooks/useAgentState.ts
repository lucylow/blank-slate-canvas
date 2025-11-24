import { useState, useCallback, useRef, useEffect } from 'react';
import { getAgentDecisions, type AgentDecision } from '@/api/pitwall';

interface RaceDecision {
  agent: string;
  recommendation: string;
  confidence: number;
  timestamp: string;
  decision_type?: string;
  reasoning?: string[];
}

interface AgentState {
  proverbs: string[];
  raceDecisions: RaceDecision[];
  riskAssessments: Array<{
    agent: string;
    risk: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
  }>;
}

interface UseAgentStateOptions {
  pollInterval?: number;
  enabled?: boolean;
}

export function useAgentState(options: UseAgentStateOptions = {}) {
  const { pollInterval = 3000, enabled = true } = options;
  
  const [state, setState] = useState<AgentState>({
    proverbs: [],
    raceDecisions: [],
    riskAssessments: []
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Poll for agent decisions and update shared state
  useEffect(() => {
    if (!enabled) return;

    const fetchAgentDecisions = async () => {
      try {
        const response = await getAgentDecisions(undefined, undefined, 20);
        const decisions = response.decisions || [];

        // Convert agent decisions to race decisions
        const newDecisions: RaceDecision[] = decisions.map((decision: AgentDecision) => ({
          agent: decision.agent_id || 'unknown',
          recommendation: decision.action || 'No recommendation',
          confidence: decision.confidence || 0,
          timestamp: decision.created_at || new Date().toISOString(),
          decision_type: decision.decision_type,
          reasoning: decision.reasoning
        }));

        // Update state with new decisions (avoid duplicates)
        setState(prev => {
          const existingTimestamps = new Set(prev.raceDecisions.map(d => d.timestamp));
          const uniqueDecisions = newDecisions.filter(d => !existingTimestamps.has(d.timestamp));
          
          if (uniqueDecisions.length > 0) {
            return {
              ...prev,
              raceDecisions: [...uniqueDecisions, ...prev.raceDecisions].slice(0, 50)
            };
          }
          return prev;
        });
      } catch (error) {
        console.error('Failed to fetch agent decisions:', error);
      }
    };

    fetchAgentDecisions();
    const interval = setInterval(fetchAgentDecisions, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, pollInterval]);

  const updateState = useCallback((updater: (prev: AgentState) => AgentState) => {
    setState(prev => {
      const updated = updater(prev);
      stateRef.current = updated;
      return updated;
    });
  }, []);

  const requestAgentAnalysis = useCallback(async (
    agentId: string,
    telemetryData: Record<string, unknown>
  ) => {
    try {
      const { requestAgentAnalysis: apiRequestAgentAnalysis } = await import('@/api/pitwall');
      const agentResponse = await apiRequestAgentAnalysis(agentId, {
        telemetry: telemetryData,
        // @ts-ignore - sessionState type mismatch
        sessionState: stateRef.current
      });

      // Update shared state with agent insight
      updateState(prev => ({
        ...prev,
        raceDecisions: [
          {
            agent: agentId,
            recommendation: agentResponse.recommendation || 'Analysis complete',
            confidence: agentResponse.confidence || 0.5,
            timestamp: new Date().toISOString(),
            decision_type: agentResponse.decision_type,
            reasoning: agentResponse.reasoning
          },
          ...prev.raceDecisions
        ].slice(0, 50)
      }));

      return agentResponse;
    } catch (error) {
      console.error('Failed to request agent analysis:', error);
      throw error;
    }
  }, [updateState]);

  return {
    state,
    updateState,
    requestAgentAnalysis
  };
}

