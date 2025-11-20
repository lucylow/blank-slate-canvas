// src/api/pitwall.ts

export const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8081" : "/api";

export async function predictTire(track: string, chassis: string) {
  const url = `${API_BASE}/predict_tire/${encodeURIComponent(track)}/${encodeURIComponent(chassis)}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Predict endpoint failed");
  return resp.json();
}

// fetch multi-track predictions (parallel)
export async function predictMultiple(tracks: string[], chassis = "GR86-DEMO-01") {
  const promises = tracks.map(t => predictTire(t, chassis).catch(e => ({ error: e.toString(), track: t })));
  return Promise.all(promises);
}

