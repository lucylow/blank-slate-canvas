// src/hooks/useAIAnalytics.ts
// React hook for AI-powered data analytics using OpenAI and Gemini

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  performAIAnalytics,
  getRealTimeAIAnalytics,
  analyzeRaceData,
  type AIAnalyticsResponse,
  type AdvancedAnalyticsRequest,
  type RaceDataAnalytics,
  type GeminiOptions,
} from '@/api/aiAnalytics';

/**
 * Hook for performing AI analytics on race data
 */
export function useAIAnalytics() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: AdvancedAnalyticsRequest) => performAIAnalytics(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analytics'] });
    },
  });

  return {
    analyze: mutation.mutate,
    analyzeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Hook for real-time AI analytics
 */
export function useRealTimeAIAnalytics(
  track: string,
  race: number,
  vehicle?: number,
  lap?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['ai-analytics', 'realtime', track, race, vehicle, lap],
    queryFn: () => getRealTimeAIAnalytics(track, race, vehicle, lap),
    enabled: enabled && !!track && !!race,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 15000, // Consider data stale after 15 seconds
  });
}

/**
 * Hook for analyzing specific race data
 */
export function useAnalyzeRaceData() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      data,
      analysisType,
      model,
      geminiOptions,
    }: {
      data: RaceDataAnalytics;
      analysisType?: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive';
      model?: 'openai' | 'gemini' | 'both';
      geminiOptions?: GeminiOptions;
    }) => analyzeRaceData(data, analysisType, model, geminiOptions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-analytics'] });
    },
  });

  return {
    analyze: mutation.mutate,
    analyzeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    data: mutation.data,
    reset: mutation.reset,
  };
}

/**
 * Hook for comprehensive analytics with caching
 */
export function useComprehensiveAnalytics(
  data: RaceDataAnalytics | null,
  analysisType: 'comprehensive' | 'tire' | 'performance' | 'strategy' | 'predictive' = 'comprehensive',
  model: 'openai' | 'gemini' | 'both' = 'openai',
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['ai-analytics', 'comprehensive', data, analysisType, model],
    queryFn: () => {
      if (!data) throw new Error('No data provided');
      return performAIAnalytics({ data, analysisType, model });
    },
    enabled: enabled && !!data,
    staleTime: 60000, // Cache for 1 minute
    gcTime: 300000, // Keep in cache for 5 minutes
  });
}

