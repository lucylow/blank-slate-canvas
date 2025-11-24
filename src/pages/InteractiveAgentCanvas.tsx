import React, { useEffect } from "react";
import AgentCanvas from "../components/AgentCanvas";
import AgentPalette from "../components/AgentPalette";
import AgentInspector from "../components/AgentInspector";
import useCanvasStore from "../stores/canvasStore";

export default function InteractiveAgentCanvas() {
  const loadDemo = useCanvasStore(state => state.loadDemoCanvas);

  useEffect(() => {
    // load demo prebuilt canvas on first mount if none saved
    const saved = localStorage.getItem('canvas_v1');
    if (!saved) {
      loadDemo();
    }
  }, [loadDemo]);

  return (
    <div className="h-screen flex flex-col">
      <header className="p-4 border-b">
        <h1 className="text-xl font-bold">Interactive Strategy Canvas — Create your own AI Agent</h1>
        <p className="text-sm text-gray-600">
          Drag agents onto the canvas, connect them, edit configs, and simulate using mock data.
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 border-r p-4 overflow-auto">
          <AgentPalette />
        </aside>

        <main className="flex-1 relative p-4 overflow-auto">
          <AgentCanvas />
        </main>

        <aside className="w-96 border-l p-4 overflow-auto">
          <AgentInspector />
        </aside>
      </div>
    </div>
  );
}

