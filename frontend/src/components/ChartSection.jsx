// src/components/ChartSection.jsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ChartSection({ historyData }) {
  const data = historyData.map(item => ({
    timeLabel: new Date(item.timestamp)
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    TEMP:  item.TEMP,
    HUMID: item.HUMID,
    CO2eq: item.CO2eq
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title">Verlauf</h3>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data} margin={{ top: 0, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timeLabel" />
          <YAxis />
          <Tooltip />
          <Legend
            verticalAlign="top"
            align="right"
            wrapperStyle={{
              padding: 0,
              fontSize: '0.8rem',
              color: '#1F2937'
            }}
          />
          <Line type="monotone" dataKey="TEMP"  stroke="#ff7300" name="Temperatur (°C)" />
          <Line type="monotone" dataKey="HUMID" stroke="#387908" name="Feuchte (%)" />
          <Line type="monotone" dataKey="CO2eq" stroke="#8884d8" name="CO₂-Äquivalent (ppm)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
