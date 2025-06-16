// src/components/ChartSection.jsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ChartSection({ historyData }) {
  const data = historyData.map(item => ({
    ...item,
    timeLabel: new Date(item.timestamp)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }));

  return (
    <div className="card" style={{ width: '100%', height: 300 }}>
      <h3>Sensorverlauf</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timeLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="co2" stroke="#ff7300" name="CO₂ (ppm)" />
          <Line type="monotone" dataKey="temp" stroke="#387908" name="Temperatur (°C)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
