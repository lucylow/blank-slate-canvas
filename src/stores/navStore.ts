// src/stores/navStore.ts
// Global store (Zustand) for navigation + agent signals

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentStatus = {
  agentId: string;
  status: 'healthy' | 'degraded' | 'offline';
  latency_ms?: number;
  last_update?: number;
  alert?: { level: 'info' | 'warning' | 'critical', score: number, summary?: string };
  preview?: { insight_id: string, summary: string, confidence: number, ts: number } | null;
};

export type NavItem = {
  id: string;      // e.g. 'live', 'eda', 'predictor', 'dashboard', 'agents'
  title: string;
  icon?: string;
  pinned?: boolean;
  freq?: number;
  lastVisited?: number;
  manualOrder?: number | null;
  section?: 'static' | 'agent'; // Static app-level vs dynamic agent cards
  route?: string;  // Route path for navigation
  meta?: any;
};

type NavState = {
  items: NavItem[];
  agents: Record<string, AgentStatus>;
  alertBumps: Record<string, number>; // Track timebound alert bumps: agentId -> timestamp
  setItems: (items: NavItem[]) => void;
  updateItem: (id: string, patch: Partial<NavItem>) => void;
  setAgentStatus: (ag: AgentStatus) => void;
  pinItem: (id: string) => void;
  unpinItem: (id: string) => void;
  visitItem: (id: string) => void; // Track page visits for recency/frequency
  recordAlertBump: (agentId: string) => void; // Record when alert causes auto-bump
  persist: () => void;
  load: () => void;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  // Static app-level sections
  { id: 'home', title: 'Home', section: 'static', route: '/', freq: 0 },
  { id: 'dashboard', title: 'Dashboard', section: 'static', route: '/dashboard', freq: 0 },
  { id: 'comprehensive', title: 'Live', section: 'static', route: '/comprehensive', freq: 0 },
  { id: 'analytics', title: 'Analytics', section: 'static', route: '/analytics', freq: 0 },
  { id: 'tracks', title: 'Tracks', section: 'static', route: '/tracks', freq: 0 },
  { id: 'pitwall', title: 'Strategy', section: 'static', route: '/pitwall', freq: 0 },
  { id: 'about', title: 'About', section: 'static', route: '/about', freq: 0 },
  { id: 'settings', title: 'Settings', section: 'static', route: '/settings', freq: 0 },
  // Dynamic agent cards
  { id: 'eda', title: 'EDA Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'predictor', title: 'Predictor Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'coach', title: 'Coach Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'strategy', title: 'Strategy Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'simulator', title: 'Simulator Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'explainer', title: 'Explainer Agent', section: 'agent', route: '/agents', freq: 0 },
  { id: 'anomaly', title: 'Anomaly Detective', section: 'agent', route: '/agents', freq: 0 },
];

export const useNavStore = create<NavState>()(
  persist(
    (set, get) => ({
      items: [...DEFAULT_NAV_ITEMS],
      agents: {},
      alertBumps: {},
      
      setItems: (items) => set({ items }),
      
      updateItem: (id, patch) => set((state) => ({
        items: state.items.map((it) => it.id === id ? { ...it, ...patch } : it)
      })),
      
      setAgentStatus: (ag) => {
        set((state) => {
          const newAgents = { ...state.agents, [ag.agentId]: ag };
          
          // If alert score > 0.6, record a timebound bump
          if (ag.alert && ag.alert.score > 0.6) {
            const newBumps = { ...state.alertBumps, [ag.agentId]: Date.now() };
            return { agents: newAgents, alertBumps: newBumps };
          }
          
          return { agents: newAgents };
        });
      },
      
      pinItem: (id) => set((state) => ({
        items: state.items.map((it) => it.id === id ? { ...it, pinned: true } : it)
      })),
      
      unpinItem: (id) => set((state) => ({
        items: state.items.map((it) => it.id === id ? { ...it, pinned: false } : it)
      })),
      
      visitItem: (id) => set((state) => ({
        items: state.items.map((it) => {
          if (it.id === id) {
            return {
              ...it,
              freq: (it.freq || 0) + 1,
              lastVisited: Date.now()
            };
          }
          return it;
        })
      })),
      
      recordAlertBump: (agentId) => set((state) => ({
        alertBumps: { ...state.alertBumps, [agentId]: Date.now() }
      })),
      
      persist: () => {
        // Persist is handled by zustand persist middleware
        const state = get();
        localStorage.setItem('nav_order', JSON.stringify(state.items.map(it => ({
          id: it.id,
          pinned: it.pinned,
          manualOrder: it.manualOrder,
          freq: it.freq,
          lastVisited: it.lastVisited
        }))));
      },
      
      load: () => {
        try {
          const saved = localStorage.getItem('nav_order');
          if (saved) {
            const savedItems = JSON.parse(saved);
            const state = get();
            // Merge saved preferences with current items
            const merged = state.items.map(it => {
              const saved = savedItems.find((s: any) => s.id === it.id);
              return saved ? { ...it, ...saved } : it;
            });
            set({ items: merged });
          }
        } catch (e) {
          console.warn('Failed to load nav preferences:', e);
        }
      }
    }),
    {
      name: 'nav-storage',
      partialize: (state) => ({
        items: state.items.map(it => ({
          id: it.id,
          pinned: it.pinned,
          manualOrder: it.manualOrder,
          freq: it.freq,
          lastVisited: it.lastVisited
        }))
      })
    }
  )
);

