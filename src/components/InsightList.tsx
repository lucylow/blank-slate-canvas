// src/components/InsightList.tsx
import React, { useCallback } from 'react';
import { List, ListChildComponentProps } from 'react-window';
import { useAgentStore } from '../stores/agentStore';
import { InsightCard } from './InsightCard';

export const InsightList: React.FC<{ onOpen: (id: string) => void }> = ({ onOpen }) => {
  const insightOrder = useAgentStore((s) => s.insightOrder);
  const insights = useAgentStore((s) => s.insights);

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const id = insightOrder[index];
    const item = insights[id];
    if (!item) return <div style={style} />;
    return <div style={style}><InsightCard item={item} onOpen={onOpen} /></div>;
  }, [insightOrder, insights, onOpen]);

  if (insightOrder.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No insights yet. Waiting for agent updates...
      </div>
    );
  }

  return (
    <List height={600} width="100%" itemCount={insightOrder.length} itemSize={110}>
      {Row}
    </List>
  );
};
