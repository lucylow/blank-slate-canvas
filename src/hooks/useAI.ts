// src/hooks/useAI.ts
// Central export file for all AI hooks
// Provides convenient access to all AI-related React hooks

export { useAIDashboard } from "./useAIDashboard";
export { useAITireWear, useAITireWearMutation } from "./useAITireWear";
export { useAIPerformance, useAIPerformanceMutation } from "./useAIPerformance";
export { useAIStrategy, useAIStrategyMutation } from "./useAIStrategy";
export { useAIGapAnalysis, useAIGapAnalysisMutation } from "./useAIGapAnalysis";
export { useAIModelEval } from "./useAIModelEval";
export { 
  useAIAnalytics, 
  useRealTimeAIAnalytics, 
  useAnalyzeRaceData,
  useComprehensiveAnalytics 
} from "./useAIAnalytics";

// Re-export types for convenience
export type {
  DashboardData,
  TireWearData,
  PerformanceMetrics,
  GapAnalysis,
  StrategyOptimization,
  TireWearRequest,
  PerformanceRequest,
  StrategyRequest,
} from "@/api/pitwall";


