import React, { useRef, useState } from "react";
import useCanvasStore from "../stores/canvasStore";
import { AgentNode } from "../stores/canvasStore";
import { loadTrackSummary } from "../lib/mockData";

function NodeView({ node }: { node: AgentNode }) {
  const updateNode = useCanvasStore(s => s.updateNode);
  const selectNode = useCanvasStore(s => s.selectNode);
  const selectedId = useCanvasStore(s => s.selectedId);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; nodeX: number; nodeY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.detail === 2) {
      // Double click - move slightly
      updateNode(node.id, { x: node.x + 10, y: node.y + 10 });
      return;
    }
    // Single click - select
    e.stopPropagation();
    selectNode(node.id);

    // Start dragging
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: node.x,
      nodeY: node.y
    };
  };

  React.useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      updateNode(node.id, {
        x: Math.max(0, dragStartRef.current.nodeX + deltaX),
        y: Math.max(0, dragStartRef.current.nodeY + deltaY)
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, node.id, updateNode]);

  return (
    <div
      onMouseDown={handleMouseDown}
      data-node-id={node.id}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: 200
      }}
      className={`bg-white border shadow-sm rounded p-2 cursor-move ${
        selectedId === node.id ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-75' : ''}`}
    >
      <div className="font-semibold">{node.title}</div>
      <div className="text-xs text-gray-500">{node.type}</div>
      <div className="mt-2 text-xs">
        <div>
          track: <span className="font-mono text-xs">{node.track || "—"}</span>
        </div>
        <div>inputs: {(node.inputs || []).length}</div>
        <div>outputs: {(node.outputs || []).length}</div>
      </div>
    </div>
  );
}

export default function AgentCanvas() {
  const nodes = useCanvasStore(s => s.nodes);
  const addNode = useCanvasStore(s => s.addNode);
  const connectNodes = useCanvasStore(s => s.connectNodes);
  const disconnectNodes = useCanvasStore(s => s.disconnectNodes);
  const selectNode = useCanvasStore(s => s.selectNode);
  const selectedId = useCanvasStore(s => s.selectedId);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const type = e.dataTransfer.getData("application/agent-type");
    const rect = (canvasRef.current as HTMLDivElement).getBoundingClientRect();
    const x = e.clientX - rect.left - 100;
    const y = e.clientY - rect.top - 24;
    if (type) {
      addNode({ type, title: type, x: Math.max(0, x), y: Math.max(0, y), config: {}, track: null });
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleNodeClick(nodeId: string) {
    if (connectingFrom) {
      if (connectingFrom !== nodeId) {
        connectNodes(connectingFrom, nodeId);
      }
      setConnectingFrom(null);
    } else {
      selectNode(nodeId);
    }
  }

  return (
    <div
      ref={canvasRef}
      className="canvas-container relative bg-gray-50 h-full rounded"
      onDrop={onDrop}
      onDragOver={onDragOver}
      onClick={() => selectNode(null)}
    >
      {/* canvas toolbar */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          className="px-2 py-1 border rounded bg-white"
          onClick={() => {
            useCanvasStore.getState().saveLocal();
            alert('Canvas saved locally');
          }}
        >
          Save
        </button>
        <button
          className="px-2 py-1 border rounded bg-white"
          onClick={() => {
            useCanvasStore.getState().loadLocal();
            alert('Canvas loaded');
          }}
        >
          Load
        </button>
        <button
          className="px-2 py-1 border rounded bg-white"
          onClick={() => {
            useCanvasStore.getState().clear();
          }}
        >
          Clear
        </button>
        <button
          className="px-2 py-1 border rounded bg-white"
          onClick={() => {
            simulateRun();
          }}
        >
          Simulate
        </button>
        {connectingFrom && (
          <button
            className="px-2 py-1 border rounded bg-yellow-200"
            onClick={() => setConnectingFrom(null)}
          >
            Cancel Connect
          </button>
        )}
      </div>

      {/* nodes */}
      {nodes.map(node => (
        <div key={node.id} onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}>
          <NodeView node={node} />
          {/* Connection button */}
          <button
            className="absolute"
            style={{ left: node.x + 200, top: node.y + 24, transform: 'translate(-50%, -50%)' }}
            onClick={(e) => {
              e.stopPropagation();
              setConnectingFrom(node.id);
            }}
            title="Connect to another node"
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      ))}

      {/* render simple SVG links for outputs */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
        {nodes.map(n => {
          return (n.outputs || []).map(outId => {
            const target = nodes.find(x => x.id === outId);
            if (!target) return null;
            const x1 = n.x + 200;
            const y1 = n.y + 24;
            const x2 = target.x;
            const y2 = target.y + 24;
            return (
              <path
                key={`${n.id}-${outId}`}
                d={`M ${x1} ${y1} C ${x1 + 40} ${y1} ${x2 - 40} ${y2} ${x2} ${y2}`}
                stroke="#111"
                strokeWidth="1.2"
                fill="none"
                markerEnd="url(#arrow)"
              />
            );
          });
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#111"></path>
          </marker>
        </defs>
      </svg>
    </div>
  );
}

// simple simulation: reads canvas nodes and runs mock logic (console.log) - exported for quick manual use
export async function simulateRun() {
  const state = useCanvasStore.getState();
  const nodes = state.nodes;
  console.log('Simulate run with nodes', nodes);
  // naive topological ordering: ingest->eda->predictor->strategy->coach->narrator
  const order = ['ingest_agent', 'eda_agent', 'predictor_agent', 'strategy_agent', 'coach_agent', 'simulation_agent', 'narrator_agent'];
  for (const t of order) {
    const list = nodes.filter(n => n.type === t);
    for (const n of list) {
      console.log(`Running ${n.title} (${n.id}) for track ${n.track} — config:`, n.config);
      // Try to load track summary if track is set
      if (n.track) {
        try {
          const summary = await loadTrackSummary(n.track);
          if (summary) {
            console.log(`Loaded track summary for ${n.track}:`, summary);
          }
        } catch (e) {
          console.warn(`Could not load track summary for ${n.track}:`, e);
        }
      }
      // fake delay
      await new Promise(r => setTimeout(r, 250));
    }
  }
  alert('Simulation complete (mock). Check console for step logs.');
}

