// src/pages/AgentInsightsDashboard.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { InsightList } from '../components/InsightList';
import { AgentStatusPanel } from '../components/AgentStatusPanel';
import { TaskQueuePanel } from '../components/TaskQueuePanel';
import { InsightModal } from '../components/InsightModal';
import { useAgentStore } from '../stores/agentStore';
import { populateAgentStore } from '../lib/mockAgentInsightsData';
import { useDemoMode } from '../hooks/useDemoMode';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, ArrowUpDown } from 'lucide-react';

export default function AgentInsightsDashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'track'>('date');
  const { isDemoMode } = useDemoMode();
  const insightOrder = useAgentStore((s) => s.insightOrder);
  const insights = useAgentStore((s) => s.insights);
  const addInsightSummary = useAgentStore((s) => s.addInsightSummary);
  const setInsightFull = useAgentStore((s) => s.setInsightFull);
  const setAgentStatus = useAgentStore((s) => s.setAgentStatus);
  const addTask = useAgentStore((s) => s.addTask);
  const hasInitialized = useRef(false);
  
  // Get unique tracks from insights
  const availableTracks = useMemo(() => {
    const tracks = new Set<string>();
    Object.values(insights).forEach(insight => {
      if (insight.track) {
        tracks.add(insight.track);
      }
    });
    return Array.from(tracks).sort();
  }, [insights]);
  
  // Initialize mock data when in demo mode or if no insights are present
  useEffect(() => {
    if (!hasInitialized.current && (isDemoMode || insightOrder.length === 0)) {
      hasInitialized.current = true;
      
      // Populate with mock data
      populateAgentStore({
        addInsightSummary,
        setInsightFull,
        setAgentStatus,
        addTask,
      });
    }
  }, [isDemoMode, insightOrder.length, addInsightSummary, setInsightFull, setAgentStatus, addTask]);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Live Insights</h2>
            <div className="flex items-center gap-2">
              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by track" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  {availableTracks.map(track => (
                    <SelectItem key={track} value={track}>
                      {track.charAt(0).toUpperCase() + track.slice(1).replace(/-/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: 'date' | 'track') => setSortBy(value)}>
                <SelectTrigger className="w-[150px]">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="track">Sort by Track</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <InsightList 
            onOpen={(id) => setOpenId(id)} 
            filterTrack={selectedTrack === 'all' ? undefined : selectedTrack}
            sortBy={sortBy}
          />
        </div>
        <div className="col-span-1 space-y-4">
          <AgentStatusPanel />
          <TaskQueuePanel />
        </div>
      </div>
      {openId && <InsightModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}


