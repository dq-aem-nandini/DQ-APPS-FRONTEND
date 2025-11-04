// hooks/useLoading.ts
import { useState, useCallback } from 'react';

interface UseLoadingReturn<T = void> {
  loading: boolean;
  withLoading: <R = T>(fn: () => Promise<R>) => Promise<R>;
  startLoading: () => void;
  stopLoading: () => void;
}

export default function useLoading(initialState = false): UseLoadingReturn {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  const withLoading = useCallback(
    async <R = void>(fn: () => Promise<R>): Promise<R> => {
      setLoading(true);
      try {
        const result = await fn();
        return result;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, withLoading, startLoading, stopLoading };
}