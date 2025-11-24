// src/components/InsightList.tsx
import React, { useMemo } from 'react';
import { useAgentStore } from '../stores/agentStore';
import { InsightCard } from './InsightCard';

type InsightListProps = {
  onOpen: (id: string) => void;
  filterTrack?: string;
  sortBy?: 'date' | 'track';
};

export const InsightList: React.FC<InsightListProps> = ({ onOpen, filterTrack, sortBy = 'date' }) => {
  const insightOrder = useAgentStore((s) => s.insightOrder);
  const insights = useAgentStore((s) => s.insights);

  // Filter and sort insights
  const filteredAndSortedInsights = useMemo(() => {
    let filtered = insightOrder
      .map(id => insights[id])
      .filter(item => {
        if (!item) return false;
        if (filterTrack && item.track !== filterTrack) return false;
        return true;
      });

    // Sort by track or date
    if (sortBy === 'track') {
      filtered.sort((a, b) => {
        const trackA = a.track || '';
        const trackB = b.track || '';
        if (trackA === trackB) {
          // If same track, sort by date (newest first)
          const timeA = new Date(a.created_at || 0).getTime();
          const timeB = new Date(b.created_at || 0).getTime();
          return timeB - timeA;
        }
        return trackA.localeCompare(trackB);
      });
    } else {
      // Sort by date (newest first)
      filtered.sort((a, b) => {
        const timeA = new Date(a.created_at || 0).getTime();
        const timeB = new Date(b.created_at || 0).getTime();
        return timeB - timeA;
      });
    }

    return filtered;
  }, [insightOrder, insights, filterTrack, sortBy]);

  if (insightOrder.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No insights yet. Waiting for agent updates...
      </div>
    );
  }

  if (filteredAndSortedInsights.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No insights found for the selected filter.
      </div>
    );
  }

  return (
    <div className="h-[600px] overflow-y-auto">
      <div className="space-y-2">
        {filteredAndSortedInsights.map((item) => (
          <div key={item.insight_id} className="mb-2">
            <InsightCard item={item} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  );
};
