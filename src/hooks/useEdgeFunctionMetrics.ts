// src/hooks/useEdgeFunctionMetrics.ts
// React hook for edge function metrics with auto-refresh

import { useQuery } from '@tanstack/react-query';
import { getEdgeFunctionMetrics, type EdgeFunctionMetrics } from '@/api/edgeFunctions';

export function useEdgeFunctionMetrics() {
  return useQuery<Record<string, EdgeFunctionMetrics>>({
    queryKey: ['edge-function-metrics'],
    queryFn: getEdgeFunctionMetrics,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}



