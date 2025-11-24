// src/components/AgentStatusPanel.tsx
import React from 'react';
import { useAgentStore } from '../stores/agentStore';

export const AgentStatusPanel = () => {
  const agents = useAgentStore((s) => s.agents);
  return (
    <div className="p-3 border rounded">
      <h4 className="font-semibold">Agents</h4>
      <ul className="mt-2 text-sm">
        {Object.values(agents).map((a) => (
          <li key={a.id} className="flex justify-between">
            <div>{a.id} <span className="text-xs text-gray-400">({a.tracks?.join?.(',')})</span></div>
            <div className={`text-xs ${a.status === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`}>{a.status || 'unknown'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};


