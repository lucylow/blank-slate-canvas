// src/lib/backendClient.ts
// Client for backend REST API and feature flags

const API_BASE = import.meta.env.VITE_BACKEND_URL || "http://localhost:4001";
export const WS_URL = (import.meta.env.VITE_BACKEND_WS_URL || "ws://localhost:4001") + "/ws/agents";

export async function fetchFlags(): Promise<Record<string, boolean>> {
  try {
    const res = await fetch(`${API_BASE}/api/flags`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.debug("Failed to fetch flags from backend:", e);
    return {};
  }
}

export async function setFlags(payload: Record<string, boolean>): Promise<{ success: boolean; flags?: Record<string, boolean> }> {
  try {
    const res = await fetch(`${API_BASE}/api/flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.debug("Failed to set flags on backend:", e);
    return { success: false };
  }
}

export async function fetchMockAgents(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/api/mock_agents`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.debug("Failed to fetch mock agents:", e);
    return [];
  }
}

export async function saveInsight(insight: any): Promise<{ success: boolean; insight?: any }> {
  try {
    const res = await fetch(`${API_BASE}/api/insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(insight),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.debug("Failed to save insight:", e);
    return { success: false };
  }
}

