// src/components/SessionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSessionData } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

const COLORS = [
  '#ff7300', '#387908', '#8884d8',
  '#82ca9d', '#ffc658', '#d0ed57'
];

export default function SessionDetail() {
  const { sessionId } = useParams();
  const [data, setData] = useState([]);
  const [availableMetrics, setAvailableMetrics] = useState([]);
  const defaultMetrics = ['TEMP','HUMID','CO2eq','PM2.5','VOCAQI'];
  const [selectedMetrics, setSelectedMetrics] = useState(defaultMetrics);

  useEffect(() => {
    if (!sessionId) return;
    fetchSessionData(sessionId, 'minute').then(series => {
      const mapped = series.map(pt => ({
        ...pt,
        time: new Date(pt.timestamp).toLocaleTimeString([], {
          hour:'2-digit', minute:'2-digit'
        })
      }));
      setData(mapped);

      const mets = series.length
        ? Object.keys(series[0]).filter(k => k !== 'timestamp')
        : [];
      setAvailableMetrics(mets);
      setSelectedMetrics(mets.filter(m => defaultMetrics.includes(m)));
    });
  }, [sessionId]);

  const toggleMetric = metric => {
    setSelectedMetrics(prev =>
      prev.includes(metric)
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  return (
    <div className="card p-6 bg-white shadow-md rounded-lg">
      <h3 className="text-xl font-semibold mb-4">
        Session-Detail: {sessionId}
      </h3>

      {/* Metrik-Auswahl als Pill-Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {availableMetrics.map(metric => {
          const isSelected = selectedMetrics.includes(metric);
          return (
            <button
              key={metric}
              onClick={() => toggleMetric(metric)}
              className={
                (isSelected
                  ? 'bg-cyan-500 text-white'
                  : 'bg-gray-100 text-gray-700')
                + ' px-3 py-1 rounded-full text-sm shadow-sm'
              }
            >
              {metric}
            </button>
          );
        })}
      </div>

      {/* Dynamisches LineChart */}
      <div className="w-full h-80">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36} />
            {selectedMetrics.map((metric, i) => (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={COLORS[i % COLORS.length]}
                name={metric}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
