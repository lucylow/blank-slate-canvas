import React from "react";
import useCanvasStore from "../stores/canvasStore";

export default function AgentInspector() {
  const selectedId = useCanvasStore(s => s.selectedId);
  const nodes = useCanvasStore(s => s.nodes);
  const updateNode = useCanvasStore(s => s.updateNode);
  const removeNode = useCanvasStore(s => s.removeNode);

  const node = nodes.find(n => n.id === selectedId) || null;

  if (!node) {
    return (
      <div>
        <h3 className="font-semibold">Inspector</h3>
        <p className="text-sm text-gray-500">Select a node to view details.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold">Inspector</h3>
      <div className="mt-3">
        <div className="text-xs text-gray-500">Title</div>
        <input
          value={node.title}
          onChange={e => updateNode(node.id, { title: e.target.value })}
          className="w-full border px-2 py-1 rounded mt-1"
        />
      </div>
      <div className="mt-3">
        <div className="text-xs text-gray-500">Track</div>
        <input
          value={node.track || ''}
          onChange={e => updateNode(node.id, { track: e.target.value || null })}
          className="w-full border px-2 py-1 rounded mt-1"
        />
      </div>
      <div className="mt-3">
        <div className="text-xs text-gray-500">Config (JSON)</div>
        <textarea
          value={JSON.stringify(node.config, null, 2)}
          onChange={e => {
            try {
              const parsed = JSON.parse(e.target.value);
              updateNode(node.id, { config: parsed });
            } catch (err) {
              // Invalid JSON, ignore
            }
          }}
          className="w-full border px-2 py-1 rounded mt-1 h-40 font-mono text-xs"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-2 border rounded"
          onClick={() => {
            alert('Run node (mock)');
            console.log('Run node', node);
          }}
        >
          Run
        </button>
        <button
          className="px-3 py-2 border rounded"
          onClick={() => {
            removeNode(node.id);
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

