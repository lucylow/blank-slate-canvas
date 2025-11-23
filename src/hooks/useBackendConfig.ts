import { useState, useEffect } from 'react';
import { BackendConfig } from '@/lib/types';
import { getBackendUrl } from '@/utils/backendUrl';

export function useBackendConfig() {
  const [config, setConfig] = useState<BackendConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // getBackendUrl() returns empty string for relative paths, which is valid
    // Empty string means use relative paths (e.g., /api/config)
    const backendUrl = getBackendUrl();
    const API_URL = backendUrl !== null && backendUrl !== undefined 
      ? backendUrl 
      : (import.meta.env.DEV ? '' : '');
    
    // Empty string is valid (means use relative paths), so proceed with fetch
    fetch(`${API_URL}/api/config`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        setConfig(data);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load config');
        setLoading(false);
      });
  }, []);

  return { config, loading, error };
}

