// @ts-nocheck
import { create } from 'zustand';
import { nanoid } from 'nanoid';

export type AgentNode = {
  id: string;
  type: string;
  title: string;
  x: number;
  y: number;
  config: Record<string, any>;
  inputs?: string[]; // ids of upstream nodes
  outputs?: string[]; // ids of downstream nodes
  track?: string | null; // optional track association
};

type CanvasState = {
  nodes: AgentNode[];
  selectedId: string | null;
  addNode: (node: Partial<AgentNode>) => AgentNode;
  updateNode: (id: string, patch: Partial<AgentNode>) => void;
  removeNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  connectNodes: (fromId: string, toId: string) => void;
  disconnectNodes: (fromId: string, toId: string) => void;
  saveLocal: (key?: string) => void;
  loadLocal: (key?: string) => void;
  loadDemoCanvas: () => void;
  clear: () => void;
};

const DEMO_TRACKS = ["sebring", "road_america", "cota", "sonoma", "vir", "barber"];

const createDemoNode = (type: string, track?: string | null) => ({
  id: nanoid(),
  type,
  title: type.replaceAll('_', ' ').toUpperCase(),
  x: Math.floor(Math.random() * 800),
  y: Math.floor(Math.random() * 400),
  config: { param1: Math.round(Math.random() * 100) / 100, description: `${type} demo config` },
  inputs: [],
  outputs: [],
  track: track || null
});

const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  selectedId: null,
  addNode: (node) => {
    const newNode = {
      id: nanoid(),
      type: node.type || 'agent',
      title: node.title || (node.type || 'agent'),
      x: node.x || 100,
      y: node.y || 100,
      config: node.config || {},
      inputs: node.inputs || [],
      outputs: node.outputs || [],
      track: node.track || null
    };
    set(state => ({ nodes: [...state.nodes, newNode], selectedId: newNode.id }));
    return newNode as AgentNode;
  },
  updateNode: (id, patch) =>
    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? { ...n, ...patch } : n))
    })),
  removeNode: (id) =>
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    })),
  selectNode: (id) => set({ selectedId: id }),
  connectNodes: (fromId, toId) =>
    set(state => {
      const nodes = state.nodes.map(n => {
        if (n.id === fromId && !(n.outputs || []).includes(toId))
          return { ...n, outputs: [...(n.outputs || []), toId] };
        if (n.id === toId && !(n.inputs || []).includes(fromId))
          return { ...n, inputs: [...(n.inputs || []), fromId] };
        return n;
      });
      return { nodes };
    }),
  disconnectNodes: (fromId, toId) =>
    set(state => {
      const nodes = state.nodes.map(n => {
        if (n.id === fromId) return { ...n, outputs: (n.outputs || []).filter(x => x !== toId) };
        if (n.id === toId) return { ...n, inputs: (n.inputs || []).filter(x => x !== fromId) };
        return n;
      });
      return { nodes };
    }),
  saveLocal: (key = 'canvas_v1') => {
    const data = JSON.stringify(get().nodes);
    localStorage.setItem(key, data);
  },
  loadLocal: (key = 'canvas_v1') => {
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      set({ nodes: parsed });
    } catch (e) {
      console.error('loadLocal parse', e);
    }
  },
  loadDemoCanvas: () => {
    // seed demo graph: one ingest -> EDA -> predictor -> strategy -> coach -> broadcast, and one simulation branch
    const nodes = [];
    const track = DEMO_TRACKS[Math.floor(Math.random() * DEMO_TRACKS.length)];
    const ingest = createDemoNode('ingest_agent', track);
    const eda = createDemoNode('eda_agent', track);
    const predictor = createDemoNode('predictor_agent', track);
    const strategy = createDemoNode('strategy_agent', track);
    const coach = createDemoNode('coach_agent', track);
    const sim = createDemoNode('simulation_agent', track);
    const narr = createDemoNode('narrator_agent', track);
    // place nicely
    ingest.x = 40;
    ingest.y = 60;
    eda.x = 260;
    eda.y = 60;
    predictor.x = 480;
    predictor.y = 40;
    strategy.x = 700;
    strategy.y = 40;
    coach.x = 700;
    coach.y = 160;
    sim.x = 480;
    sim.y = 160;
    narr.x = 920;
    narr.y = 80;
    // connect
    ingest.outputs = [eda.id];
    eda.inputs = [ingest.id];
    eda.outputs = [predictor.id];
    predictor.inputs = [eda.id];
    predictor.outputs = [strategy.id, sim.id];
    strategy.inputs = [predictor.id];
    strategy.outputs = [coach.id, narr.id];
    sim.inputs = [predictor.id];
    sim.outputs = [narr.id];
    coach.inputs = [strategy.id];
    narr.inputs = [strategy.id, sim.id];

    nodes.push(ingest, eda, predictor, strategy, coach, sim, narr);
    set({ nodes, selectedId: null });
  },
  clear: () => set({ nodes: [], selectedId: null })
}));

export default useCanvasStore;

