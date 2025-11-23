// src/pages/AgentInsightsDashboard.tsx
import React, { useState } from 'react';
import { DeliveryProvider } from '../components/DeliveryProvider';
import { InsightList } from '../components/InsightList';
import { AgentStatusPanel } from '../components/AgentStatusPanel';
import { TaskQueuePanel } from '../components/TaskQueuePanel';
import { InsightModal } from '../components/InsightModal';

export default function AgentInsightsDashboard() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <DeliveryProvider>
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
    </DeliveryProvider>
  );
}


