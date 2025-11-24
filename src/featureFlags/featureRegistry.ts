// src/featureFlags/featureRegistry.ts
// Central registry for all feature flags

export const FEATURE_FLAGS = {
  impact_democratize_analytics: {
    name: "Democratize Pro Analytics",
    description: "Enables analytics & dashboards designed for smaller GR Cup teams.",
    default: false,
  },
  impact_driver_coaching: {
    name: "Driver Coaching AI",
    description: "Activates real-time coaching alerts, fingerprinting, and corner feedback.",
    default: false,
  },
  impact_anomaly_strategy: {
    name: "Anomaly-Driven Strategy Engine",
    description: "Allows smoke/debris/overheat events to trigger strategy recalculations.",
    default: false,
  },
  impact_scaling_otherseries: {
    name: "Scaling to Other Racing Series",
    description: "Shows GT4 / Endurance / Grassroots modes & multi-series data models.",
    default: false,
  },
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;


