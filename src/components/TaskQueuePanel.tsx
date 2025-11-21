// src/components/TaskQueuePanel.tsx
import React from 'react';
import { useAgentStore } from '../stores/agentStore';

export const TaskQueuePanel = () => {
  const tasks = useAgentStore((s) => s.tasks);
  return (
    <div className="p-3 border rounded">
      <h4 className="font-semibold">Pending Tasks ({Object.keys(tasks).length})</h4>
      <div className="mt-2 text-xs">
        {Object.values(tasks).slice(0, 20).map((t: any) => (
          <div key={t.task_id || JSON.stringify(t)} className="border-b py-1">
            <div><strong>{t.task_type}</strong> · {t.track} · {t.chassis}</div>
            <div className="text-gray-500">{t.created_at ?? ''}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
