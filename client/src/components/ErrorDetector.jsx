import React, { useState, useEffect } from 'react';

const ErrorDetector = () => {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // No Chrome extension error filtering; all errors will be shown.

    // Capture console errors
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      


      const error = {
        id: Date.now(),
        type: 'Console Error',
        message: message,
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      };
      setErrors(prev => [...prev, error]);
      setIsVisible(true);
      originalError.apply(console, args);
    };

    // Capture unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      const message = event.reason?.message || event.reason || 'Unknown error';
      


      const error = {
        id: Date.now(),
        type: 'Unhandled Promise Rejection',
        message: message,
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack || 'No stack trace available'
      };
      setErrors(prev => [...prev, error]);
      setIsVisible(true);
    };

    // Capture JavaScript errors
    const handleError = (event) => {
      const message = event.message || 'Unknown error';
      


      const error = {
        id: Date.now(),
        type: 'JavaScript Error',
        message: message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        stack: event.error?.stack || 'No stack trace available'
      };
      setErrors(prev => [...prev, error]);
      setIsVisible(true);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const copyErrorToClipboard = (error) => {
    const errorText = `
🐛 ERROR DETECTED:
Type: ${error.type}
Time: ${error.timestamp}
Message: ${error.message}
${error.filename ? `File: ${error.filename}:${error.lineno}:${error.colno}` : ''}

Stack Trace:
${error.stack}

---
Please copy this error and paste it to GitHub Copilot for debugging.
    `.trim();

    navigator.clipboard.writeText(errorText);
    alert('Error copied to clipboard! Paste it to GitHub Copilot for help.');
  };

  const clearErrors = () => {
    setErrors([]);
    setIsVisible(false);
  };

  if (!isVisible || errors.length === 0) return null;

  return (
    <div className="error-detector">
      <div className="error-overlay">
        <div className="error-panel">
          <div className="error-header">
            <h3>🐛 Error Detected</h3>
            <button onClick={() => setIsVisible(false)} className="close-btn">×</button>
          </div>
          <div className="error-list">
            {errors.map(error => (
              <div key={error.id} className="error-item">
                <div className="error-info">
                  <strong>{error.type}</strong>
                  <span className="error-time">{new Date(error.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="error-message">{error.message}</div>
                {error.filename && (
                  <div className="error-location">
                    📁 {error.filename}:{error.lineno}:{error.colno}
                  </div>
                )}
                <button 
                  onClick={() => copyErrorToClipboard(error)}
                  className="copy-error-btn"
                >
                  📋 Copy for Debugging
                </button>
              </div>
            ))}
          </div>
          <div className="error-actions">
            <button onClick={clearErrors} className="clear-btn">Clear All</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDetector;
