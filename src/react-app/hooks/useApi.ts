import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions {
  enabled?: boolean;
}

export function useApi<T>(url: string, options: UseApiOptions = {}) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [url, enabled, refetch]);

  return { data, loading, error, refetch, isLoading: loading };
}
