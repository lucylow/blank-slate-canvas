// src/hooks/useAgentNavIntegration.ts
// Hook to integrate agent status updates with Smart Navigation

import { useEffect } from 'react';
import { useNavStore, type AgentStatus } from '@/stores/navStore';
import { getAgentStatus, type AgentStatusResponse } from '@/api/pitwall';
import { useQuery } from '@tanstack/react-query';
import { useDemoMode } from './useDemoMode';

/**
 * Hook to subscribe to agent status updates and integrate with Smart Navigation
 * This hook listens for agent_status messages and updates the navStore
 */
export function useAgentNavIntegration() {
  const setAgentStatus = useNavStore((state) => state.setAgentStatus);
  const { isDemoMode } = useDemoMode();

  // Poll agent status (or subscribe to WebSocket in production)
  const { data: agentStatusResponse } = useQuery<AgentStatusResponse>({
    queryKey: ['agentStatus'],
    queryFn: getAgentStatus,
    enabled: !isDemoMode,
    refetchInterval: 30000, // Poll every 30 seconds
    retry: 1,
  });

  // Update navStore when agent status changes
  useEffect(() => {
    if (!agentStatusResponse?.agents) return;

    // Convert API response format to navStore AgentStatus format
    agentStatusResponse.agents.forEach((agent) => {
      // Map API status to navStore status format
      const statusMap: Record<string, 'healthy' | 'degraded' | 'offline'> = {
        'active': 'healthy',
        'idle': 'degraded',
        'error': 'offline',
      };

      const navAgentStatus: AgentStatus = {
        agentId: agent.id || agent.type || 'unknown',
        status: statusMap[agent.status] || 'offline',
        latency_ms: undefined, // API doesn't provide this yet
        last_update: agent.registered_at
          ? Math.floor(new Date(agent.registered_at).getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        alert: undefined, // API doesn't provide alerts yet - can be extended
        preview: null, // API doesn't provide previews yet - can be extended
      };

      setAgentStatus(navAgentStatus);
    });
  }, [agentStatusResponse, setAgentStatus]);

  // In production, you might also want to subscribe to WebSocket for real-time updates
  // For now, we rely on polling. You can extend this to listen to WebSocket messages:
  //
  // useEffect(() => {
  //   const ws = new WebSocket(wsUrl);
  //   ws.onmessage = (event) => {
  //     try {
  //       const msg = JSON.parse(event.data);
  //       if (msg.type === 'agent_status') {
  //         setAgentStatus(msg);
  //       } else if (msg.type === 'insight_preview') {
  //         // Update preview for specific agent
  //         const agentStatus = useNavStore.getState().agents[msg.agent];
  //         if (agentStatus) {
  //           setAgentStatus({
  //             ...agentStatus,
  //             preview: {
  //               insight_id: msg.insight_id,
  //               summary: msg.summary,
  //               confidence: msg.confidence,
  //               ts: msg.timestamp,
  //             }
  //           });
  //         }
  //       }
  //     } catch (e) {
  //       console.warn('Failed to parse agent status message:', e);
  //     }
  //   };
  //   return () => ws.close();
  // }, [wsUrl]);
}

/**
 * Helper to create mock agent status for testing/demo
 */
export function createMockAgentStatus(
  agentId: string,
  overrides?: Partial<AgentStatus>
): AgentStatus {
  return {
    agentId,
    status: 'healthy',
    latency_ms: Math.floor(Math.random() * 200) + 50,
    last_update: Math.floor(Date.now() / 1000),
    alert: undefined,
    preview: null,
    ...overrides,
  };
}

