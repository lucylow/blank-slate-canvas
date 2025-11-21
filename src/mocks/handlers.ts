// src/mocks/handlers.ts
// MSW handlers for offline/demo mode

import { http, HttpResponse } from 'msw';

const API_BASE = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_BASE || '';

// Mock prediction data
const mockPredictions: Record<string, {
  chassis: string;
  track: string;
  predicted_loss_per_lap_s: number;
  laps_until_0_5s_loss: number;
  recommended_pit_lap: number;
  feature_scores: Array<{ name: string; score: number }>;
  explanation: string[];
  meta: {
    model_version: string;
    generated_at: string;
    demo: boolean;
  };
}> = {
  cota: {
    chassis: "GR86-DEMO-01",
    track: "cota",
    predicted_loss_per_lap_s: 0.34,
    laps_until_0_5s_loss: 1.47,
    recommended_pit_lap: 8,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.42 },
      { name: "brake_energy_S1", score: 0.19 },
      { name: "avg_speed_S3", score: -0.05 },
      { name: "lateral_g_S2", score: 0.31 },
      { name: "surface_temp_delta", score: 0.15 },
    ],
    explanation: [
      "Elevated lateral load in S2 (+0.42)",
      "Repeated heavy braking in S1 (+0.19)",
      "Rising surface temperature +2.2°C last 3 laps",
      "High lateral G-forces in sector 2",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
  road_america: {
    chassis: "GR86-DEMO-01",
    track: "road_america",
    predicted_loss_per_lap_s: 0.28,
    laps_until_0_5s_loss: 1.79,
    recommended_pit_lap: 12,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.35 },
      { name: "brake_energy_S1", score: 0.22 },
      { name: "avg_speed_S3", score: 0.08 },
    ],
    explanation: [
      "Moderate tire stress in sector 2",
      "Heavy braking zones in sector 1",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
  barber: {
    chassis: "GR86-DEMO-01",
    track: "barber",
    predicted_loss_per_lap_s: 0.31,
    laps_until_0_5s_loss: 1.61,
    recommended_pit_lap: 10,
    feature_scores: [
      { name: "tire_stress_S2", score: 0.38 },
      { name: "brake_energy_S1", score: 0.18 },
    ],
    explanation: [
      "High tire stress in sector 2",
      "Moderate brake energy in sector 1",
    ],
    meta: {
      model_version: "v1.2.3-demo",
      generated_at: new Date().toISOString(),
      demo: true,
    },
  },
};

// Generate mock prediction for any track
function getMockPrediction(track: string, chassis: string) {
  const base = mockPredictions[track] || mockPredictions.cota;
  return {
    ...base,
    track,
    chassis,
    predicted_loss_per_lap_s: base.predicted_loss_per_lap_s + (Math.random() * 0.1 - 0.05),
    laps_until_0_5s_loss: base.laps_until_0_5s_loss + (Math.random() * 0.3 - 0.15),
    meta: {
      ...base.meta,
      generated_at: new Date().toISOString(),
    },
  };
}

export const handlers = [
  // Health check
  http.get(`${API_BASE}/health`, () => {
    return HttpResponse.json({
      ok: true,
      model_versions: {
        cota: "v1.2.3-demo",
        road_america: "v1.2.3-demo",
        barber: "v1.2.3-demo",
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Models endpoint
  http.get(`${API_BASE}/models`, () => {
    return HttpResponse.json({
      cota: "v1.2.3-demo",
      road_america: "v1.2.3-demo",
      barber: "v1.2.3-demo",
      sebring: "v1.2.3-demo",
      sonoma: "v1.2.3-demo",
      indianapolis: "v1.2.3-demo",
      virginia: "v1.2.3-demo",
    });
  }),

  // Predict tire endpoint
  http.get(`${API_BASE}/predict_tire/:track/:chassis`, ({ params }) => {
    const { track, chassis } = params;
    
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => {
        const prediction = getMockPrediction(track as string, chassis as string);
        resolve(HttpResponse.json(prediction));
      }, 300 + Math.random() * 200);
    });
  }),

  // Simulate endpoint
  http.post(`${API_BASE}/simulate`, async ({ request }) => {
    const body = await request.json() as { track?: string; chassis?: string; strategy?: unknown };
    
    return HttpResponse.json({
      track: body.track,
      chassis: body.chassis,
      strategy: body.strategy,
      results: {
        projected_finish: "P3",
        total_time: "45:23.456",
        pit_stops: 2,
      },
      meta: {
        generated_at: new Date().toISOString(),
        demo: true,
      },
    });
  }),
];

