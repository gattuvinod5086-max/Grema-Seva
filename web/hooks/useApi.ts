import { useState, useEffect, useCallback } from 'react';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

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
      const response = await fetch(url, { credentials: 'include' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new ApiError(body?.error?.message ?? `Request failed (${response.status})`, response.status, body?.error?.code);
      }
      setData(body);
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
