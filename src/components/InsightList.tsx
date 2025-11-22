// src/components/InsightList.tsx
import React from 'react';
import { useAgentStore } from '../stores/agentStore';
import { InsightCard } from './InsightCard';

export const InsightList: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const insightOrder = useAgentStore((s) => s.insightOrder);
  const insights = useAgentStore((s) => s.insights);

  if (insightOrder.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No insights yet. Waiting for agent updates...
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="space-y-2">
        {insightOrder.map((id) => {
          const item = insights[id];
          if (!item) return null;
          return (
            <div key={id} className="mb-2">
              <InsightCard item={item} onOpen={onOpen} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
