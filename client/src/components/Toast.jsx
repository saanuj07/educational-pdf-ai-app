import React from 'react';

export default function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="toast">
      <span>{message}</span>
      <button onClick={onClose} className="toast-close">×</button>
    </div>
  );
}
