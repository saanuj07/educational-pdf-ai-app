import React, { useState } from 'react';

export default function ErrorLogViewer() {
  const [logs, setLogs] = useState(() => {
    return JSON.parse(localStorage.getItem('frontend-errors') || '[]');
  });

  const clearLogs = () => {
    localStorage.removeItem('frontend-errors');
    setLogs([]);
  };

  return (
    <div className="error-log-viewer">
      <h4>Frontend Error Log</h4>
      <button onClick={clearLogs}>Clear Log</button>
      <ul>
        {logs.map((log, i) => (
          <li key={i}>
            <strong>{log.type}</strong> [{log.timestamp}]:<br />
            {log.error}
            {log.context && <pre>{JSON.stringify(log.context, null, 2)}</pre>}
          </li>
        ))}
      </ul>
    </div>
  );
}
