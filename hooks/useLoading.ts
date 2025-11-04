// hooks/useLoading.ts
import { useState, useCallback } from 'react';

export default function useLoading() {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async <T>(fn: () => Promise<T>): Promise<T> => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, withLoading };
}