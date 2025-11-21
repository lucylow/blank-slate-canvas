// src/components/DeliveryProvider.tsx
import React, { useEffect } from 'react';
import { WSClient } from '../lib/wsClient';
import { useAgentStore } from '../stores/agentStore';

const WS_URL = import.meta.env.VITE_DELIVER_WS || (typeof window !== 'undefined' ? `${window.location.origin.replace(/^http/, 'ws')}/ws/agents` : 'ws://localhost:8082/ws/agents');

export const DeliveryProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const addInsightSummary = useAgentStore((s) => s.addInsightSummary);
  const setAgentStatus = useAgentStore((s) => s.setAgentStatus);

  useEffect(() => {
    const client = new WSClient({
      url: WS_URL,
      onMessage: (msg) => {
        // expected { type, data }
        const type = msg.type || msg.t;
        const payload = msg.data || msg.payload || msg;
        switch (type) {
          case 'connected':
            console.info('Delivery WS connected');
            break;
          case 'insight_update':
          case 'eda_result':
            // receive summary (small payload). Push to store, UI will fetch full on demand
            if (payload && payload.insight_id) {
              addInsightSummary({
                insight_id: payload.insight_id,
                track: payload.track,
                chassis: payload.chassis,
                summary: payload.summary || null,
                created_at: payload.created_at,
                model_version: payload.model_version,
                short_explanation: payload.explanation ? payload.explanation.top_features : undefined,
              });
            }
            break;
          case 'agent_status':
            if (payload && payload.agentId && payload.status) {
              setAgentStatus(payload.agentId, payload.status);
            }
            break;
          default:
            // generic broadcast
            console.debug('ws msg', type, payload);
        }
      },
      onOpen: () => console.info('WS open'),
      onClose: () => console.warn('WS closed'),
    });
    client.connect();
    return () => client.close();
  }, [addInsightSummary, setAgentStatus]);

  return <>{children}</>;
};

