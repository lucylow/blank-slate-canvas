import { useState, useEffect } from 'react';
import { loadAllTrackAnalyses, getTrackAnalysis, type TrackAnalysisData } from '@/utils/trackAnalysisLoader';

export function useTrackAnalysis(trackId?: string) {
  const [analyses, setAnalyses] = useState<TrackAnalysisData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadAnalyses() {
      try {
        setLoading(true);
        setError(null);
        const allAnalyses = await loadAllTrackAnalyses();
        setAnalyses(allAnalyses);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load track analyses'));
        console.error('Error loading track analyses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalyses();
  }, []);

  const trackAnalysis = trackId ? getTrackAnalysis(trackId, analyses) : undefined;

  return {
    analyses,
    trackAnalysis,
    loading,
    error,
  };
}

