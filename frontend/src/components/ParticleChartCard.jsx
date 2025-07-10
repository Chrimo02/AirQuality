// src/components/ParticleChartCard.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function ParticleChartCard({ data, type = 'PC' }) {
  // Filter für PC oder PM
  const sizes = type === 'PC'
    ? ['0.1','0.3','0.5','1.0','2.5','5.0','10']
    : ['0.1','0.3','0.5','1.0','2.5','5.0','10'];

  // Baue Chart-Daten-Array
  const chartData = sizes.map(s => ({
    size: s,
    value: data[`${type}${s}`] ?? 0
  }));

  return (
    <div className="card border p-4">
      <h3 className="text-lg font-semibold mb-4">
        {type === 'PC' ? 'Partikel-Anzahl' : 'Partikel-Masse'}
      </h3>
      <div style={{ width: '100%', height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="size" label={{ value: `${type} (µm)`, position: 'bottom' }} />
            <YAxis />
            <Tooltip formatter={(v) => [v, type]} />
            <Bar dataKey="value" fill="#43c0ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
