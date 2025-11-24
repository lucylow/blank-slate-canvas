import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

import { connectAgentWS } from "../lib/agentWSClient";
import { fetchMockAgents } from "../lib/backendClient";
import { WSClient } from "../lib/wsClient";

/**
 * DriverFingerprinting.tsx — Realtime WS integration
 *
 * This variant wires the driver fingerprint page to the backend mock WebSocket
 * at ws://localhost:4001/ws/agents. Incoming agent events will:
 *  - add alerts for anomalies (high severity)
 *  - add coaching suggestions for predictor/simulator events
 *  - surface explainer results in a small "recentExplainers" feed
 *
 * Make sure:
 *  - backend mock server is running: backend/index.js (port 4001)
 *  - ws client helper exists at src/lib/agentWSClient.ts
 *  - backendClient.fetchMockAgents exists at src/lib/backendClient.ts
 *
 * Design doc path (local): (per dev instructions)
 * /mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (2).docx
 */

/* -------------------- Utilities -------------------- */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Fingerprint {
  Aggressiveness: number;
  Smoothness: number;
  BrakingConsistency: number;
  LateApex: number;
  CornerEntry: number;
  TireManagement: number;
}

interface Alert {
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
}

interface Lap {
  lap: number;
  lap_time: number;
}

interface DriverData {
  driverId: number;
  track: string;
  fingerprint: Fingerprint;
  laps: Lap[];
  sectors: number[];
  alerts: Alert[];
  coachingPlan: string[];
  recentExplainers: Array<{
    ts: string;
    agent: string;
    summary: string;
  }>;
}

interface AgentEvent {
  agent?: string;
  type?: string;
  insight?: string;
  detail?: string;
  sector?: number;
  confidence?: number;
  conf?: number;
  car_id?: number;
  laps_until_cliff?: number;
  laps?: number;
  recommended_pit_lap?: number;
  pit_lap?: number;
  expected_gain_s?: number;
  expected_gain?: number;
  ts?: string;
  features?: Array<{ name: string; impact: number }>;
}

function generateDriverMockData(driverId: number = 13, track: string = "COTA"): DriverData {
  const rng = seededRandom(1000 + driverId);
  const fingerprint: Fingerprint = {
    Aggressiveness: Math.round(30 + rng() * 60),
    Smoothness: Math.round(20 + rng() * 70),
    BrakingConsistency: Math.round(25 + rng() * 70),
    LateApex: Math.round(10 + rng() * 80),
    CornerEntry: Math.round(20 + rng() * 70),
    TireManagement: Math.round(20 + rng() * 80)
  };

  const laps: Lap[] = Array.from({ length: 15 }, (_, i) => {
    const base = 120 + ((driverId % 10) * 0.5) + rng() * 3;
    const degradation = ((100 - fingerprint.TireManagement) / 200) * i * rng();
    const lap = +(base + degradation + (rng() - 0.5) * 0.6).toFixed(3);
    return { lap: i + 1, lap_time: lap };
  });

  const sectors: number[] = [1, 2, 3].map((s) => {
    const base = 85 - (fingerprint.Aggressiveness / 2) + (rng() * 10);
    return Math.max(50, Math.round(base - (s - 1) * (rng() * 6)));
  });

  const alerts: Alert[] = [];
  if (fingerprint.BrakingConsistency < 40) {
    alerts.push({ severity: "high", title: "Braking inconsistency", detail: "Large variance in brake pressure across laps." });
  }
  if (fingerprint.TireManagement < 45) {
    alerts.push({ severity: "medium", title: "Tire wear risk", detail: "Low tire management score — expect early degradation." });
  }
  if (fingerprint.LateApex > 70) {
    alerts.push({ severity: "low", title: "Late apex tendency", detail: "Driver tends to apex late; coaching may improve exit speed." });
  }

  const coachingPlan: string[] = [];
  if (fingerprint.Smoothness < 50) coachingPlan.push("Drill: progressive throttle exits — 20 laps, focus on smooth roll-on.");
  if (fingerprint.BrakingConsistency < 50) coachingPlan.push("Exercise: brake release timing — 10 corner repeats with telemetry review.");
  if (fingerprint.TireManagement < 50) coachingPlan.push("Session: long-stint simulation to practice tyre conservation.");

  return {
    driverId,
    track,
    fingerprint,
    laps,
    sectors,
    alerts,
    coachingPlan,
    recentExplainers: []
  };
}

/* -------------------- Small UI helpers -------------------- */
function Badge({ children, color = "gray" }: { children: React.ReactNode; color?: "gray" | "red" | "yellow" | "green" }) {
  const bg = {
    gray: "#e6e9ee",
    red: "#fee2e2",
    yellow: "#fff7ed",
    green: "#ecfdf5",
  }[color] || "#e6e9ee";
  const text = {
    gray: "#334155",
    red: "#991b1b",
    yellow: "#92400e",
    green: "#065f46"
  }[color] || "#334155";

  return (
    <span style={{ background: bg, color: text, padding: "6px 10px", borderRadius: 999, fontWeight: 700, fontSize: 12 }}>
      {children}
    </span>
  );
}

function HeatCell({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  let bg: string;
  if (v > 75) bg = `rgba(16,185,129, ${0.12 + (v-75)/100})`;
  else if (v > 50) bg = `rgba(253,224,71, ${0.12 + (v-50)/100})`;
  else bg = `rgba(239,68,68, ${0.08 + v/200})`;
  return (
    <div style={{
      width: 78, height: 48, display: "flex", alignItems: "center",
      justifyContent: "center", borderRadius: 8, background: bg, color: "#0f1724", fontWeight: 700
    }}>
      {value}%
    </div>
  );
}

function radarDataFromFingerprint(fp: Fingerprint) {
  return Object.entries(fp).map(([k, v]) => ({ subject: k, A: v }));
}

/* -------------------- Page Component -------------------- */

export default function DriverFingerprintingPage() {
  const drivers = [13, 22, 46, 72];
  const [selected, setSelected] = useState(13);
  const [compareWith, setCompareWith] = useState<number | null>(null);
  const [data, setData] = useState<DriverData>(() => generateDriverMockData(13));
  const [compareData, setCompareData] = useState<DriverData | null>(null);
  const [lapRange, setLapRange] = useState<[number, number]>([1, 15]);
  const [liveEvents, setLiveEvents] = useState<AgentEvent[]>([]);
  const wsRef = useRef<WSClient | null>(null);

  // DESIGN DOC path (local) per developer instruction
  const DESIGN_DOC_PATH = "/mnt/data/3. Hack the Track presented by Toyota GR_ real time analytics. PitWall A.I.  (2).docx";

  useEffect(() => {
    setData(generateDriverMockData(selected));
    setCompareData(compareWith ? generateDriverMockData(compareWith) : null);
  }, [selected, compareWith]);

  // connect to backend WS and fetch initial events via REST
  useEffect(() => {
    let mounted = true;
    // seed existing mock events into liveEvents for context
    fetchMockAgents().then(arr => {
      if (!mounted) return;
      // map to show only those related to driver if possible, and seed alerts
      setLiveEvents(prev => [...(arr || []), ...prev].slice(0, 60));
      // also convert initial messages into page alerts/coaching where relevant
      arr.forEach(ev => handleIncomingAgentEvent(ev));
    }).catch(() => {});

    // connect ws
    const ws = connectAgentWS({
      onEvent: (payload: AgentEvent) => {
        if (!mounted) return;
        setLiveEvents(prev => [payload, ...prev].slice(0, 200));
        handleIncomingAgentEvent(payload);
      },
      onFlags: () => {},
      onOpen: () => {}
    });

    wsRef.current = ws;
    return () => {
      mounted = false;
      try { ws.close(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, compareWith]);

  // helper to append a new alert in a safe immutable way
  function pushAlert(newAlert: Alert) {
    setData(prev => {
      const nextAlerts = [newAlert, ...(prev.alerts || [])].slice(0, 8);
      return { ...prev, alerts: nextAlerts };
    });
  }

  // helper to append a coaching suggestion
  function pushCoaching(suggestion: string) {
    setData(prev => {
      const nextPlan = [suggestion, ...(prev.coachingPlan || [])].slice(0, 12);
      return { ...prev, coachingPlan: nextPlan };
    });
  }

  // handle an incoming agent event (mapping to UI updates)
  function handleIncomingAgentEvent(ev: AgentEvent) {
    if (!ev || typeof ev !== "object") return;

    // normalize keys
    const agent = ev.agent || ev.type || "unknown";
    // If the event includes a car_id filter and it's different than selected, we still show it in live feed,
    // but only create driver-specific alerts/coaching when car matches the current selected driver.
    const eventCar = ev.car_id;

    // ANOMALY events -> high severity alerts
    if (agent === "anomaly" || ev.insight === "smoke_detected" || ev.type === "smoke_detected") {
      const alert: Alert = {
        severity: "high",
        title: `Anomaly: ${ev.insight || ev.type || "anomaly detected"}`,
        detail: ev.detail || `Car ${eventCar ?? "?"} — sector ${ev.sector ?? "-" } — conf ${ev.confidence ?? ""}`
      };
      pushAlert(alert);
      // if it's for the selected driver, push a coaching suggestion to pit immediately review
      if (eventCar === selected) {
        pushCoaching(`Immediate: inspect Car #${selected} — anomaly detected (${ev.insight || ev.type}).`);
      }
      return;
    }

    // PREDICTOR events -> tire/cliff predictions
    if (agent === "predictor" || ev.insight === "tire_cliff_estimated") {
      // show a medium severity alert for select driver
      const laps = ev.laps_until_cliff ?? ev.laps ?? null;
      const confidence = ev.confidence ?? ev.conf ?? null;
      const title = laps ? `Tire cliff in ~${laps} lap(s)` : "Tire degradation predicted";
      const alert: Alert = {
        severity: "medium",
        title,
        detail: eventCar ? `Car ${eventCar} • conf ${Math.round((confidence || 0) * 100)}%` : `conf ${Math.round((confidence || 0)*100)}%`
      };
      pushAlert(alert);
      if (eventCar === selected && laps) {
        pushCoaching(`Plan: consider pit before lap ${ (data.laps[data.laps.length-1]?.lap ?? 0) + laps } (est. ${laps} laps).`);
      }
      return;
    }

    // SIMULATOR events -> strategy recommendations
    if (agent === "simulator" || ev.insight === "pit_recommendation") {
      const recLap = ev.recommended_pit_lap ?? ev.pit_lap ?? null;
      const gain = ev.expected_gain_s ?? ev.expected_gain ?? null;
      const alert: Alert = {
        severity: "medium",
        title: recLap ? `Pit recommended Lap ${recLap}` : "Simulator strategy update",
        detail: gain ? `Expected gain: ${gain}s` : ""
      };
      pushAlert(alert);
      if (eventCar === selected && recLap) {
        pushCoaching(`Simulator: recommended pit on Lap ${recLap} (gain ~${gain ?? "N/A"}s).`);
      }
      return;
    }

    // EXPLAINER events -> show feature attribution feed (recentExplainers)
    if (agent === "explainer" || ev.insight === "shap_top_features") {
      // attach explainer feed to page data
      const explainerEntry = {
        ts: ev.ts || new Date().toISOString(),
        agent: agent,
        summary: ev.features ? ev.features.map(f => `${f.name}:${Math.round(f.impact*100)}%`).join(", ") : JSON.stringify(ev)
      };
      // Update data.recentExplainers
      setData(prev => {
        const prevExpl = prev.recentExplainers || [];
        const next = { ...prev, recentExplainers: [explainerEntry, ...prevExpl].slice(0, 6) };
        return next;
      });

      // optionally create a low-severity alert if matches selected car
      if (eventCar === selected) {
        pushAlert({
          severity: "low",
          title: "Explainer: top features",
          detail: explainerEntry.summary
        });
      }
      return;
    }

    // Generic / unknown events -> append to live feed only
    // (handled by liveEvents already)
  }

  /* -------------------- Derived UI data -------------------- */
  const radarData = useMemo(() => radarDataFromFingerprint(data.fingerprint), [data]);
  const radarCompareData = useMemo(() => compareData ? radarDataFromFingerprint(compareData.fingerprint) : null, [compareData]);
  const lapSeries = useMemo(() => {
    const [low, high] = lapRange;
    const inRange = data.laps.filter(l => l.lap >= low && l.lap <= high);
    const formatted = inRange.map(d => ({ name: `L${d.lap}`, lap: d.lap, time: d.lap_time }));
    if (compareData) {
      const compRangeData = compareData.laps.filter(l => l.lap >= low && l.lap <= high)
        .map(d => ({ name: `L${d.lap}`, lap: d.lap, comp_time: d.lap_time }));
      return formatted.map(f => ({ ...f, comp_time: (compRangeData.find(c => c.lap === f.lap) || {}).comp_time }));
    }
    return formatted;
  }, [data, compareData, lapRange]);

  const sectorCells = data.sectors;
  const compareSectorCells = compareData ? compareData.sectors : null;

  /* -------------------- UI helpers -------------------- */
  function refresh() {
    setData(generateDriverMockData(selected));
    if (compareWith) setCompareData(generateDriverMockData(compareWith));
  }

  function median(arr: number[]) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2) return sorted[mid];
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  function downloadJSON(obj: any, filename: string = "data.json") {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* -------------------- Render -------------------- */
  return (
    <main style={{ padding: 20, fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Driver Fingerprinting & Coaching</h1>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <a href={DESIGN_DOC_PATH} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#475569" }}>Design doc</a>
          <button onClick={() => { refresh(); }}
            style={{ padding: "8px 12px", background: "#0f1724", color: "#fff", borderRadius: 8, border: "none", cursor: "pointer" }}>
            Refresh
          </button>
        </div>
      </div>

      <section style={{ display: "grid", gridTemplateColumns: "320px 1fr 360px", gap: 16 }}>
        <aside style={{ background: "#fff", padding: 12, borderRadius: 12, boxShadow: "0 1px 3px rgba(2,6,23,0.06)" }}>
          <label style={{ display: "block", fontSize: 13, color: "#334155", marginBottom: 6 }}>Select Driver</label>
          <select value={selected} onChange={(e) => setSelected(Number(e.target.value))}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 8 }}>
            {drivers.map(d => <option key={d} value={d}>Driver #{d}</option>)}
          </select>

          <label style={{ display: "block", fontSize: 13, color: "#334155", margin: "8px 0 6px" }}>Compare With</label>
          <select value={compareWith ?? ""} onChange={(e) => setCompareWith(e.target.value ? Number(e.target.value) : null)}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <option value="">(none)</option>
            {drivers.filter(d => d !== selected).map(d => <option key={d} value={d}>Driver #{d}</option>)}
          </select>

          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: "8px 0" }}>Alerts</h3>
            {data.alerts.length === 0 ? <div style={{ color: "#94a3b8" }}>No active alerts</div> : (
              data.alerts.map((a, i) => (
                <div key={i} style={{
                  borderLeft: a.severity === "high" ? "4px solid #ef4444" : a.severity === "medium" ? "4px solid #f59e0b" : "4px solid #0ea5a4",
                  background: "#fff",
                  padding: 10, borderRadius: 8, marginBottom: 8
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700 }}>{a.title}</div>
                    <Badge color={a.severity === "high" ? "red" : a.severity === "medium" ? "yellow" : "green"}>{a.severity.toUpperCase()}</Badge>
                  </div>
                  <div style={{ marginTop: 6, color: "#475569" }}>{a.detail}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <h3 style={{ margin: "8px 0" }}>Coaching Plan (summary)</h3>
            {data.coachingPlan.length === 0 ? <div style={{ color: "#94a3b8" }}>No coaching recommended</div> : (
              <ol style={{ paddingLeft: 16 }}>
                {data.coachingPlan.map((c, i) => <li key={i} style={{ marginBottom: 8 }}>{c}</li>)}
              </ol>
            )}
            <button onClick={() => alert("Exported coaching plan (mock).")} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: "#06b6d4", color: "#fff", border: "none" }}>
              Export Plan
            </button>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 8 }}>Live Events (agent stream)</h4>
            <div style={{ maxHeight: 160, overflowY: "auto" }}>
              {liveEvents.length === 0 && <div style={{ color: "#94a3b8" }}>No events yet.</div>}
              {liveEvents.slice(0, 20).map((ev, i) => (
                <div key={i} style={{ fontSize: 12, padding: 8, borderRadius: 6, background: "#fbfbfb", marginBottom: 6 }}>
                  <div style={{ color: "#64748b" }}>{ev.ts || new Date().toISOString()}</div>
                  <div style={{ fontWeight: 700 }}>{ev.agent || ev.type}</div>
                  <div style={{ color: "#334155" }}>{ev.insight ? JSON.stringify(ev.insight).slice(0, 140) : JSON.stringify(ev).slice(0, 140)}</div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        <main style={{ background: "#fff", padding: 14, borderRadius: 12 }}>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ width: 360, height: 320 }}>
              <h4 style={{ margin: 0 }}>Driving Fingerprint</h4>
              <p style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>Radar shows normalized metrics (0 - 100)</p>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name={`Driver #${data.driverId}`} dataKey="A" stroke="#0ea5a4" fill="#0ea5a4" fillOpacity={0.3} />
                  {radarCompareData && <Radar name={`#${compareData.driverId}`} dataKey="A" data={radarCompareData} stroke="#f97316" fill="#f97316" fillOpacity={0.15} />}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: 0 }}>Lap Time Trend</h4>
              <p style={{ marginTop: 6, color: "#64748b", fontSize: 13 }}>Select lap window to focus analysis</p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: "#475569" }}>Laps</label>
                <input type="number" min={1} max={15} value={lapRange[0]} onChange={(e) => setLapRange([Math.max(1, Number(e.target.value)), lapRange[1]])} style={{ width: 64, padding: 6 }} />
                <span style={{ color: "#94a3b8" }}>to</span>
                <input type="number" min={1} max={15} value={lapRange[1]} onChange={(e) => setLapRange([lapRange[0], Math.min(15, Number(e.target.value))])} style={{ width: 64, padding: 6 }} />
                <div style={{ marginLeft: "auto", color: "#64748b", fontSize: 13 }}>Median: {median(lapSeries.map(d => d.time)).toFixed(3)} s</div>
              </div>

              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lapSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="time" stroke="#0f1724" name={`#${data.driverId}`} dot />
                    {compareData && <Line type="monotone" dataKey="comp_time" stroke="#ef4444" name={`#${compareData.driverId}`} dot />}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 8 }}>Sector Consistency (per-sector)</h4>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Driver #{data.driverId}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {sectorCells.map((v, idx) => <HeatCell key={idx} value={v} />)}
                </div>
              </div>

              {compareData && (
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Driver #{compareData.driverId}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {compareSectorCells?.map((v, idx) => <HeatCell key={idx} value={v} />)}
                  </div>
                </div>
              )}

              <div style={{ marginLeft: "auto", minWidth: 240 }}>
                <h5 style={{ marginBottom: 8 }}>Actionable Insights</h5>
                <ul style={{ paddingLeft: 16, color: "#334155" }}>
                  <li>Sector 2 shows highest variance — focus on entry stability drills.</li>
                  <li>Compare with teammate: see differences in sector3 exit speed.</li>
                </ul>
                <button onClick={() => alert("Added a focused drill to coaching plan (mock).")} style={{ marginTop: 8, padding: "8px 12px", background: "#0ea5a4", color: "#fff", borderRadius: 8, border: "none" }}>
                  Add Drill to Plan
                </button>
              </div>
            </div>
          </div>

        </main>

        <aside style={{ background: "#fff", padding: 12, borderRadius: 12 }}>
          <h3 style={{ marginTop: 0 }}>Comparison & Details</h3>
          <div style={{ fontSize: 13, color: "#475569" }}>
            {compareData ? (
              <div>
                <div style={{ fontWeight: 700 }}>Comparing #{data.driverId} vs #{compareData.driverId}</div>
                <div style={{ marginTop: 8 }}>
                  <div><strong>Lap median diff:</strong> {(median(data.laps.map(l => l.lap_time)) - median(compareData.laps.map(l => l.lap_time))).toFixed(3)} s</div>
                  <div><strong>Avg Tire Management:</strong> {Math.round((data.fingerprint.TireManagement + compareData.fingerprint.TireManagement)/2)}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: "#94a3b8" }}>Select a driver to compare or toggle compare to see differences.</div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <h4 style={{ marginBottom: 8 }}>Export & Share</h4>
            <p style={{ marginTop: 0, color: "#64748b", fontSize: 13 }}>Export fingerprint or coaching plan for driver briefings</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => downloadJSON(data, `driver-${data.driverId}-fingerprint.json`)} style={{
                padding: "8px 10px", borderRadius: 8, border: "none", background: "#0f1724", color: "#fff", cursor: "pointer"
              }}>Export Fingerprint</button>
              <button onClick={() => downloadJSON({ coachingPlan: data.coachingPlan }, `driver-${data.driverId}-coaching.json`)} style={{
                padding: "8px 10px", borderRadius: 8, border: "none", background: "#06b6d4", color: "#fff", cursor: "pointer"
              }}>Export Plan</button>
            </div>
          </div>

        </aside>
      </section>
    </main>
  );
}

