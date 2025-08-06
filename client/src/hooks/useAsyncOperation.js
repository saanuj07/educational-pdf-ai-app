import { useState, useCallback } from 'react';

// Custom hook for async operations with error/loading state
export function useAsyncOperation(asyncFn, deps = []) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const res = await asyncFn(...args);
      setResult(res);
      return res;
    } catch (err) {
      setError(err);
      // Log error to localStorage
      const logs = JSON.parse(localStorage.getItem('frontend-errors') || '[]');
      logs.push({
        type: 'Async Operation',
        error: err.toString(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem('frontend-errors', JSON.stringify(logs));
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  return { run, loading, error, result };
}
