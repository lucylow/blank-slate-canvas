import React from "react";

interface TopFeature {
  name: string;
  value: number;
}

interface PitWindowInsight {
  predictions?: {
    pit_now_delta?: number | null;
    pit_now_risk?: number | string | null;
    stay_out_delta?: number | null;
    stay_out_risk?: number | string | null;
  };
  explanation?: {
    top_features?: TopFeature[];
    pred_median?: number;
    ci_5?: number;
    ci_95?: number;
    model_version?: string;
  };
  model_version?: string;
}

interface PitWindowCardProps {
  insight: PitWindowInsight | null;
}

export default function PitWindowCard({ insight }: PitWindowCardProps) {
  if (!insight) {
    return (
      <div className="card pit-window" style={{ padding: 16 }}>
        <h3>Pit Window</h3>
        <div style={{ color: "#666" }}>No insight loaded (demo mode may be off).</div>
      </div>
    );
  }

  const { predictions, explanation, model_version } = insight;
  const predNow = predictions?.pit_now_delta ?? predictions?.pred_median ?? null;
  const stayOut = predictions?.stay_out_delta ?? null;

  return (
    <div
      className="card pit-window"
      style={{
        padding: 16,
        borderRadius: 8,
        border: "1px solid #ddd",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Pit Window</h3>
        <small>Model: {model_version ?? explanation?.model_version ?? "unknown"}</small>
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
        <div
          style={{
            flex: 1,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 6,
          }}
        >
          <h4 style={{ margin: "6px 0" }}>Pit Now</h4>
          <div>
            Δ time:{" "}
            <strong>
              {predNow !== null ? `${Number(predNow).toFixed(2)}s` : "—"}
            </strong>
          </div>
          <div>
            Risk: <strong>{predictions?.pit_now_risk ?? "—"}%</strong>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: 12,
            border: "1px solid #eee",
            borderRadius: 6,
          }}
        >
          <h4 style={{ margin: "6px 0" }}>Stay Out</h4>
          <div>
            Δ time:{" "}
            <strong>
              {stayOut !== null ? `${Number(stayOut).toFixed(2)}s` : "—"}
            </strong>
          </div>
          <div>
            Risk: <strong>{predictions?.stay_out_risk ?? "—"}%</strong>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Top reasons:</strong>
        <ul style={{ marginTop: 8 }}>
          {(explanation?.top_features ?? []).map((f) => (
            <li key={f.name}>
              {f.name} — {(Number(f.value) * 100).toFixed(1)}%
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => alert("Simulate Pit Now — not wired in demo")}
          style={{ padding: "8px 12px" }}
        >
          Simulate Pit Now
        </button>
        <button
          onClick={() => alert("Export report — not wired in demo")}
          style={{ padding: "8px 12px" }}
        >
          Export PDF
        </button>
      </div>
    </div>
  );
}

