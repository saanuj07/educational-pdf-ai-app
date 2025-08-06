import { useCallback } from 'react';

// Custom hook for consistent error handling in components
export function useErrorHandler() {
  return useCallback((err, context = {}) => {
    // Log error to localStorage
    const logs = JSON.parse(localStorage.getItem('frontend-errors') || '[]');
    logs.push({
      type: 'Component Error',
      error: err.toString(),
      context,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('frontend-errors', JSON.stringify(logs));
    // Optionally show toast or send to backend/Sentry
  }, []);
}
