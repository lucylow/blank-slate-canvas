/**
 * Demo component showing PitWindowCard with demo mode toggle
 * This can be integrated into any page or used standalone
 */
import React, { useEffect, useState } from "react";
import PitWindowCard from "./PitWindowCard";
import { useSSE } from "@/hooks/useSSE";
import { useBackendConfig } from "@/hooks/useBackendConfig";

interface PitWindowInsight {
  predictions?: {
    pit_now_delta?: number | null;
    pit_now_risk?: number | string | null;
    stay_out_delta?: number | null;
    stay_out_risk?: number | string | null;
  };
  explanation?: {
    top_features?: Array<{ name: string; value: number }>;
    pred_median?: number;
    ci_5?: number;
    ci_95?: number;
    model_version?: string;
  };
  model_version?: string;
}

export default function PitWindowDemo() {
  const [demoMode, setDemoMode] = useState(true);
  const [insight, setInsight] = useState<PitWindowInsight | null>(null);
  const { backendUrl } = useBackendConfig();

  useEffect(() => {
    // In demo mode, fetch sample insight from demo endpoint or static file
    if (demoMode) {
      // Try to fetch from demo endpoint
      fetch(`${backendUrl}/demo/seed/pit_window_demo.json`)
        .then((r) => r.json())
        .then((data) => {
          // Expected structure: { predictions: {...}, explanation: {...}, model_version: "tire-v1.0" }
          setInsight(data);
        })
        .catch(() => {
          // Fallback: call analytics/tire-wear to generate on-the-fly example
          fetch(`${backendUrl}/api/analytics/tire-wear`)
            .then((r) => r.json())
            .then((j) => {
              setInsight({
                predictions: {
                  pit_now_delta: j.result.pred_median,
                  pit_now_risk: 22,
                  stay_out_delta: j.result.pred_median + 1.2,
                  stay_out_risk: 35,
                },
                explanation: j.result,
                model_version: j.result.model_version,
              });
            })
            .catch((err) => {
              console.error("Failed to load demo insight", err);
            });
        });
    }
  }, [demoMode, backendUrl]);

  // Example SSE hook for live updates (when demoMode==false)
  useSSE(
    demoMode ? "" : `${backendUrl}/sse/live/GR86-002`,
    (msg) => {
      // msg is the SSE payload; convert to insight shape if necessary
      setInsight(msg as PitWindowInsight);
    }
  );

  return (
    <div style={{ padding: 20 }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>PitWall A.I. — Demo</h2>
        <label
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
          />
          Demo mode
        </label>
      </header>

      <main>
        <PitWindowCard insight={insight} />
      </main>
    </div>
  );
}

