// src/stores/agentStore.ts
import create from 'zustand';

export type InsightSummary = {
  insight_id: string;
  track?: string;
  chassis?: string;
  summary?: string;
  created_at?: string;
  model_version?: string;
  short_explanation?: any;
};

export type InsightFull = InsightSummary & {
  predictions?: any;
  explanation?: any;
  evidence?: any[]; // small evidence list
  artifact_path?: string; // reference to S3 or artifact dir
};

type AgentState = {
  insights: Record<string, InsightFull>;
  insightOrder: string[]; // newest first
  agents: Record<string, { id: string; types: string[]; tracks: string[]; status?: string }>;
  tasks: Record<string, any>;
  loadingInsights: Record<string, boolean>;
  addInsightSummary: (s: InsightSummary) => void;
  setInsightFull: (id: string, full: InsightFull) => void;
  getInsight: (id: string) => InsightFull | undefined;
  setAgentStatus: (id: string, status: string) => void;
  addTask: (task: any) => void;
};

export const useAgentStore = create<AgentState>((set, get) => ({
  insights: {},
  insightOrder: [],
  agents: {},
  tasks: {},
  loadingInsights: {},
  addInsightSummary: (s) => {
    set((state) => {
      if (!state.insights[s.insight_id]) {
        const full = { ...s } as InsightFull;
        return {
          insights: { ...state.insights, [s.insight_id]: full },
          insightOrder: [s.insight_id, ...state.insightOrder].slice(0, 2000),
        };
      }
      return state;
    });
  },
  setInsightFull: (id, full) => set((state) => ({ insights: { ...state.insights, [id]: full } })),
  getInsight: (id) => get().insights[id],
  setAgentStatus: (id, status) => set((s) => ({ agents: { ...s.agents, [id]: { ...(s.agents[id] || { id, types: [], tracks: [] }), status } } })),
  addTask: (task) => set((s) => ({ tasks: { ...s.tasks, [task.task_id || (`t-${Date.now()}`)]: task } })),
}));
