import React from 'react';

export default function SensorDataCard({ label, value, unit, timestamp }) {
  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="card">
      <h3>{label}</h3>
      <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
        {value} {unit}
      </p>
      {timeLabel && <small style={{ color: '#666' }}>zu {timeLabel}</small>}
    </div>
  );
}