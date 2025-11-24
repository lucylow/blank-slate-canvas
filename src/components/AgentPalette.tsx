import React from "react";
import useCanvasStore from "../stores/canvasStore";

const AGENT_LIBRARY = [
  { type: "ingest_agent", title: "Ingest Agent" },
  { type: "eda_agent", title: "EDA Clustering Agent" },
  { type: "predictor_agent", title: "Predictor Agent" },
  { type: "strategy_agent", title: "Strategy Agent" },
  { type: "coach_agent", title: "Coach Agent" },
  { type: "simulation_agent", title: "Simulation Agent" },
  { type: "narrator_agent", title: "Narrator / Broadcast" }
];

export default function AgentPalette() {
  const addNode = useCanvasStore(s => s.addNode);

  return (
    <div>
      <h3 className="font-semibold mb-3">Agent Palette</h3>
      <div className="space-y-3">
        {AGENT_LIBRARY.map(a => (
          <div
            key={a.type}
            className="p-3 border rounded flex items-center justify-between cursor-move hover:bg-gray-50"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("application/agent-type", a.type);
              e.dataTransfer.effectAllowed = "copy";
            }}
          >
            <div>
              <div className="font-medium">{a.title}</div>
              <div className="text-xs text-gray-500">{a.type}</div>
            </div>
            <div>
              <button
                className="px-3 py-1 bg-black text-white text-sm rounded"
                onClick={() =>
                  addNode({
                    type: a.type,
                    title: a.title,
                    x: 120,
                    y: 120,
                    config: {},
                    track: null
                  })
                }
              >
                Add
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button
          className="px-3 py-2 border rounded w-full"
          onClick={() => {
            // quick demo: add set for all tracks (one agent for each track)
            const tracks = ['sebring', 'road_america', 'cota', 'sonoma', 'vir', 'barber'];
            tracks.forEach((t, idx) => {
              addNode({
                type: 'predictor_agent',
                title: `predictor_${t}`,
                x: 40 + idx * 60,
                y: 420,
                config: { demo_track: t },
                track: t
              });
            });
          }}
        >
          Seed 6 Predictor Agents (per-track)
        </button>
      </div>
    </div>
  );
}

