// src/pages/AgentInsightsDashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { InsightList } from '../components/InsightList';
import { AgentStatusPanel } from '../components/AgentStatusPanel';
import { TaskQueuePanel } from '../components/TaskQueuePanel';
import { InsightModal } from '../components/InsightModal';
import { useAgentStore } from '../stores/agentStore';
import { populateAgentStore } from '../lib/mockAgentInsightsData';
import { useDemoMode } from '../hooks/useDemoMode';

export default function AgentInsightsDashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { isDemoMode } = useDemoMode();
  const insightOrder = useAgentStore((s) => s.insightOrder);
  const addInsightSummary = useAgentStore((s) => s.addInsightSummary);
  const setInsightFull = useAgentStore((s) => s.setInsightFull);
  const setAgentStatus = useAgentStore((s) => s.setAgentStatus);
  const addTask = useAgentStore((s) => s.addTask);
  const hasInitialized = useRef(false);
  
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
          <h2 className="text-lg font-bold mb-4">Live Insights</h2>
          <InsightList onOpen={(id) => setOpenId(id)} />
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


