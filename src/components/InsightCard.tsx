// src/components/InsightCard.tsx
import React from 'react';
import { InsightSummary } from '../stores/agentStore';

type Props = {
  item: InsightSummary;
  onOpen: (id: string) => void;
};

export const InsightCard: React.FC<Props> = React.memo(({ item, onOpen }) => {
  return (
    <div className="p-3 border rounded hover:shadow-sm cursor-pointer transition-shadow" onClick={() => onOpen(item.insight_id)}>
      <div className="text-sm text-gray-400">{item.track} · {item.chassis}</div>
      <div className="text-base font-medium mt-1">{item.summary ?? 'Insight'}</div>
      <div className="text-xs text-gray-500 mt-2">{item.created_at}</div>
    </div>
  );
});

