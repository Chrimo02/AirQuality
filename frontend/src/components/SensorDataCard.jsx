import React from 'react';

export default function SensorDataCard({ label, value, unit }) {
  return (
    <div className="card">
      <h3>{label}</h3>
      <p style={{ fontSize: '1.5rem', margin: '0.5rem 0' }}>
        {value} {unit}
      </p>
    </div>
  );
}
