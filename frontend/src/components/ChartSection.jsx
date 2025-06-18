import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function ChartSection({ historyData }) {
  const data = historyData.map(item => ({
    timeLabel: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    TEMP:  item.TEMP,
    HUMID: item.HUMID,
    CO2eq: item.CO2eq
  }));

  return (
    <div className="card" style={{ width: '100%', height: 300 }}>
      <h3>Verlauf</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timeLabel" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="TEMP"  name="Temperatur (°C)" />
          <Line type="monotone" dataKey="HUMID" name="Feuchte (%)" />
          <Line type="monotone" dataKey="CO2eq" name="CO₂-Äquivalent (ppm)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}